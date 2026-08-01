import { useCallback, useEffect, useState } from "react";
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

  const refresh = useCallback(async () => {
    setLoading(true);
    const [categoriesRes, questionsRes, quizzesRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories(categoriesRes.data || []);
    setQuestions(questionsRes.data || []);
    setQuizzes(quizzesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, questions, quizzes, loading, refresh };
}
