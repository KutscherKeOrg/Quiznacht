import { AnswerWidget } from "../components/AnswerWidget";
import { AnswerResultsList } from "../components/AnswerResultsList";
import { C } from "../theme/colors";

/**
 * Rechte Spalte für Mitspieler:innen – Antwortfeld vor der Auflösung,
 * danach automatisch eigene Punktrückmeldung + dieselbe Ergebnisliste
 * wie im HostPanel.
 */
export function PlayerPanel({
  question,
  currentIndex,
  totalQuestions,
  players,
  qAnswers,
  myAnswer,
  revealed,
  locked,
  myPoints,
  myScore,
  lastPts,
  textInput,
  onTextInputChange,
  onSubmit,
}) {
  const youAnswered = myAnswer !== undefined;

  return (
    <div
      className="lg:w-80 w-full rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      <div className="text-xs" style={{ color: C.dim }}>
        Frage {currentIndex + 1}/{totalQuestions} · Du: <b style={{ color: C.gold }}>{myScore} Pkt.</b>
      </div>

      {!revealed ? (
        <>
          <AnswerWidget
            question={question}
            myAnswer={myAnswer}
            youAnswered={youAnswered}
            revealed={revealed}
            locked={locked}
            textInput={textInput}
            onTextInputChange={onTextInputChange}
            onSubmit={onSubmit}
          />
          {youAnswered && (
            <p className="text-center text-sm" style={{ color: C.dim }}>
              Antwort eingeloggt – warten auf die Auflösung durch den Host…
            </p>
          )}
        </>
      ) : (
        <>
          <div
            className="text-center rounded-xl py-4 animate-qz-pop"
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
            {question.type === "portrait" && (
              <div className="text-sm mt-1" style={{ color: C.dim }}>
                Richtig: {question.correct_answer} · Deine Antwort: {myAnswer ?? "—"}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color: C.dim }}>
              WER LAG RICHTIG?
            </div>
            <AnswerResultsList question={question} players={players} qAnswers={qAnswers} lastPts={lastPts} />
          </div>
        </>
      )}
    </div>
  );
}
