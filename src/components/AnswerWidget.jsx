import { LockedNote } from "./LockedNote";
import { C } from "../theme/colors";

export function AnswerWidget({
  question,
  myAnswer,
  youAnswered,
  revealed,
  estimateInput,
  onEstimateInputChange,
  onSubmit,
}) {
  if (question.type === "schaetzfrage") {
    return (
      <div className="flex flex-col items-center gap-3">
        {youAnswered ? (
          <LockedNote value={`${myAnswer} ${question.unit}`} />
        ) : (
          <div className="flex gap-2 w-full" style={{ maxWidth: 340 }}>
            <input
              type="number"
              inputMode="numeric"
              value={estimateInput}
              onChange={(e) => onEstimateInputChange(e.target.value)}
              placeholder="Deine Schätzung…"
              className="flex-1 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.text }}
            />
            <button
              onClick={() => estimateInput !== "" && onSubmit(Number(estimateInput))}
              className="rounded-xl px-5 font-bold focus:outline-none focus:ring-2"
              style={{ background: C.gold, color: "#221D00" }}
            >
              Einloggen
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full mx-auto" style={{ maxWidth: 480 }}>
      {question.options.map((opt) => {
        const chosen = myAnswer === opt;
        const isCorrect = revealed && opt === question.correct_answer;
        const isWrongChoice = revealed && chosen && opt !== question.correct_answer;
        return (
          <button
            key={opt}
            onClick={() => onSubmit(opt)}
            disabled={youAnswered || revealed}
            className="rounded-xl px-4 py-4 font-semibold text-left transition-all focus:outline-none focus:ring-2"
            style={{
              background: isCorrect ? C.mint + "33" : isWrongChoice ? C.pink + "33" : chosen ? C.violet + "44" : C.panelSoft,
              border: `2px solid ${isCorrect ? C.mint : isWrongChoice ? C.pink : chosen ? C.violet : C.line}`,
              color: C.text,
              opacity: youAnswered && !chosen && !isCorrect ? 0.5 : 1,
              cursor: youAnswered || revealed ? "default" : "pointer",
            }}
          >
            {opt}
            {isCorrect && <span style={{ color: C.mint }}> ✓</span>}
          </button>
        );
      })}
    </div>
  );
}
