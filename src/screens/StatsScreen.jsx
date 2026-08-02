import { useMemo, useState } from "react";
import { useStats } from "../hooks/useStats";
import { computeWinCounts, computeSpeedStats, computeCategoryRanking } from "../lib/statsLogic";
import { C } from "../theme/colors";

const TABS = [
  ["wins", "Siege"],
  ["speed", "Antwortzeiten"],
  ["categories", "Kategorien"],
];

function formatMs(ms) {
  return (ms / 1000).toFixed(1) + "s";
}

function RankedList({ rows, renderValue }) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: C.dim }}>
        Noch keine Daten.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div
          key={row.profile.id}
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <span className="w-6 text-right font-bold" style={{ color: i === 0 ? C.gold : C.dim }}>
            {i + 1}.
          </span>
          <span className="flex-1 font-semibold" style={{ color: C.text }}>
            {row.profile.display_name}
          </span>
          {renderValue(row)}
        </div>
      ))}
    </div>
  );
}

export function StatsScreen() {
  const [tab, setTab] = useState("wins");
  const [categoryId, setCategoryId] = useState("");
  const stats = useStats();

  const wins = useMemo(() => computeWinCounts(stats.roomResults, stats.profiles), [stats.roomResults, stats.profiles]);
  const speed = useMemo(() => computeSpeedStats(stats.answers, stats.players, stats.profiles), [
    stats.answers,
    stats.players,
    stats.profiles,
  ]);
  const fastest = useMemo(() => [...speed].sort((a, b) => a.avgMs - b.avgMs), [speed]);
  const slowest = useMemo(() => [...speed].sort((a, b) => b.avgMs - a.avgMs), [speed]);

  const activeCategoryId = categoryId || stats.categories[0]?.id || "";
  const categoryTotals = useMemo(
    () => computeCategoryRanking(stats.answers, stats.players, stats.questions, activeCategoryId),
    [stats.answers, stats.players, stats.questions, activeCategoryId]
  );
  const profileById = useMemo(() => {
    const map = {};
    stats.profiles.forEach((p) => (map[p.id] = p));
    return map;
  }, [stats.profiles]);
  const categoryRanking = useMemo(
    () =>
      Object.entries(categoryTotals)
        .map(([profileId, points]) => ({ profile: profileById[profileId], points }))
        .filter((row) => row.profile)
        .sort((a, b) => b.points - a.points),
    [categoryTotals, profileById]
  );

  if (stats.loading) {
    return (
      <p className="text-center py-20" style={{ color: C.dim }}>
        Lade Statistiken…
      </p>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
            style={{
              background: tab === key ? C.violet : C.panelSoft,
              color: tab === key ? "#fff" : C.dim,
              border: `1px solid ${C.line}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto">
        {tab === "wins" && (
          <>
            <h2 className="text-xs font-bold tracking-widest mb-4 text-center" style={{ color: C.dim }}>
              MEISTE SIEGE
            </h2>
            <RankedList rows={wins} renderValue={(row) => <span style={{ color: C.gold }}>{row.wins} 🏆</span>} />
          </>
        )}

        {tab === "speed" && (
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-bold tracking-widest mb-4 text-center" style={{ color: C.dim }}>
                SCHNELLSTE ANTWORTEN
              </h2>
              <RankedList rows={fastest} renderValue={(row) => <span style={{ color: C.mint }}>{formatMs(row.avgMs)}</span>} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-widest mb-4 text-center" style={{ color: C.dim }}>
                LANGSAMSTE ANTWORTEN
              </h2>
              <RankedList rows={slowest} renderValue={(row) => <span style={{ color: C.pink }}>{formatMs(row.avgMs)}</span>} />
            </div>
          </div>
        )}

        {tab === "categories" && (
          <>
            {stats.categories.length === 0 ? (
              <p className="text-center text-sm" style={{ color: C.dim }}>
                Noch keine Kategorien angelegt.
              </p>
            ) : (
              <>
                <select
                  value={activeCategoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
                >
                  {stats.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <RankedList
                  rows={categoryRanking}
                  renderValue={(row) => <span style={{ color: C.dim }}>{row.points} Pkt.</span>}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
