import { useEffect, useState } from "react";
import { C } from "../theme/colors";

export function StartScreen({ quizzes, onCreateRoom, onJoinRoom, busy, errorMessage }) {
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? "");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Die Quiz-Liste lädt asynchron nach dem ersten Render nach.
  useEffect(() => {
    if (!selectedQuizId && quizzes.length > 0) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [quizzes, selectedQuizId]);

  const canCreate = Boolean(selectedQuizId) && !busy;
  const canJoin = joinName.trim().length > 0 && joinCode.trim().length === 6 && !busy;

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: C.text, lineHeight: 1.1 }}>
          Willkommen bei <span style={{ color: C.gold }}>Quiznacht</span>
        </div>
        <p className="mt-3" style={{ color: C.dim }}>
          Als Host einen Raum eröffnen oder mit Namen &amp; Raumcode beitreten
        </p>
      </div>

      {errorMessage && (
        <p className="text-center text-sm mb-6" style={{ color: C.pink }}>
          {errorMessage}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        <div className="rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: C.text }}>
            Host
          </h2>
          {quizzes.length === 0 ? (
            <p className="text-sm" style={{ color: C.dim }}>
              Noch kein Quiz in der Datenbank. Leg eins über den Supabase SQL-Editor an (siehe{" "}
              <code>supabase/seed.sql</code>).
            </p>
          ) : (
            <>
              <label className="block text-xs mb-2" style={{ color: C.dim }}>
                Quiz auswählen
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              <button
                disabled={!canCreate}
                onClick={() => onCreateRoom(selectedQuizId)}
                className="w-full rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ background: C.gold, color: "#221D00" }}
              >
                Raum erstellen
              </button>
            </>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: C.text }}>
            Mitspielen
          </h2>
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Dein Name
          </label>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="z.B. Lena"
            className="w-full rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          />
          <label className="block text-xs mb-2" style={{ color: C.dim }}>
            Raumcode
          </label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="z.B. AB3D9K"
            maxLength={6}
            className="w-full rounded-xl px-4 py-3 mb-4 tracking-widest text-center font-bold focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
          />
          <button
            disabled={!canJoin}
            onClick={() => onJoinRoom(joinCode.trim(), joinName.trim())}
            className="w-full rounded-xl px-5 py-3 font-bold focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ background: C.violet, color: "#fff" }}
          >
            Beitreten
          </button>
        </div>
      </div>
    </div>
  );
}
