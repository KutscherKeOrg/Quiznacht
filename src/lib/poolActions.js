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
  const { count } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);
  const { error } = await supabase
    .from("quiz_questions")
    .insert({ quiz_id: quizId, question_id: questionId, order_index: count || 0 });
  if (error) throw error;
}

export async function removeQuestionFromQuiz(quizId, questionId) {
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("quiz_id", quizId)
    .eq("question_id", questionId);
  if (error) throw error;
}
