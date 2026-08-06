import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Lädt einen Raum samt Spieler:innen, Fragen und Antworten und hält sie
 * per Supabase Realtime synchron – das ist die einzige Quelle der Wahrheit,
 * die Host- und Spieler-Browser gemeinsam beobachten.
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [quizQuestionRows, setQuizQuestionRows] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(Boolean(roomId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setPlayers([]);
      setQuizQuestionRows([]);
      setAnswers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const { data: roomRow, error: roomErr } = await supabase
        .from("rooms")
        .select("*, quiz:quizzes(title)")
        .eq("id", roomId)
        .maybeSingle();

      if (cancelled) return;
      if (roomErr || !roomRow) {
        setError(roomErr?.message || "Raum wurde nicht gefunden.");
        setLoading(false);
        return;
      }
      setRoom(roomRow);

      const [playersRes, quizQuestionsRes, answersRes] = await Promise.all([
        supabase.from("players").select("*").eq("room_id", roomId).order("joined_at"),
        roomRow.quiz_id
          ? supabase
              .from("quiz_questions")
              .select("order_index, question:questions(*)")
              .eq("quiz_id", roomRow.quiz_id)
          : Promise.resolve({ data: [] }),
        supabase.from("answers").select("*").eq("room_id", roomId),
      ]);

      if (cancelled) return;
      setPlayers(playersRes.data || []);
      setQuizQuestionRows(quizQuestionsRes.data || []);
      setAnswers(answersRes.data || []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom((prev) => ({ ...payload.new, quiz: prev?.quiz }))
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setPlayers((prev) => (prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAnswers((prev) => (prev.some((a) => a.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAnswers((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAnswers((prev) => prev.map((a) => (a.id === payload.new.id ? payload.new : a)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Die Reihenfolge liegt in room.question_order (pro Raum gemischt beim
  // Erstellen/Neustarten) statt in quiz_questions.order_index, damit alle
  // Teilnehmer:innen dieselbe zufällige Reihenfolge sehen – der Raum wird
  // per Realtime synchron gehalten, die Frage-Zuordnung selbst ändert sich
  // während einer Sitzung nicht. Fällt auf order_index zurück für Räume,
  // die vor dieser Funktion angelegt wurden (question_order dann leer).
  const questions = useMemo(() => {
    if (quizQuestionRows.length === 0) return [];
    const byId = new Map(quizQuestionRows.map((row) => [row.question.id, row.question]));
    const orderedIds = room?.question_order?.length
      ? room.question_order
      : [...quizQuestionRows].sort((a, b) => a.order_index - b.order_index).map((row) => row.question.id);
    return orderedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [quizQuestionRows, room?.question_order]);

  const answersByQuestion = useMemo(() => {
    const map = {};
    answers.forEach((a) => {
      if (!map[a.question_id]) map[a.question_id] = {};
      map[a.question_id][a.player_id] = a.value;
    });
    return map;
  }, [answers]);

  // Separat von answersByQuestion gehalten (statt die Werte dort zu
  // Objekten umzubauen), damit alle bestehenden Konsumenten von
  // answersByQuestion unverändert weiter den rohen Antwort-Text bekommen.
  const elapsedByQuestion = useMemo(() => {
    const map = {};
    answers.forEach((a) => {
      if (!map[a.question_id]) map[a.question_id] = {};
      map[a.question_id][a.player_id] = a.elapsed_ms;
    });
    return map;
  }, [answers]);

  // Manuelle Host-Korrekturen (null/undefined = automatischer Abgleich gilt).
  const overridesByQuestion = useMemo(() => {
    const map = {};
    answers.forEach((a) => {
      if (!map[a.question_id]) map[a.question_id] = {};
      map[a.question_id][a.player_id] = a.correct_override;
    });
    return map;
  }, [answers]);

  /**
   * Erzwingt einen frischen Antworten-Abgleich mit der DB, statt auf das
   * Eintreffen des Realtime-Events zu warten. Für Moderator-Aktionen, die
   * mehrere Antworten auf einmal löschen (Skip/Zurück) und bei denen die
   * eigene Punkteberechnung sofort den korrekten Stand zeigen soll.
   */
  async function refetchAnswers() {
    if (!roomId) return;
    const { data } = await supabase.from("answers").select("*").eq("room_id", roomId);
    setAnswers(data || []);
  }

  return {
    room,
    players,
    questions,
    answers,
    answersByQuestion,
    elapsedByQuestion,
    overridesByQuestion,
    loading,
    error,
    refetchAnswers,
  };
}
