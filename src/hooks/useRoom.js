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
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(Boolean(roomId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setPlayers([]);
      setQuestions([]);
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
              .order("order_index")
          : Promise.resolve({ data: [] }),
        supabase.from("answers").select("*").eq("room_id", roomId),
      ]);

      if (cancelled) return;
      setPlayers(playersRes.data || []);
      setQuestions((quizQuestionsRes.data || []).map((row) => row.question));
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
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const answersByQuestion = useMemo(() => {
    const map = {};
    answers.forEach((a) => {
      if (!map[a.question_id]) map[a.question_id] = {};
      map[a.question_id][a.player_id] = a.value;
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

  return { room, players, questions, answers, answersByQuestion, loading, error, refetchAnswers };
}
