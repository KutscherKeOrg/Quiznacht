import { Scoreboard } from "../components/Scoreboard";
import { C } from "../theme/colors";

export function EndScreen({ players, scores, youId, isHost, onRestart }) {
  const ranked = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const winner = ranked[0];

  return (
    <div className="text-center py-8">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: C.dim, letterSpacing: 2 }}>
        SIEGEREHRUNG
      </div>
      <div
        className="mt-2"
        style={{ fontFamily: "var(--font-display)", fontSize: 42, color: C.gold, textShadow: `0 0 40px ${C.gold}66` }}
      >
        {winner ? `${winner.name} 🏆` : "—"}
      </div>
      <div className="mx-auto mt-8 text-left" style={{ maxWidth: 440 }}>
        <Scoreboard players={players} scores={scores} youId={youId} big />
      </div>
      {isHost && (
        <button
          onClick={onRestart}
          className="mt-10 rounded-2xl px-8 py-3 font-bold focus:outline-none focus:ring-2"
          style={{ background: C.violet, color: "#fff" }}
        >
          Nochmal spielen
        </button>
      )}
    </div>
  );
}
