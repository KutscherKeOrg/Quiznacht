import { QUESTION_TYPES } from "../data/questionTypes";
import { C } from "../theme/colors";

export function LobbyScreen({ code, players, isHost, canStart, onStart }) {
  return (
    <div className="text-center py-10">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: C.text, lineHeight: 1.1 }}>
        Freitags-<span style={{ color: C.gold }}>Quiz</span>
      </div>
      <p className="mt-3" style={{ color: C.dim }}>
        Raumcode:{" "}
        <span className="font-bold tracking-widest" style={{ color: C.gold, fontSize: 22 }}>
          {code}
        </span>
      </p>
      <div className="flex justify-center gap-3 mt-8 flex-wrap">
        {players.length === 0 ? (
          <p style={{ color: C.dim }}>Noch niemand da – teile den Raumcode {code}</p>
        ) : (
          players.map((p, i) => (
            <div
              key={p.id}
              className="rounded-xl px-5 py-3 font-semibold"
              style={{
                background: C.panelSoft,
                border: `1px solid ${C.line}`,
                color: C.text,
                animation: `qz-pop .4s ease ${i * 0.12}s both`,
              }}
            >
              {p.name}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center gap-2 mt-6 flex-wrap">
        {Object.values(QUESTION_TYPES).map((c) => (
          <span key={c.label} className="text-xs rounded-full px-3 py-1" style={{ background: c.color + "22", color: c.color }}>
            {c.label}
          </span>
        ))}
      </div>
      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="mt-10 rounded-2xl px-10 py-4 text-lg font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ background: C.gold, color: "#221D00", boxShadow: `0 0 40px ${C.gold}44` }}
        >
          Quiz starten
        </button>
      ) : (
        <p className="mt-10 text-sm" style={{ color: C.dim }}>
          Warten auf den Host…
        </p>
      )}
    </div>
  );
}
