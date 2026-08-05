import { pointsForQuestion } from "./quizLogic";

/**
 * Zählt, wie oft jedes Profil auf Platz 1 gelandet ist (room_results.rank === 1),
 * absteigend sortiert.
 */
export function computeWinCounts(roomResults, profiles) {
  const counts = {};
  roomResults.forEach((r) => {
    if (r.rank === 1) counts[r.profile_id] = (counts[r.profile_id] || 0) + 1;
  });

  return profiles
    .map((profile) => ({ profile, wins: counts[profile.id] || 0 }))
    .filter((row) => row.wins > 0)
    .sort((a, b) => b.wins - a.wins);
}

/**
 * Durchschnittliche Antwortzeit je Profil über alle abgegebenen Antworten
 * mit erfasster elapsed_ms.
 */
export function computeSpeedStats(answers, players, profiles) {
  const playerToProfile = {};
  players.forEach((p) => (playerToProfile[p.id] = p.profile_id));

  const timesByProfile = {};
  answers.forEach((a) => {
    if (a.elapsed_ms == null) return;
    const profileId = playerToProfile[a.player_id];
    if (!profileId) return;
    if (!timesByProfile[profileId]) timesByProfile[profileId] = [];
    timesByProfile[profileId].push(a.elapsed_ms);
  });

  const profileById = {};
  profiles.forEach((p) => (profileById[p.id] = p));

  return Object.entries(timesByProfile)
    .map(([profileId, times]) => ({
      profile: profileById[profileId],
      avgMs: times.reduce((sum, t) => sum + t, 0) / times.length,
      count: times.length,
    }))
    .filter((row) => row.profile);
}

/**
 * Punkte je Profil innerhalb einer Kategorie, über alle Spieleabende hinweg.
 * Schätzfragen werden dafür pro (room_id, question_id) gruppiert neu bewertet,
 * damit die Nähe-Rangfolge nur innerhalb der jeweiligen Runde gilt.
 */
export function computeCategoryRanking(answers, players, questions, categoryId) {
  const playerToProfile = {};
  players.forEach((p) => (playerToProfile[p.id] = p.profile_id));

  const questionById = {};
  questions.forEach((q) => (questionById[q.id] = q));

  const groups = {};
  answers.forEach((a) => {
    const question = questionById[a.question_id];
    if (!question || question.category_id !== categoryId) return;
    const key = a.room_id + ":" + a.question_id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  const totals = {};
  Object.values(groups).forEach((groupAnswers) => {
    const question = questionById[groupAnswers[0].question_id];
    const answersByPlayerId = {};
    const elapsedByPlayerId = {};
    groupAnswers.forEach((a) => {
      answersByPlayerId[a.player_id] = a.value;
      elapsedByPlayerId[a.player_id] = a.elapsed_ms;
    });
    const playerIds = groupAnswers.map((a) => a.player_id);
    const pts = pointsForQuestion(question, answersByPlayerId, playerIds, elapsedByPlayerId);
    playerIds.forEach((playerId) => {
      const profileId = playerToProfile[playerId];
      if (!profileId) return;
      totals[profileId] = (totals[profileId] || 0) + (pts[playerId] || 0);
    });
  });

  return totals;
}
