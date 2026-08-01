import { QuestionTypeChip } from "../components/QuestionTypeChip";
import { QuestionMedia } from "../components/QuestionMedia";
import { AnswerWidget } from "../components/AnswerWidget";
import { C } from "../theme/colors";

export function PlayerView({
  question,
  currentIndex,
  totalQuestions,
  myAnswer,
  revealed,
  myPoints,
  myScore,
  blur,
  soundPlaying,
  estimateInput,
  onEstimateInputChange,
  onSubmit,
}) {
  const youAnswered = myAnswer !== undefined;

  return (
    <div className="mx-auto rounded-2xl p-6" style={{ maxWidth: 560, background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <QuestionTypeChip type={question.type} />
        <span className="text-xs" style={{ color: C.dim }}>
          Frage {currentIndex + 1}/{totalQuestions} · Du: <b style={{ color: C.gold }}>{myScore} Pkt.</b>
        </span>
      </div>
      <h2 className="mt-5 mb-6 text-center" style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
        {question.prompt}
      </h2>
      <QuestionMedia question={question} isHost={false} revealed={revealed} blur={blur} soundPlaying={soundPlaying} />
      <div className="mt-6">
        <AnswerWidget
          question={question}
          myAnswer={myAnswer}
          youAnswered={youAnswered}
          revealed={revealed}
          estimateInput={estimateInput}
          onEstimateInputChange={onEstimateInputChange}
          onSubmit={onSubmit}
        />
      </div>

      {youAnswered && !revealed && (
        <p className="mt-5 text-center text-sm" style={{ color: C.dim }}>
          Antwort eingeloggt – warten auf die Auflösung durch den Host…
        </p>
      )}
      {revealed && (
        <div
          className="mt-6 text-center rounded-xl py-4 animate-qz-pop"
          style={{
            background: (myPoints > 0 ? C.mint : C.pink) + "18",
            border: `1px solid ${(myPoints > 0 ? C.mint : C.pink)}55`,
          }}
        >
          <span className="font-bold text-lg" style={{ color: myPoints > 0 ? C.mint : C.pink }}>
            {myPoints > 0 ? `+${myPoints} Punkte!` : "Diesmal nichts …"}
          </span>
          {question.type === "schaetzfrage" && (
            <div className="text-sm mt-1" style={{ color: C.dim }}>
              Richtig: {question.correct_value} {question.unit} · Deine Schätzung: {myAnswer ?? "—"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
