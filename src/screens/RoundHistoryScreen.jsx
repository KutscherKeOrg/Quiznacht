import { pointsForQuestion } from "../lib/quizLogic";
import { QuestionTypeChip } from "../components/QuestionTypeChip";
import { AnswerCorrectionList } from "../components/AnswerCorrectionList";
import { C } from "../theme/colors";

/**
 * Host-Rundenübersicht: alle bereits aufgelösten Fragen der laufenden
 * (oder bereits beendeten) Runde mit sämtlichen Spielerantworten, samt
 * Möglichkeit zur nachträglichen Korrektur – unabhängig davon, wie weit
 * das Quiz inzwischen weitergegangen ist.
 */
export function RoundHistoryScreen({
  questions,
  currentIndex,
  revealed,
  phase,
  players,
  answersByQuestion,
  elapsedByQuestion,
  overridesByQuestion,
  onSetOverride,
  onBack,
}) {
  const playerIds = players.map((p) => p.id);
  const doneQuestions = questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => i < currentIndex || (i === currentIndex && revealed) || phase === "end");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg" style={{ color: C.text }}>
          Rundenübersicht
        </h2>
        <button
          onClick={onBack}
          className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
          style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
        >
          ← Zurück
        </button>
      </div>

      {doneQuestions.length === 0 && (
        <p className="text-center text-sm" style={{ color: C.dim }}>
          Noch keine Frage aufgelöst.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {doneQuestions.map(({ q, i }) => {
          const qAnswers = answersByQuestion[q.id] || {};
          const elapsed = elapsedByQuestion[q.id] || {};
          const overrides = overridesByQuestion[q.id] || {};
          const pts = pointsForQuestion(q, qAnswers, playerIds, elapsed, overrides);
          return (
            <div key={q.id} className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-bold" style={{ color: C.dim }}>
                  Frage {i + 1}
                </span>
                <QuestionTypeChip type={q.type} />
              </div>
              <p className="mb-3 text-sm" style={{ color: C.text }}>
                {q.prompt}
              </p>
              <AnswerCorrectionList
                question={q}
                players={players}
                qAnswers={qAnswers}
                lastPts={pts}
                overrides={overrides}
                onSetOverride={(playerId, override) => onSetOverride(q.id, playerId, override)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
