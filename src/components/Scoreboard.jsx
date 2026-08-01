import { C } from "../theme/colors";

export function Scoreboard({ players, scores, youId, big }) {
  const max = Math.max(100, ...Object.values(scores));
  const ranked = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  return (
    <div className="flex flex-col gap-3">
      {ranked.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3">
          <span
            className="w-6 text-right font-bold"
            style={{ color: i === 0 ? C.gold : C.dim, fontSize: big ? 18 : 13 }}
          >
            {i + 1}.
          </span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span style={{ color: p.id === youId ? C.gold : C.text, fontWeight: 600, fontSize: big ? 17 : 14 }}>
                {p.name}
                {p.id === youId && <span style={{ color: C.dim, fontWeight: 400 }}> (du)</span>}
              </span>
              <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums", fontSize: big ? 16 : 13 }}>
                {scores[p.id] || 0}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${((scores[p.id] || 0) / max) * 100}%`,
                  background: i === 0 ? C.gold : C.violet,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
