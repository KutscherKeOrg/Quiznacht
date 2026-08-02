import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Lädt alle Rohdaten, die für die Statistik-Seite gebraucht werden. Kein
 * Realtime hier – die Seite wird beim Öffnen einmal frisch geladen.
 */
export function useStats() {
  const [profiles, setProfiles] = useState([]);
  const [roomResults, setRoomResults] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [p, rr, a, pl, q, c] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("room_results").select("*"),
      supabase.from("answers").select("id, room_id, question_id, player_id, value, elapsed_ms"),
      supabase.from("players").select("id, profile_id"),
      supabase.from("questions").select("id, type, category_id, correct_answer, correct_value"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProfiles(p.data || []);
    setRoomResults(rr.data || []);
    setAnswers(a.data || []);
    setPlayers(pl.data || []);
    setQuestions(q.data || []);
    setCategories(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profiles, roomResults, answers, players, questions, categories, loading, refresh };
}
