import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { QUESTION_TYPES, PORTRAIT_DISPLAY_MODES } from "../../data/questionTypes";
import { createQuiz, deleteQuiz, addQuestionToQuiz, removeQuestionFromQuiz, updateQuestion } from "../../lib/poolActions";
import { QuestionDetails } from "./QuestionDetails";
import { QuestionForm } from "./QuestionForm";
import { C } from "../../theme/colors";

export function QuizzesTab({ pool }) {
  const { categories, questions, quizzes, refresh } = pool;
  const [newTitle, setNewTitle] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizQuestionIds, setQuizQuestionIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingQuestion, setEditingQuestion] = useState(null);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function loadQuizQuestions(quizId) {
    const { data } = await supabase
      .from("quiz_questions")
      .select("question_id")
      .eq("quiz_id", quizId)
      .order("order_index");
    setQuizQuestionIds((data || []).map((r) => r.question_id));
  }

  useEffect(() => {
    if (selectedQuizId) loadQuizQuestions(selectedQuizId);
    else setQuizQuestionIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuizId]);

  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const quizQuestions = quizQuestionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean);

  const poolCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (quizQuestionIds.includes(q.id)) return false;
      if (categoryFilter !== "all" && q.category_id !== categoryFilter) return false;
      if (typeFilter !== "all" && q.type !== typeFilter) return false;
      if (term && !q.prompt.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [questions, quizQuestionIds, categoryFilter, typeFilter, search]);

  async function handleCreateQuiz() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setError("");
    try {
      const quiz = await createQuiz(newTitle.trim());
      setNewTitle("");
      await refresh();
      setSelectedQuizId(quiz.id);
    } catch (err) {
      setError("Konnte nicht angelegt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteQuiz(id) {
    if (!confirm("Quiz wirklich löschen? Die Fragen bleiben im Pool erhalten.")) return;
    setBusy(true);
    setError("");
    try {
      await deleteQuiz(id);
      if (selectedQuizId === id) setSelectedQuizId(null);
      await refresh();
    } catch (err) {
      setError("Konnte nicht gelöscht werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(questionId) {
    setBusy(true);
    setError("");
    try {
      await addQuestionToQuiz(selectedQuizId, questionId);
      await loadQuizQuestions(selectedQuizId);
    } catch (err) {
      setError("Konnte nicht hinzugefügt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(questionId) {
    setBusy(true);
    setError("");
    try {
      await removeQuestionFromQuiz(selectedQuizId, questionId);
      await loadQuizQuestions(selectedQuizId);
    } catch (err) {
      setError("Konnte nicht entfernt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(fields) {
    setBusy(true);
    setError("");
    try {
      await updateQuestion(editingQuestion.id, fields);
      setEditingQuestion(null);
      await refresh();
    } catch (err) {
      setError("Konnte nicht gespeichert werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!selectedQuiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-6 mb-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: C.text }}>
            Neues Quiz
          </h2>
          <div className="flex gap-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Quizabend August"
              onKeyDown={(e) => e.key === "Enter" && handleCreateQuiz()}
              className="flex-1 rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            />
            <button
              disabled={busy || !newTitle.trim()}
              onClick={handleCreateQuiz}
              className="rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ background: C.gold, color: "#221D00" }}
            >
              Anlegen
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm mb-4 text-center" style={{ color: C.pink }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {quizzes.length === 0 && (
            <p className="text-center text-sm" style={{ color: C.dim }}>
              Noch keine Quizze angelegt.
            </p>
          )}
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span className="flex-1 font-semibold" style={{ color: C.text }}>
                {q.title}
              </span>
              <button
                onClick={() => setSelectedQuizId(q.id)}
                className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ background: C.violet + "33", color: C.violet }}
              >
                Fragen zusammenstellen
              </button>
              <button
                onClick={() => handleDeleteQuiz(q.id)}
                className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ background: C.pink + "22", color: C.pink }}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (editingQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        <QuestionForm
          categories={categories}
          initialQuestion={editingQuestion}
          onSave={handleSaveEdit}
          onCancel={() => setEditingQuestion(null)}
          busy={busy}
        />
        {error && (
          <p className="text-sm mt-3 text-center" style={{ color: C.pink }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={() => setSelectedQuizId(null)}
          className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim }}
        >
          ← Alle Quizze
        </button>
        <h2 className="font-bold text-lg" style={{ color: C.text }}>
          {selectedQuiz.title}
        </h2>
        <span className="text-sm" style={{ color: C.dim }}>
          {quizQuestions.length} Fragen
        </span>
      </div>

      {error && (
        <p className="text-sm mb-4 text-center" style={{ color: C.pink }}>
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: C.dim }}>
            IM QUIZ ({quizQuestions.length})
          </h3>
          <div className="flex flex-col gap-2">
            {quizQuestions.length === 0 && (
              <p className="text-sm" style={{ color: C.dim }}>
                Noch keine Fragen ausgewählt.
              </p>
            )}
            {quizQuestions.map((q, i) => {
              const cat = categoryById[q.category_id];
              const isExpanded = expandedIds.has(q.id);
              return (
                <div key={q.id}>
                  <div
                    className="rounded-lg px-3 py-2 flex items-center gap-2"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                  >
                    <span className="text-xs font-bold w-5" style={{ color: C.dim }}>
                      {i + 1}.
                    </span>
                    <button
                      onClick={() => toggleExpanded(q.id)}
                      className="shrink-0 text-sm focus:outline-none focus:ring-2"
                      style={{ color: C.dim }}
                      aria-label={isExpanded ? "Einklappen" : "Aufklappen"}
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>
                    {cat && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />}
                    {q.type === "portrait" && (
                      <span title={PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].label} className="shrink-0">
                        {PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].icon}
                      </span>
                    )}
                    <span
                      className="flex-1 text-sm truncate cursor-pointer"
                      onClick={() => toggleExpanded(q.id)}
                      style={{ color: C.text }}
                    >
                      {q.prompt}
                    </span>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded focus:outline-none focus:ring-2"
                      style={{ color: C.dim }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleRemove(q.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded focus:outline-none focus:ring-2"
                      style={{ color: C.pink }}
                    >
                      Entfernen
                    </button>
                  </div>
                  {isExpanded && <QuestionDetails question={q} />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: C.dim }}>
            AUS DEM POOL HINZUFÜGEN
          </h3>
          <div className="flex gap-2 mb-3 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            >
              <option value="all">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            >
              <option value="all">Alle Typen</option>
              {Object.entries(QUESTION_TYPES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche…"
              className="flex-1 min-w-[100px] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            />
          </div>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {poolCandidates.length === 0 && (
              <p className="text-sm" style={{ color: C.dim }}>
                Keine passenden Fragen im Pool.
              </p>
            )}
            {poolCandidates.map((q) => {
              const cat = categoryById[q.category_id];
              const isExpanded = expandedIds.has(q.id);
              return (
                <div key={q.id}>
                  <div
                    className="rounded-lg px-3 py-2 flex items-center gap-2"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                  >
                    <button
                      onClick={() => toggleExpanded(q.id)}
                      className="shrink-0 text-sm focus:outline-none focus:ring-2"
                      style={{ color: C.dim }}
                      aria-label={isExpanded ? "Einklappen" : "Aufklappen"}
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>
                    {cat && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />}
                    {q.type === "portrait" && (
                      <span title={PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].label} className="shrink-0">
                        {PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].icon}
                      </span>
                    )}
                    <span
                      className="flex-1 text-sm truncate cursor-pointer"
                      onClick={() => toggleExpanded(q.id)}
                      style={{ color: C.text }}
                    >
                      {q.prompt}
                    </span>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded focus:outline-none focus:ring-2"
                      style={{ color: C.dim }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleAdd(q.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded focus:outline-none focus:ring-2"
                      style={{ color: C.mint }}
                    >
                      + Hinzufügen
                    </button>
                  </div>
                  {isExpanded && <QuestionDetails question={q} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
