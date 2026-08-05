import { isAnswerCorrect } from "../lib/quizLogic";
import { C } from "../theme/colors";

/**
 * Wer hatte recht, wer lag falsch – nach dem Auflösen sowohl im HostPanel
 * als auch im PlayerPanel verwendet. Schätzfragen haben kein binäres
 * richtig/falsch, daher hier stattdessen nach Nähe sortiert.
 */
export function AnswerResultsList({ question, players, qAnswers, lastPts }) {
  const answered = players.filter((p) => qAnswers[p.id] !== undefined);

  if (answered.length === 0) {
    return (
      <p className="text-sm text-center" style={{ color: C.dim }}>
        Niemand hat geantwortet.
      </p>
    );
  }

  if (question.type === "schaetzfrage") {
    const sorted = [...answered].sort(
      (a, b) =>
        Math.abs(Number(qAnswers[a.id]) - question.correct_value) -
        Math.abs(Number(qAnswers[b.id]) - question.correct_value)
    );
    return (
      <div className="flex flex-col gap-2">
        {sorted.map((p) => (
          <div key={p.id} className="flex justify-between text-sm rounded-lg px-3 py-2" style={{ background: C.panelSoft }}>
            <span style={{ color: C.text }}>{p.name}</span>
            <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums" }}>
              {qAnswers[p.id]} → +{lastPts[p.id] ?? 0}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {answered.map((p) => {
        const correct = isAnswerCorrect(question, qAnswers[p.id]);
        return (
          <div
            key={p.id}
            className="flex justify-between items-center text-sm rounded-lg px-3 py-2"
            style={{ background: C.panelSoft }}
          >
            <span style={{ color: C.text }}>{p.name}</span>
            <span className="flex items-center gap-2">
              <span style={{ color: C.dim }}>{qAnswers[p.id]}</span>
              <span style={{ color: correct ? C.mint : C.pink, fontWeight: 700 }}>{correct ? "✓" : "✗"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
