import { all } from '../sqlite.js';

export async function getRanking() {
  const rows = await all(
    `SELECT
       u.id AS user_id,
       u.username,
       u.display_name,
       MAX(g.final_score) AS best_score,
       COUNT(g.id) AS played_games
     FROM users u
     JOIN games g ON g.user_id = u.id
     WHERE g.status IN ('completed', 'invalid')
       AND g.final_score IS NOT NULL
     GROUP BY u.id
     ORDER BY best_score DESC, played_games ASC, u.display_name ASC`,
  );

  return rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    bestScore: row.best_score,
    playedGames: row.played_games,
  }));
}
