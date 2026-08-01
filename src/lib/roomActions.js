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

export async function joinRoom(roomId, name) {
  const { data, error } = await supabase
    .from("players")
    .insert({ room_id: roomId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function startQuiz(roomId) {
  const { error } = await supabase
    .from("rooms")
    .update({ phase: "question", current_question_index: 0, revealed: false, blur: 14, sound_playing: false })
    .eq("id", roomId);
  if (error) throw error;
}

export async function revealAnswer(roomId) {
  const { error } = await supabase.from("rooms").update({ revealed: true }).eq("id", roomId);
  if (error) throw error;
}

export async function nextQuestion(roomId, nextIndex, isLast) {
  const { error } = await supabase
    .from("rooms")
    .update(
      isLast
        ? { phase: "end" }
        : { current_question_index: nextIndex, revealed: false, blur: 14, sound_playing: false }
    )
    .eq("id", roomId);
  if (error) throw error;
}

export async function restartRoom(roomId) {
  const { error: deleteError } = await supabase.from("answers").delete().eq("room_id", roomId);
  if (deleteError) throw deleteError;
  const { error } = await supabase
    .from("rooms")
    .update({ phase: "lobby", current_question_index: 0, revealed: false, blur: 14, sound_playing: false })
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

export async function submitAnswer(roomId, questionId, playerId, value) {
  const { error } = await supabase
    .from("answers")
    .insert({ room_id: roomId, question_id: questionId, player_id: playerId, value: String(value) });
  if (error) throw error;
}
