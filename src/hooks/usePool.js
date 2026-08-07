import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Lädt Kategorien, den kompletten Fragenpool und alle Quizze für den
 * Verwaltungsbereich. Kein Realtime hier – nach jeder Änderung wird
 * einfach neu geladen, das reicht für einen Editor, den man selbst bedient.
 *
 * `ownerId` (Profil-ID des eingeloggten Accounts) blendet private Quizze
 * anderer Admins sowie deren zugeordnete Fragen aus – rein auf Abfrage-Ebene
 * für die Verwaltungsoberfläche, nicht per RLS, da Spieler:innen und andere
 * Admins in einem laufenden Raum weiterhin ganz normal mitspielen können
 * müssen, auch wenn der Raum auf einem privaten Quiz basiert.
 */
export function usePool(ownerId) {
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [lockedQuestionIds, setLockedQuestionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    // Nur beim allerersten Laden den ganzen Verwaltungsbereich durch "Lade…"
    // ersetzen. Spätere Refreshes (z.B. nach dem Speichern einer Frage)
    // sollen die Daten still im Hintergrund austauschen, sonst würde
    // ManageScreen die Tabs kurz unmounten und lokalen UI-Zustand wie eine
    // offene Quiz-Zusammenstellung verlieren.
    if (!hasLoadedOnce.current) setLoading(true);
    const [categoriesRes, quizzesRes, lockedRes, questionsRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false })
        .or(`visibility.eq.public,owner_id.eq.${ownerId}`),
      // Fragen, die aktuell exklusiv einem privaten Quiz eines ANDEREN Admins
      // zugeordnet sind – die werden unten aus dem Pool herausgefiltert.
      supabase
        .from("quiz_questions")
        .select("question_id, quiz:quizzes!inner(visibility,owner_id)")
        .eq("quiz.visibility", "private")
        .neq("quiz.owner_id", ownerId),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
    ]);
    const lockedIdsArr = [...new Set((lockedRes.data || []).map((row) => row.question_id))];
    const lockedIds = new Set(lockedIdsArr);
    setCategories(categoriesRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setQuestions((questionsRes.data || []).filter((q) => !lockedIds.has(q.id)));
    setLockedQuestionIds(lockedIdsArr);
    setLoading(false);
    hasLoadedOnce.current = true;
  }, [ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, questions, quizzes, lockedQuestionIds, loading, refresh };
}
