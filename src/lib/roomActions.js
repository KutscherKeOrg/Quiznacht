import { supabase } from "./supabaseClient";

export async function createRoom(quizId) {
  const { data, error } = await supabase
    .from("rooms")
    .insert({ quiz_id: quizId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findRoomByCode(code) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinRoom(roomId, profileId, displayName) {
  const { data, error } = await supabase
    .from("players")
    .insert({ room_id: roomId, profile_id: profileId, name: displayName })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function startQuiz(roomId) {
  const { error } = await supabase
    .from("rooms")
    .update({
      phase: "question",
      current_question_index: 0,
      revealed: false,
      locked: false,
      blur: 14,
      sound_playing: false,
      question_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (error) throw error;
}

export async function lockAnswers(roomId) {
  const { error } = await supabase.from("rooms").update({ locked: true }).eq("id", roomId);
  if (error) throw error;
}

export async function revealAnswer(roomId) {
  const { error } = await supabase.from("rooms").update({ revealed: true }).eq("id", roomId);
  if (error) throw error;
}

export async function nextQuestion(roomId, nextIndex) {
  const { error } = await supabase
    .from("rooms")
    .update({
      current_question_index: nextIndex,
      revealed: false,
      locked: false,
      blur: 14,
      sound_playing: false,
      question_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (error) throw error;
}

/**
 * Überspringt die aktuelle Frage ohne Wertung: löscht bereits abgegebene
 * Antworten dafür (damit sie nicht rückwirkend zählt) und rückt vor.
 */
export async function skipQuestion(roomId, questionId) {
  const { error } = await supabase.from("answers").delete().eq("room_id", roomId).eq("question_id", questionId);
  if (error) throw error;
}

/**
 * Springt zur vorherigen Frage zurück und setzt sie für eine saubere
 * Wiederholung zurück. Löscht die Antworten der verlassenen UND der
 * Zielfrage, damit niemand als "schon beantwortet" hängen bleibt.
 */
export async function goToPreviousQuestion(roomId, questionIdsToReset, targetIndex) {
  if (questionIdsToReset.length > 0) {
    const { error: deleteError } = await supabase
      .from("answers")
      .delete()
      .eq("room_id", roomId)
      .in("question_id", questionIdsToReset);
    if (deleteError) throw deleteError;
  }
  const { error } = await supabase
    .from("rooms")
    .update({
      current_question_index: targetIndex,
      revealed: false,
      locked: false,
      blur: 14,
      sound_playing: false,
      question_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (error) throw error;
}

/**
 * Beendet ein Spiel: setzt die Phase auf 'end', speichert die Endplatzierung
 * je Spieler:in (für die "meiste Siege"-Statistik) und markiert alle Fragen
 * des Quiz im Pool als gespielt.
 * @param {{ profileId: string, playerName: string, score: number, rank: number }[]} results
 */
export async function finishRoom(roomId, quizId, results) {
  const { error: roomErr } = await supabase.from("rooms").update({ phase: "end" }).eq("id", roomId);
  if (roomErr) throw roomErr;

  if (results.length > 0) {
    const { error: resultsErr } = await supabase
      .from("room_results")
      .upsert(
        results.map((r) => ({
          room_id: roomId,
          profile_id: r.profileId,
          player_name: r.playerName,
          score: r.score,
          rank: r.rank,
        })),
        { onConflict: "room_id,profile_id" }
      );
    if (resultsErr) throw resultsErr;
  }

  await markQuestionsPlayed(quizId);
}

/**
 * Markiert alle Fragen eines Quiz im Pool als gespielt (last_played_at = jetzt),
 * damit die automatische Zusammenstellung sie standardmäßig ausschließen kann.
 */
async function markQuestionsPlayed(quizId) {
  const { data: quizQuestions, error: fetchError } = await supabase
    .from("quiz_questions")
    .select("question_id")
    .eq("quiz_id", quizId);
  if (fetchError) throw fetchError;

  const questionIds = (quizQuestions || []).map((row) => row.question_id);
  if (questionIds.length === 0) return;

  const { error } = await supabase
    .from("questions")
    .update({ last_played_at: new Date().toISOString() })
    .in("id", questionIds);
  if (error) throw error;
}

export async function restartRoom(roomId) {
  const { error: deleteError } = await supabase.from("answers").delete().eq("room_id", roomId);
  if (deleteError) throw deleteError;
  const { error } = await supabase
    .from("rooms")
    .update({
      phase: "lobby",
      current_question_index: 0,
      revealed: false,
      locked: false,
      blur: 14,
      sound_playing: false,
      question_started_at: null,
    })
    .eq("id", roomId);
  if (error) throw error;
}

export async function updateBlur(roomId, blur) {
  const { error } = await supabase.from("rooms").update({ blur }).eq("id", roomId);
  if (error) throw error;
}

export async function setSoundPlaying(roomId, playing) {
  const { error } = await supabase.from("rooms").update({ sound_playing: playing }).eq("id", roomId);
  if (error) throw error;
}

export async function submitAnswer(roomId, questionId, playerId, value, elapsedMs) {
  const { error } = await supabase
    .from("answers")
    .insert({
      room_id: roomId,
      question_id: questionId,
      player_id: playerId,
      value: String(value),
      elapsed_ms: elapsedMs ?? null,
    });
  if (error) throw error;
}

/**
 * Host-Korrektur: übersteuert den automatischen Abgleich für eine einzelne
 * Antwort. `override` ist true/false für "manuell richtig/falsch" oder
 * null, um wieder zum automatischen Abgleich zurückzukehren.
 */
export async function setAnswerOverride(roomId, questionId, playerId, override) {
  const { error } = await supabase
    .from("answers")
    .update({ correct_override: override })
    .eq("room_id", roomId)
    .eq("question_id", questionId)
    .eq("player_id", playerId);
  if (error) throw error;
}
