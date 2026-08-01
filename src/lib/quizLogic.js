export const ESTIMATE_POINTS = [100, 70, 50, 30, 10];

/**
 * @param {object} question - Fragen-Zeile aus der DB (type, correct_answer, correct_value)
 * @param {Record<string, string>} answersByPlayerId - { [playerId]: abgegebener Wert (immer als Text) }
 * @param {string[]} playerIds
 * @returns {Record<string, number>} { [playerId]: Punkte für diese Frage }
 */
export function pointsForQuestion(question, answersByPlayerId, playerIds) {
  const pts = {};
  if (question.type === "schaetzfrage") {
    const ranked = playerIds
      .filter((id) => answersByPlayerId[id] !== undefined)
      .map((id) => ({ id, d: Math.abs(Number(answersByPlayerId[id]) - question.correct_value) }))
      .sort((a, b) => a.d - b.d);
    ranked.forEach((r, i) => {
      pts[r.id] = ESTIMATE_POINTS[i] ?? 0;
    });
  } else {
    playerIds.forEach((id) => {
      pts[id] = answersByPlayerId[id] === question.correct_answer ? 100 : 0;
    });
  }
  return pts;
}

/**
 * Summiert die Punkte über alle bereits abgeschlossenen Fragen einer Runde.
 * Eine Frage zählt als "abgeschlossen", wenn sie vor der aktuellen liegt,
 * die aktuelle ist und aufgelöst wurde, oder das Quiz vorbei ist.
 */
export function computeScores({ questions, answersByQuestion, players, currentIndex, revealed, phase }) {
  const playerIds = players.map((p) => p.id);
  const scores = {};
  playerIds.forEach((id) => (scores[id] = 0));

  questions.forEach((question, i) => {
    const done = i < currentIndex || (i === currentIndex && revealed) || phase === "end";
    if (!done) return;
    const answersForQuestion = answersByQuestion[question.id] || {};
    const pts = pointsForQuestion(question, answersForQuestion, playerIds);
    playerIds.forEach((id) => {
      scores[id] += pts[id] || 0;
    });
  });

  return scores;
}
