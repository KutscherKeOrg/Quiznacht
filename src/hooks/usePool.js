import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Lädt Kategorien, den kompletten Fragenpool und alle Quizze für den
 * Verwaltungsbereich. Kein Realtime hier – nach jeder Änderung wird
 * einfach neu geladen, das reicht für einen Editor, den man selbst bedient.
 */
export function usePool() {
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    // Nur beim allerersten Laden den ganzen Verwaltungsbereich durch "Lade…"
    // ersetzen. Spätere Refreshes (z.B. nach dem Speichern einer Frage)
    // sollen die Daten still im Hintergrund austauschen, sonst würde
    // ManageScreen die Tabs kurz unmounten und lokalen UI-Zustand wie eine
    // offene Quiz-Zusammenstellung verlieren.
    if (!hasLoadedOnce.current) setLoading(true);
    const [categoriesRes, questionsRes, quizzesRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories(categoriesRes.data || []);
    setQuestions(questionsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setLoading(false);
    hasLoadedOnce.current = true;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, questions, quizzes, loading, refresh };
}
