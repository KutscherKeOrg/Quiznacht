import { useMemo, useState } from "react";
import { QUESTION_TYPES } from "../../data/questionTypes";
import { createQuestion, updateQuestion } from "../../lib/poolActions";
import { QuestionForm } from "./QuestionForm";
import { CategoryQuestionsSection } from "./CategoryQuestionsSection";
import { BulkImportForm } from "./BulkImportForm";
import { WhatsAppImportForm } from "./WhatsAppImportForm";
import { C } from "../../theme/colors";

const UNCATEGORIZED = { id: null, name: "Ohne Kategorie", color: C.dim };

export function QuestionsTab({ pool }) {
  const { categories, questions, lockedQuestionIds, refresh } = pool;
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("list"); // 'list' | 'create' | { edit: question }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());
  const [refreshTick, setRefreshTick] = useState(0);

  // Statistiken kommen aus dem ohnehin schon geladenen pool.questions -
  // rein clientseitig aus dem Speicher berechnet, keine extra Abfrage.
  // Nur die eigentlichen Fragenlisten je aufgeklappter Kategorie werden
  // unten seitenweise vom Server nachgeladen.
  const stats = useMemo(() => {
    const byCategory = {};
    const byType = {};
    let unplayed = 0;
    questions.forEach((q) => {
      const key = q.category_id ?? "none";
      if (!byCategory[key]) byCategory[key] = { total: 0, unplayed: 0 };
      byCategory[key].total++;
      if (!q.last_played_at) {
        byCategory[key].unplayed++;
        unplayed++;
      }
      byType[q.type] = (byType[q.type] || 0) + 1;
    });
    return { total: questions.length, unplayed, byCategory, byType };
  }, [questions]);

  const sections = useMemo(() => {
    const list = [...categories];
    if (stats.byCategory.none?.total > 0) list.push(UNCATEGORIZED);
    return list;
  }, [categories, stats]);

  async function notifyMutated() {
    setRefreshTick((t) => t + 1);
    await refresh();
  }

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
      await notifyMutated();
    } catch (err) {
      setError("Konnte nicht gespeichert werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleCategoryExpanded(id) {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
          await notifyMutated();
        }}
      />
    );
  }

  if (mode === "whatsapp") {
    return (
      <WhatsAppImportForm
        onExit={async () => {
          setMode("list");
          await notifyMutated();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-3 flex-wrap flex-1">
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

      <div className="rounded-2xl p-5 mb-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-baseline gap-6 mb-4 flex-wrap">
          <div>
            <div className="text-2xl font-bold" style={{ color: C.text }}>
              {stats.total}
            </div>
            <div className="text-xs" style={{ color: C.dim }}>
              Fragen insgesamt
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: C.mint }}>
              {stats.unplayed}
            </div>
            <div className="text-xs" style={{ color: C.dim }}>
              ungespielt
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {sections.map((c) => (
            <span
              key={c.id ?? "none"}
              className="text-xs font-semibold rounded-full px-2 py-1"
              style={{ background: c.color + "22", color: c.color }}
            >
              {c.name}: {stats.byCategory[c.id ?? "none"]?.total ?? 0}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(QUESTION_TYPES).map(([key, meta]) => (
            <span
              key={key}
              className="text-xs font-semibold rounded-full px-2 py-1"
              style={{ background: meta.color + "22", color: meta.color }}
            >
              {meta.label}: {stats.byType[key] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {sections.length === 0 && (
          <p className="text-center text-sm" style={{ color: C.dim }}>
            Noch keine Kategorien angelegt.
          </p>
        )}
        {sections.map((c) => {
          const key = c.id ?? "none";
          const isExpanded = expandedCategoryIds.has(key);
          const count = stats.byCategory[key]?.total ?? 0;
          return (
            <div key={key} className="rounded-xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <button
                onClick={() => toggleCategoryExpanded(key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left focus:outline-none focus:ring-2"
              >
                <span className="text-sm shrink-0" style={{ color: C.dim }}>
                  {isExpanded ? "▾" : "▸"}
                </span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="font-semibold" style={{ color: C.text }}>
                  {c.name}
                </span>
                <span className="text-sm" style={{ color: C.dim }}>
                  ({count})
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4">
                  <CategoryQuestionsSection
                    category={c}
                    categories={categories}
                    typeFilter={typeFilter}
                    search={search}
                    lockedQuestionIds={lockedQuestionIds}
                    refreshTick={refreshTick}
                    onEdit={(q) => setMode({ edit: q })}
                    onMutated={notifyMutated}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
