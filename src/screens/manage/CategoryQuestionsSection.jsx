import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { QUESTION_TYPES, PORTRAIT_DISPLAY_MODES } from "../../data/questionTypes";
import { deleteQuestion, bulkDeleteQuestions, bulkAssignCategory } from "../../lib/poolActions";
import { QuestionDetails } from "./QuestionDetails";
import { C } from "../../theme/colors";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Fragen einer einzelnen Kategorie, serverseitig seitenweise nachgeladen
 * (statt die ganze Kategorie auf einmal zu holen) – wird nur gemountet,
 * solange der Abschnitt in QuestionsTab aufgeklappt ist. Auswahl, Seite und
 * Seitengröße sind bewusst lokal je Kategorie-Abschnitt, nicht global.
 */
export function CategoryQuestionsSection({
  category,
  categories,
  typeFilter,
  search,
  lockedQuestionIds,
  refreshTick,
  onEdit,
  onMutated,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [busy, setBusy] = useState(false);

  // Filter/Seitengröße-Wechsel: zurück auf Seite 1, sonst könnte man auf
  // einer nun nicht mehr existierenden Seite landen.
  useEffect(() => {
    setPage(1);
  }, [typeFilter, search, pageSize]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPage() {
      setSectionLoading(true);
      setError("");
      let query = supabase
        .from("questions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      query = category.id ? query.eq("category_id", category.id) : query.is("category_id", null);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      const term = search.trim();
      if (term) query = query.or(`prompt.ilike.%${term}%,message.ilike.%${term}%`);
      if (lockedQuestionIds.length > 0) query = query.not("id", "in", `(${lockedQuestionIds.join(",")})`);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error: fetchError } = await query;
      if (cancelled) return;
      if (fetchError) {
        setError("Konnte Fragen nicht laden: " + fetchError.message);
        setSectionLoading(false);
        return;
      }
      // Leere Seite nach einer Löschung (z.B. letzte Frage auf der letzten
      // Seite entfernt) -> eine Seite zurück statt einer leeren Ansicht.
      if ((data || []).length === 0 && page > 1) {
        setPage((p) => p - 1);
        return;
      }
      setRows(data || []);
      setTotalCount(count ?? 0);
      // Auswahl bezieht sich nur auf die aktuell angezeigte Seite - bei
      // jedem neu geladenen Seiteninhalt verwerfen, sonst würde die
      // Aktionsleiste eine "X auf dieser Seite"-Auswahl zeigen, die längst
      // nicht mehr angezeigt wird.
      setSelectedIds(new Set());
      setSectionLoading(false);
    }

    fetchPage();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, typeFilter, search, page, pageSize, lockedQuestionIds, refreshTick]);

  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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

  function selectAllOnPage() {
    setSelectedIds(new Set(rows.map((q) => q.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDelete(id) {
    if (!confirm("Frage wirklich löschen?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteQuestion(id);
      await onMutated();
    } catch (err) {
      setError("Konnte nicht gelöscht werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.size} Fragen wirklich löschen?`)) return;
    setBusy(true);
    setError("");
    try {
      await bulkDeleteQuestions([...selectedIds]);
      setSelectedIds(new Set());
      await onMutated();
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
      await onMutated();
    } catch (err) {
      setError("Konnte nicht zugewiesen werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-3">
      {error && (
        <p className="text-sm text-center" style={{ color: C.pink }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={selectAllOnPage}
            disabled={rows.length === 0}
            className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            Seite auswählen
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
              {selectedIds.size} auf dieser Seite ausgewählt
              {totalCount > selectedIds.size && ` – ${totalCount} insgesamt in dieser Kategorie`}
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

      {sectionLoading ? (
        <p className="text-center text-sm py-6" style={{ color: C.dim }}>
          Lädt…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm py-6" style={{ color: C.dim }}>
          Keine Fragen gefunden.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((q) => {
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
                  {q.type === "portrait" && (
                    <span
                      className="text-xs rounded-full px-2 py-1 shrink-0"
                      title={PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].label}
                      style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
                    >
                      {PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].icon}{" "}
                      {PORTRAIT_DISPLAY_MODES[q.portrait_display_mode ?? "blur"].label}
                    </span>
                  )}
                  {cat && (
                    <span
                      className="text-xs font-semibold rounded-full px-2 py-1 shrink-0"
                      style={{ background: cat.color + "22", color: cat.color }}
                    >
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
                    onClick={() => onEdit(q)}
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
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.dim }}>
          <span>Pro Seite:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg px-2 py-1 focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || sectionLoading}
            className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-40"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            ← Zurück
          </button>
          <span className="text-xs" style={{ color: C.dim }}>
            Seite {page} von {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || sectionLoading}
            className="text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-40"
            style={{ background: C.panelSoft, color: C.dim }}
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}
