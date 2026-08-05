import { useState } from "react";
import { AnswerResultsList } from "../components/AnswerResultsList";
import { Scoreboard } from "../components/Scoreboard";
import { C } from "../theme/colors";

/**
 * Rechte Spalte für den Host – Moderator-Panel. Bündelt alle Steuerungen,
 * die vorher teils in QuestionMedia/HostView verstreut waren, damit die
 * linke Spalte (QuestionStage) rollenunabhängig bleiben kann.
 */
export function HostPanel({
  question,
  currentIndex,
  totalQuestions,
  players,
  qAnswers,
  revealed,
  locked,
  lastPts,
  scores,
  blur,
  soundPlaying,
  onRevealBlurStep,
  onToggleSound,
  onLockAnswers,
  onReveal,
  onSkip,
  onNext,
  onPrevious,
}) {
  const [showStandings, setShowStandings] = useState(false);
  const answeredCount = Object.keys(qAnswers).length;
  const isLast = currentIndex + 1 >= totalQuestions;

  return (
    <div className="lg:w-80 w-full flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs font-bold tracking-widest mb-4" style={{ color: C.dim }}>
          MODERATION
        </div>

        {question.type === "portrait" && !revealed && (
          <button
            onClick={onRevealBlurStep}
            className="w-full rounded-lg px-4 py-2 mb-3 text-sm font-semibold focus:outline-none focus:ring-2"
            style={{ background: C.violet + "33", color: C.violet, border: `1px solid ${C.violet}66` }}
          >
            Stufe aufdecken ({Math.max(0, Math.ceil(blur / 5))} übrig)
          </button>
        )}
        {question.type === "sound" && (
          <button
            onClick={onToggleSound}
            className="w-full rounded-lg px-4 py-2 mb-3 text-sm font-semibold focus:outline-none focus:ring-2"
            style={{ background: C.pink + "33", color: C.pink, border: `1px solid ${C.pink}66` }}
          >
            {soundPlaying ? "Sound pausieren" : "Sound abspielen"}
          </button>
        )}

        <div className="text-sm mb-4" style={{ color: C.dim }}>
          <span
            className="font-bold"
            style={{ color: players.length > 0 && answeredCount === players.length ? C.mint : C.text }}
          >
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

        <div className="flex flex-col gap-2">
          {!locked && !revealed && (
            <button
              onClick={onLockAnswers}
              className="rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, color: C.text, border: `1px solid ${C.line}` }}
            >
              Antwortzeit beenden
            </button>
          )}
          {!revealed ? (
            <button
              onClick={onReveal}
              className="rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2"
              style={{ background: C.gold, color: "#221D00" }}
            >
              Auflösen
            </button>
          ) : (
            <button
              onClick={onNext}
              className="rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2"
              style={{ background: C.violet, color: "#fff" }}
            >
              {isLast ? "Siegerehrung →" : "Nächste Frage →"}
            </button>
          )}
          {!revealed && (
            <button
              onClick={onSkip}
              className="rounded-xl px-4 py-3 font-semibold text-sm focus:outline-none focus:ring-2"
              style={{ background: C.panelSoft, color: C.pink, border: `1px solid ${C.pink}55` }}
            >
              Frage überspringen
            </button>
          )}
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="rounded-xl px-4 py-3 font-semibold text-sm focus:outline-none focus:ring-2 disabled:opacity-40"
            style={{ background: C.panelSoft, color: C.dim, border: `1px solid ${C.line}` }}
          >
            ← Zurück zur vorherigen Frage
          </button>
          <button
            onClick={() => setShowStandings(true)}
            className="rounded-xl px-4 py-3 font-semibold text-sm focus:outline-none focus:ring-2"
            style={{ background: C.panelSoft, color: C.sky, border: `1px solid ${C.sky}55` }}
          >
            Zwischenstand einblenden
          </button>
        </div>
      </div>

      {revealed && (
        <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-bold tracking-widest mb-4" style={{ color: C.dim }}>
            WER LAG RICHTIG?
          </div>
          <AnswerResultsList question={question} players={players} qAnswers={qAnswers} lastPts={lastPts} />
        </div>
      )}

      {showStandings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "#0B0919CC" }}
          onClick={() => setShowStandings(false)}
        >
          <div
            className="rounded-2xl p-6 w-full"
            style={{ maxWidth: 420, background: C.panel, border: `1px solid ${C.line}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs font-bold tracking-widest" style={{ color: C.dim }}>
                ZWISCHENSTAND
              </div>
              <button
                onClick={() => setShowStandings(false)}
                className="text-sm font-bold focus:outline-none focus:ring-2"
                style={{ color: C.dim }}
              >
                ✕
              </button>
            </div>
            <Scoreboard players={players} scores={scores} big />
          </div>
        </div>
      )}
    </div>
  );
}
