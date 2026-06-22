import { all, get, run } from '../sqlite.js';

function normalizeRouteJson(routeJson) {
  if (!routeJson) {
    return [];
  }

  return JSON.parse(routeJson);
}

export async function createPlanningGame({
  userId,
  startStationId,
  destinationStationId,
  planningDeadlineAt,
}) {
  const result = await run(
    `INSERT INTO games (
       user_id,
       start_station_id,
       destination_station_id,
       status,
       planning_deadline_at
     )
     VALUES (?, ?, ?, 'planning', ?)`,
    [userId, startStationId, destinationStationId, planningDeadlineAt],
  );

  return result.lastID;
}

export async function getGameById(id) {
  const row = await get(
    `SELECT
       g.id,
       g.user_id,
       g.start_station_id,
       start.name AS start_station_name,
       g.destination_station_id,
       destination.name AS destination_station_name,
       g.status,
       g.planning_deadline_at,
       g.route_json,
       g.final_score,
       g.created_at
     FROM games g
     JOIN stations start ON start.id = g.start_station_id
     JOIN stations destination ON destination.id = g.destination_station_id
     WHERE g.id = ?`,
    [id],
  );

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    userId: row.user_id,
    startStationId: row.start_station_id,
    startStationName: row.start_station_name,
    destinationStationId: row.destination_station_id,
    destinationStationName: row.destination_station_name,
    status: row.status,
    planningDeadlineAt: row.planning_deadline_at,
    route: normalizeRouteJson(row.route_json),
    finalScore: row.final_score,
    createdAt: row.created_at,
  };
}

export async function getGameForUser(gameId, userId) {
  const game = await getGameById(gameId);

  if (!game || game.userId !== userId) {
    return undefined;
  }

  return game;
}

export async function saveGameResult({
  gameId,
  status,
  route,
  finalScore,
  steps,
}) {
  await run('BEGIN IMMEDIATE TRANSACTION');

  try {
    await run(
      `UPDATE games
       SET status = ?,
           route_json = ?,
           final_score = ?
       WHERE id = ?`,
      [status, JSON.stringify(route), finalScore, gameId],
    );

    await run(
      `DELETE FROM game_steps
       WHERE game_id = ?`,
      [gameId],
    );

    for (const step of steps) {
      await run(
        `INSERT INTO game_steps (
           game_id,
           step_number,
           from_station_id,
           to_station_id,
           event_id,
           coin_total
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          step.stepNumber,
          step.fromStationId,
          step.toStationId,
          step.eventId,
          step.coinTotal,
        ],
      );
    }

    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function getGameSteps(gameId) {
  const rows = await all(
    `SELECT
       gs.step_number,
       gs.from_station_id,
       from_station.name AS from_station_name,
       gs.to_station_id,
       to_station.name AS to_station_name,
       e.id AS event_id,
       e.description AS event_description,
       e.coin_delta,
       gs.coin_total
     FROM game_steps gs
     JOIN stations from_station ON from_station.id = gs.from_station_id
     JOIN stations to_station ON to_station.id = gs.to_station_id
     JOIN events e ON e.id = gs.event_id
     WHERE gs.game_id = ?
     ORDER BY gs.step_number`,
    [gameId],
  );

  return rows.map((row) => ({
    stepNumber: row.step_number,
    fromStationId: row.from_station_id,
    fromStationName: row.from_station_name,
    toStationId: row.to_station_id,
    toStationName: row.to_station_name,
    event: {
      id: row.event_id,
      description: row.event_description,
      coinDelta: row.coin_delta,
    },
    coinTotal: row.coin_total,
  }));
}
