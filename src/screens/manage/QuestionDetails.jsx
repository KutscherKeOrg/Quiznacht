import { C } from "../../theme/colors";

/**
 * Ausgeklappte Detailansicht einer Frage – im Fragenpool und in der
 * Quiz-Zusammenstellung verwendet, damit man bei großen Pools nicht jede
 * Frage einzeln bearbeiten muss, um ihren Inhalt zu sehen.
 */
export function QuestionDetails({ question }) {
  return (
    <div
      className="rounded-lg px-4 py-3 mt-1 mb-1 text-sm"
      style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
    >
      <p className="mb-3" style={{ color: C.text }}>
        {question.prompt}
      </p>

      {question.type === "schaetzfrage" && (
        <p style={{ color: C.dim }}>
          Richtige Zahl:{" "}
          <span style={{ color: C.mint, fontWeight: 600 }}>
            {question.correct_value} {question.unit}
          </span>
        </p>
      )}

      {question.type === "chat" && question.message && (
        <div className="mb-3">
          <div className="text-xs mb-1" style={{ color: C.dim }}>
            Nachrichtentext
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: C.panel, color: C.text }}>
            {question.message}
          </div>
        </div>
      )}

      {question.answer_mode === "open" && question.type !== "schaetzfrage" && (
        <p style={{ color: C.dim }}>
          Richtige Antwort:{" "}
          <span style={{ color: C.mint, fontWeight: 600 }}>{question.correct_answer}</span>
        </p>
      )}

      {question.options && question.options.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {question.options.map((opt) => {
            const isCorrect = opt === question.correct_answer;
            return (
              <div
                key={opt}
                className="rounded-lg px-3 py-1.5"
                style={{
                  background: isCorrect ? C.mint + "22" : C.panel,
                  color: isCorrect ? C.mint : C.text,
                  border: `1px solid ${isCorrect ? C.mint + "66" : C.line}`,
                  fontWeight: isCorrect ? 600 : 400,
                }}
              >
                {opt}
                {isCorrect && " ✓"}
              </div>
            );
          })}
        </div>
      )}

      {question.note && (
        <p className="mt-3 text-xs" style={{ color: C.dim }}>
          Hinweis: {question.note}
        </p>
      )}
    </div>
  );
}
