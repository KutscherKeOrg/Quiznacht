import { useMemo, useState } from "react";
import { QUESTION_TYPES } from "../../data/questionTypes";
import { createQuestion, updateQuestion, deleteQuestion, bulkDeleteQuestions, bulkAssignCategory } from "../../lib/poolActions";
import { QuestionForm } from "./QuestionForm";
import { QuestionDetails } from "./QuestionDetails";
import { BulkImportForm } from "./BulkImportForm";
import { WhatsAppImportForm } from "./WhatsAppImportForm";
import { C } from "../../theme/colors";

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function QuestionsTab({ pool }) {
  const { categories, questions, refresh } = pool;
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("list"); // 'list' | 'create' | { edit: question }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (categoryFilter !== "all" && q.category_id !== categoryFilter) return false;
      if (typeFilter !== "all" && q.type !== typeFilter) return false;
      if (term) {
        const haystack = [q.prompt, q.message, ...(q.options || [])].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [questions, categoryFilter, typeFilter, search]);

  async function handleSave(fields) {
    setBusy(true);
    setError("");
    try {
      if (mode !== "create" && mode?.edit) {
        await updateQuestion(mode.edit.id, fields);
      } else {
        await createQuestion(fields);
      }
      setMode("list");
      await refresh();
    } catch (err) {
      setError("Konnte nicht gespeichert werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Frage wirklich löschen?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteQuestion(id);
      await refresh();
    } catch (err) {
      setError("Konnte nicht gelöscht werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map((q) => q.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.size} Fragen wirklich löschen?`)) return;
    setBusy(true);
    setError("");
    try {
      await bulkDeleteQuestions([...selectedIds]);
      setSelectedIds(new Set());
      await refresh();
    } catch (err) {
      setError("Konnte nicht gelöscht werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkAssignCategory() {
    if (!bulkCategoryId) return;
    setBusy(true);
    setError("");
    try {
      await bulkAssignCategory([...selectedIds], bulkCategoryId);
      setSelectedIds(new Set());
      setBulkCategoryId("");
      await refresh();
    } catch (err) {
      setError("Konnte nicht zugewiesen werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "create" || mode?.edit) {
    return (
      <div className="max-w-2xl mx-auto">
        <QuestionForm
          categories={categories}
          initialQuestion={mode?.edit ?? null}
          onSave={handleSave}
          onCancel={() => setMode("list")}
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

  if (mode === "bulk") {
    return (
      <BulkImportForm
        categories={categories}
        onCancel={() => setMode("list")}
        onDone={async () => {
          setMode("list");
          await refresh();
        }}
      />
    );
  }

  if (mode === "whatsapp") {
    return (
      <WhatsAppImportForm
        onExit={async () => {
          setMode("list");
          await refresh();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-3 flex-wrap flex-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2"
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
            className="rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          >
            <option value="all">Alle Fragetypen</option>
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
            className="rounded-xl px-4 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMode("whatsapp")}
            className="rounded-xl px-5 py-2 font-bold focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.mint, border: `1px solid ${C.line}` }}
          >
            WhatsApp-Import
          </button>
          <button
            onClick={() => setMode("bulk")}
            disabled={categories.length === 0}
            className="rounded-xl px-5 py-2 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.panelSoft, color: C.violet, border: `1px solid ${C.line}` }}
          >
            Bulk-Import
          </button>
          <button
            onClick={() => setMode("create")}
            disabled={categories.length === 0}
            className="rounded-xl px-5 py-2 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.gold, color: "#221D00" }}
          >
            + Neue Frage
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="text-center text-sm mb-6" style={{ color: C.dim }}>
          Legt zuerst eine Kategorie an, bevor ihr Fragen erstellt.
        </p>
      )}

      {error && (
        <p className="text-sm mb-4 text-center" style={{ color: C.pink }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex gap-2">
          <button
            onClick={selectAllFiltered}
            disabled={filtered.length === 0}
            className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            Alle auswählen
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
            className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            Auswahl aufheben
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: C.dim }}>
              {selectedIds.size} ausgewählt
            </span>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            >
              <option value="">Kategorie wählen…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !bulkCategoryId}
              onClick={handleBulkAssignCategory}
              className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ background: C.violet + "33", color: C.violet }}
            >
              Zuweisen
            </button>
            <button
              disabled={busy}
              onClick={handleBulkDelete}
              className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ background: C.pink + "22", color: C.pink }}
            >
              Ausgewählte löschen
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm" style={{ color: C.dim }}>
            Keine Fragen gefunden.
          </p>
        )}
        {filtered.map((q) => {
          const cat = categoryById[q.category_id];
          const typeMeta = QUESTION_TYPES[q.type];
          const playedDate = formatDate(q.last_played_at);
          const isExpanded = expandedIds.has(q.id);
          return (
            <div key={q.id}>
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(q.id)}
                  onChange={() => toggleSelected(q.id)}
                  className="w-4 h-4 shrink-0"
                />
                <button
                  onClick={() => toggleExpanded(q.id)}
                  className="shrink-0 w-5 text-sm focus:outline-none focus:ring-2"
                  style={{ color: C.dim }}
                  aria-label={isExpanded ? "Einklappen" : "Aufklappen"}
                >
                  {isExpanded ? "▾" : "▸"}
                </button>
                <span
                  className="text-xs font-semibold uppercase rounded-full px-2 py-1 shrink-0"
                  style={{ background: typeMeta.color + "22", color: typeMeta.color }}
                >
                  {typeMeta.label}
                </span>
                {cat && (
                  <span className="text-xs font-semibold rounded-full px-2 py-1 shrink-0" style={{ background: cat.color + "22", color: cat.color }}>
                    {cat.name}
                  </span>
                )}
                <span
                  className="flex-1 min-w-[200px] text-sm truncate cursor-pointer"
                  onClick={() => toggleExpanded(q.id)}
                  style={{ color: C.text }}
                >
                  {q.prompt}
                </span>
                <span className="text-xs shrink-0" style={{ color: playedDate ? C.mint : C.dim }}>
                  {playedDate ? `Gespielt am ${playedDate}` : "Ungespielt"}
                </span>
                <button
                  onClick={() => setMode({ edit: q })}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ background: C.panelSoft, color: C.dim }}
                >
                  Bearbeiten
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleDelete(q.id)}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ background: C.pink + "22", color: C.pink }}
                >
                  Löschen
                </button>
              </div>
              {isExpanded && <QuestionDetails question={q} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
