import { supabase } from "./supabaseClient";

/* ---------- Kategorien ---------- */

export async function createCategory(name, color) {
  const { data, error } = await supabase.from("categories").insert({ name, color }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, fields) {
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Medien-Upload (Portrait-Bilder, Sound-Dateien) ---------- */

export async function uploadQuestionMedia(file, mediaKind) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${mediaKind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("question-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("question-media").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- Fragenpool ---------- */

export async function createQuestion(question) {
  const { data, error } = await supabase.from("questions").insert(question).select().single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, fields) {
  const { error } = await supabase.from("questions").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Quizze & Quiz-Zusammenstellung ---------- */

export async function createQuiz(title) {
  const { data, error } = await supabase.from("quizzes").insert({ title }).select().single();
  if (error) throw error;
  return data;
}

export async function renameQuiz(id, title) {
  const { error } = await supabase.from("quizzes").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteQuiz(id) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) throw error;
}

export async function addQuestionToQuiz(quizId, questionId) {
  // order_index wird aus dem aktuellen Maximum abgeleitet; bei einer Kollision
  // (z.B. zwei schnelle Klicks) wird mit einem frischen Wert erneut versucht.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: last } = await supabase
      .from("quiz_questions")
      .select("order_index")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: false })
      .limit(1);
    const nextIndex = last && last.length > 0 ? last[0].order_index + 1 : 0;

    const { error } = await supabase
      .from("quiz_questions")
      .insert({ quiz_id: quizId, question_id: questionId, order_index: nextIndex });
    if (!error) return;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Konnte die Frage nach mehreren Versuchen nicht hinzufügen.");
}

export async function removeQuestionFromQuiz(quizId, questionId) {
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("quiz_id", quizId)
    .eq("question_id", questionId);
  if (error) throw error;
}
