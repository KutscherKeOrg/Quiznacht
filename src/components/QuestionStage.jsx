import { QuestionTypeChip } from "./QuestionTypeChip";
import { ProgressDots } from "./ProgressDots";
import { QuestionMedia } from "./QuestionMedia";
import { C } from "../theme/colors";

/**
 * Linke Spalte der Frage-Ansicht – rollenunabhängig. Zeigt Frage, Medium und
 * Fortschritt exakt gleich für Host und alle Mitspieler, gesteuert über den
 * synchronisierten Raumstatus (revealed/blur); Sound-Wiedergabe ist eine
 * lokale Kontrolle direkt im SoundPlayer, nicht Teil des Raumstatus.
 */
export function QuestionStage({ question, questions, currentIndex, revealed, blur }) {
  return (
    <div className="flex-1 rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <QuestionTypeChip type={question.type} />
        <ProgressDots questions={questions} current={currentIndex} />
      </div>
      <h2 className="mt-5 mb-6 text-center" style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
        {question.prompt}
      </h2>
      <QuestionMedia question={question} revealed={revealed} blur={blur} />

      {revealed && (
        <div className="mt-6 text-center rounded-xl py-4" style={{ background: C.mint + "18", border: `1px solid ${C.mint}55` }}>
          <span style={{ color: C.dim }}>Richtige Antwort: </span>
          <span className="font-bold text-lg" style={{ color: C.mint }}>
            {question.type === "schaetzfrage" ? `${question.correct_value} ${question.unit}` : question.correct_answer}
          </span>
        </div>
      )}
    </div>
  );
}
