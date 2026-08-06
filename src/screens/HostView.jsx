import { QuestionStage } from "../components/QuestionStage";
import { HostPanel } from "./HostPanel";

export function HostView({
  question,
  questions,
  currentIndex,
  players,
  qAnswers,
  revealed,
  locked,
  lastPts,
  overrides,
  scores,
  blur,
  onRevealBlurStep,
  soundPlaying,
  onToggleSound,
  onLockAnswers,
  onReveal,
  onSkip,
  onNext,
  onPrevious,
  onShowHistory,
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <QuestionStage
        question={question}
        questions={questions}
        currentIndex={currentIndex}
        revealed={revealed}
        blur={blur}
        soundPlaying={soundPlaying}
      />
      <HostPanel
        question={question}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        players={players}
        qAnswers={qAnswers}
        revealed={revealed}
        locked={locked}
        lastPts={lastPts}
        overrides={overrides}
        scores={scores}
        blur={blur}
        soundPlaying={soundPlaying}
        onRevealBlurStep={onRevealBlurStep}
        onToggleSound={onToggleSound}
        onLockAnswers={onLockAnswers}
        onReveal={onReveal}
        onSkip={onSkip}
        onNext={onNext}
        onPrevious={onPrevious}
        onShowHistory={onShowHistory}
      />
    </div>
  );
}
