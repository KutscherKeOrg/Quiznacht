// Platzierungs-Punkte: 1. Platz 250, 2. 200, 3. 150, 4. 100 – ab Platz 5
// (RANK_POINTS_FLOOR) gibt's weiterhin die Basis-100, statt auf 0 abzufallen.
// Gilt für Schätzfragen (Nähe-Rang) genauso wie für alle anderen Fragetypen
// (Antwortzeit-Rang unter den Richtigen).
export const RANK_POINTS = [250, 200, 150, 100];
const RANK_POINTS_FLOOR = 100;

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const TOLERANT_MIN_LENGTH = 3;

// Entfernt Klammerzusätze wie "(Pokémon Diamond/Pearl)" vor dem toleranten
// Vergleich, damit Zusatzinfos in der hinterlegten Antwort nicht im Weg stehen.
function stripParenthetical(text) {
  return text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

// Eingabe zählt als toleranter Treffer, wenn sie (normalisiert, ohne
// Klammerzusätze) als zusammenhängender Abschnitt in der richtigen Antwort
// vorkommt oder umgekehrt - ab einer Mindestlänge, damit nicht schon ein
// einzelner Buchstabe fälschlich zählt.
function isTolerantTextMatch(correctAnswer, value) {
  const input = normalizeText(value);
  if (input.length < TOLERANT_MIN_LENGTH) return false;
  const correctStripped = normalizeText(stripParenthetical(String(correctAnswer ?? "")));
  if (!correctStripped) return false;
  return correctStripped.includes(input) || input.includes(correctStripped);
}

function isExactMatch(question, value) {
  if (value === undefined) return false;
  if (question.answer_mode === "open") {
    return normalizeText(value) === normalizeText(question.correct_answer);
  }
  return value === question.correct_answer;
}

/**
 * Ob eine abgegebene Antwort für Fragetypen mit binärer richtig/falsch-Wertung
 * (alle außer Schätzfrage) korrekt ist. Im offenen Antwortmodus zählt neben
 * dem exakten (normalisierten) Treffer auch der tolerante Teilstring-Abgleich
 * (siehe isTolerantTextMatch), im Auswahlmodus nur der exakte Treffer.
 */
export function isAnswerCorrect(question, value) {
  if (value === undefined) return false;
  if (question.answer_mode === "open") {
    return isExactMatch(question, value) || isTolerantTextMatch(question.correct_answer, value);
  }
  return value === question.correct_answer;
}

/**
 * True nur, wenn eine offene Antwort ausschließlich über den toleranten
 * Abgleich als richtig gilt (nicht exakt) - rein für die Host-Anzeige, damit
 * er das im Zweifel per Korrekturfunktion übersteuern kann. Fließt selbst
 * nicht in die Wertung ein, die läuft weiter über isAnswerCorrect.
 */
export function isTolerantMatch(question, value) {
  if (question.answer_mode !== "open" || value === undefined) return false;
  if (isExactMatch(question, value)) return false;
  return isTolerantTextMatch(question.correct_answer, value);
}

/**
 * Wie isAnswerCorrect, aber eine manuelle Host-Korrektur (true/false)
 * überstimmt den automatischen Abgleich. `override` ist null/undefined,
 * solange niemand nachträglich korrigiert hat.
 */
export function effectiveCorrectness(question, value, override) {
  if (override === true || override === false) return override;
  return isAnswerCorrect(question, value);
}

/**
 * @param {object} question - Fragen-Zeile aus der DB (type, correct_answer, correct_value, answer_mode)
 * @param {Record<string, string>} answersByPlayerId - { [playerId]: abgegebener Wert (immer als Text) }
 * @param {string[]} playerIds
 * @param {Record<string, number>} elapsedByPlayerId - { [playerId]: Antwortzeit in ms }, für den Tempo-Rang
 * @param {Record<string, boolean>} overridesByPlayerId - { [playerId]: manuelle Korrektur oder null }
 * @returns {Record<string, number>} { [playerId]: Punkte für diese Frage }
 */
export function pointsForQuestion(question, answersByPlayerId, playerIds, elapsedByPlayerId = {}, overridesByPlayerId = {}) {
  const pts = {};
  if (question.type === "schaetzfrage") {
    // Schätzfragen werden nach Nähe gerankt, nicht binär richtig/falsch -
    // eine nachträgliche Korrektur ergibt hier keinen Sinn und wird ignoriert.
    const ranked = playerIds
      .filter((id) => answersByPlayerId[id] !== undefined)
      .map((id) => ({ id, d: Math.abs(Number(answersByPlayerId[id]) - question.correct_value) }))
      .sort((a, b) => a.d - b.d);
    ranked.forEach((r, i) => {
      pts[r.id] = RANK_POINTS[i] ?? RANK_POINTS_FLOOR;
    });
  } else {
    playerIds.forEach((id) => {
      pts[id] = 0;
    });
    const correctBySpeed = playerIds
      .filter((id) => effectiveCorrectness(question, answersByPlayerId[id], overridesByPlayerId[id]))
      .sort((a, b) => (elapsedByPlayerId[a] ?? Infinity) - (elapsedByPlayerId[b] ?? Infinity));
    correctBySpeed.forEach((id, i) => {
      pts[id] = RANK_POINTS[i] ?? RANK_POINTS_FLOOR;
    });
  }
  return pts;
}

/**
 * Summiert die Punkte über alle bereits abgeschlossenen Fragen einer Runde.
 * Eine Frage zählt als "abgeschlossen", wenn sie vor der aktuellen liegt,
 * die aktuelle ist und aufgelöst wurde, oder das Quiz vorbei ist.
 */
export function computeScores({ questions, answersByQuestion, elapsedByQuestion, overridesByQuestion, players, currentIndex, revealed, phase }) {
  const playerIds = players.map((p) => p.id);
  const scores = {};
  playerIds.forEach((id) => (scores[id] = 0));

  questions.forEach((question, i) => {
    const done = i < currentIndex || (i === currentIndex && revealed) || phase === "end";
    if (!done) return;
    const answersForQuestion = answersByQuestion[question.id] || {};
    const elapsedForQuestion = (elapsedByQuestion && elapsedByQuestion[question.id]) || {};
    const overridesForQuestion = (overridesByQuestion && overridesByQuestion[question.id]) || {};
    const pts = pointsForQuestion(question, answersForQuestion, playerIds, elapsedForQuestion, overridesForQuestion);
    playerIds.forEach((id) => {
      scores[id] += pts[id] || 0;
    });
  });

  return scores;
}

/**
 * Wandelt { profileId, playerName, score }[] in eine Rangliste mit
 * geteilten Plätzen bei Gleichstand um (1, 1, 3, 4, …).
 */
export function rankResults(results) {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  let rank = 0;
  let prevScore = null;
  return sorted.map((r, i) => {
    if (r.score !== prevScore) rank = i + 1;
    prevScore = r.score;
    return { ...r, rank };
  });
}
