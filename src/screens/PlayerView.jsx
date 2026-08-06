import { QuestionStage } from "../components/QuestionStage";
import { PlayerPanel } from "./PlayerPanel";

export function PlayerView({
  question,
  questions,
  currentIndex,
  totalQuestions,
  players,
  qAnswers,
  myAnswer,
  revealed,
  locked,
  myPoints,
  myScore,
  scores,
  youId,
  lastPts,
  overrides,
  blur,
  textInput,
  onTextInputChange,
  onSubmit,
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <QuestionStage
        question={question}
        questions={questions}
        currentIndex={currentIndex}
        revealed={revealed}
        blur={blur}
      />
      <PlayerPanel
        question={question}
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        players={players}
        qAnswers={qAnswers}
        myAnswer={myAnswer}
        revealed={revealed}
        locked={locked}
        myPoints={myPoints}
        myScore={myScore}
        scores={scores}
        youId={youId}
        lastPts={lastPts}
        overrides={overrides}
        textInput={textInput}
        onTextInputChange={onTextInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
