import { QuestionTypeChip } from "../components/QuestionTypeChip";
import { ProgressDots } from "../components/ProgressDots";
import { QuestionMedia } from "../components/QuestionMedia";
import { Scoreboard } from "../components/Scoreboard";
import { C } from "../theme/colors";

export function HostView({
  question,
  questions,
  currentIndex,
  players,
  qAnswers,
  revealed,
  lastPts,
  scores,
  blur,
  onRevealBlurStep,
  soundPlaying,
  onToggleSound,
  onReveal,
  onNext,
}) {
  const answeredCount = Object.keys(qAnswers).length;
  const isLast = currentIndex + 1 >= questions.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Bühne */}
      <div className="flex-1 rounded-2xl p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <QuestionTypeChip type={question.type} />
          <ProgressDots questions={questions} current={currentIndex} />
        </div>
        <h2 className="mt-5 mb-6 text-center" style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
          {question.prompt}
        </h2>
        <QuestionMedia
          question={question}
          isHost
          revealed={revealed}
          blur={blur}
          onRevealBlurStep={onRevealBlurStep}
          soundPlaying={soundPlaying}
          onToggleSound={onToggleSound}
        />

        {revealed && (
          <div className="mt-6 text-center rounded-xl py-4" style={{ background: C.mint + "18", border: `1px solid ${C.mint}55` }}>
            <span style={{ color: C.dim }}>Richtige Antwort: </span>
            <span className="font-bold text-lg" style={{ color: C.mint }}>
              {question.type === "schaetzfrage" ? `${question.correct_value} ${question.unit}` : question.correct_answer}
            </span>
          </div>
        )}

        {revealed && question.type === "schaetzfrage" && (
          <div className="mt-4 grid gap-2 mx-auto" style={{ maxWidth: 380 }}>
            {players
              .filter((p) => qAnswers[p.id] !== undefined)
              .sort(
                (a, b) =>
                  Math.abs(Number(qAnswers[a.id]) - question.correct_value) -
                  Math.abs(Number(qAnswers[b.id]) - question.correct_value)
              )
              .map((p) => (
                <div key={p.id} className="flex justify-between text-sm rounded-lg px-3 py-2" style={{ background: C.panelSoft }}>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums" }}>
                    {qAnswers[p.id]} → +{lastPts[p.id] ?? 0}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Regie */}
        <div className="mt-8 flex items-center justify-between flex-wrap gap-4 pt-5" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="text-sm" style={{ color: C.dim }}>
            <span className="font-bold" style={{ color: players.length > 0 && answeredCount === players.length ? C.mint : C.text }}>
              {answeredCount}/{players.length}
            </span>{" "}
            haben geantwortet
            <span className="inline-flex gap-1 ml-2 align-middle">
              {players.map((p) => (
                <span
                  key={p.id}
                  title={p.name}
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: qAnswers[p.id] !== undefined ? C.mint : C.line }}
                />
              ))}
            </span>
          </div>
          {!revealed ? (
            <button
              onClick={onReveal}
              className="rounded-xl px-6 py-3 font-bold focus:outline-none focus:ring-2"
              style={{ background: C.gold, color: "#221D00" }}
            >
              Auflösen
            </button>
          ) : (
            <button
              onClick={onNext}
              className="rounded-xl px-6 py-3 font-bold focus:outline-none focus:ring-2"
              style={{ background: C.violet, color: "#fff" }}
            >
              {isLast ? "Siegerehrung →" : "Nächste Frage →"}
            </button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="lg:w-72 rounded-2xl p-5 self-start w-full" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs font-bold tracking-widest mb-4" style={{ color: C.dim }}>
          PUNKTESTAND
        </div>
        <Scoreboard players={players} scores={scores} />
      </div>
    </div>
  );
}
