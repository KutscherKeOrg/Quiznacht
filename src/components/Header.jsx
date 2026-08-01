import { C } from "../theme/colors";

export function Header({ code, onLeave }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            color: C.gold,
            letterSpacing: 1,
            textShadow: `0 0 24px ${C.gold}55`,
          }}
        >
          QUIZNACHT
        </span>
        {code && (
          <span className="text-xs rounded-md px-2 py-1" style={{ background: C.panelSoft, color: C.dim }}>
            Raum: {code}
          </span>
        )}
      </div>
      {onLeave && (
        <button
          onClick={onLeave}
          className="text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
        >
          Verlassen
        </button>
      )}
    </div>
  );
}
