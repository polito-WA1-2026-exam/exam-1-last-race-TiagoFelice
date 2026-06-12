import { all, get } from '../sqlite.js';

function toEvent(row) {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    description: row.description,
    coinDelta: row.coin_delta,
  };
}

export async function getEvents() {
  const rows = await all(
    `SELECT id, description, coin_delta
     FROM events
     ORDER BY id`,
  );

  return rows.map(toEvent);
}

export async function getRandomEvent() {
  const row = await get(
    `SELECT id, description, coin_delta
     FROM events
     ORDER BY RANDOM()
     LIMIT 1`,
  );

  return toEvent(row);
}
