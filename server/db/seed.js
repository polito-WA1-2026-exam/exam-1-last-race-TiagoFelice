import crypto from 'node:crypto';
import fs from 'node:fs';
import { closeDatabase, dbPath, exec, run, schemaPath } from './database.js';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 310000, 32, 'sha256')
    .toString('hex');

  return { salt, passwordHash };
}

async function insertUser(username, displayName, password) {
  const { salt, passwordHash } = hashPassword(password);
  const result = await run(
    `INSERT INTO users (username, display_name, salt, password_hash)
     VALUES (?, ?, ?, ?)`,
    [username, displayName, salt, passwordHash],
  );
  return result.lastID;
}

async function insertStation(station) {
  const result = await run(
    `INSERT INTO stations (name, x, y)
     VALUES (?, ?, ?)`,
    [station.name, station.x, station.y],
  );
  return result.lastID;
}

async function insertLine(line, stationIdsByName) {
  const result = await run(
    `INSERT INTO lines (name, color)
     VALUES (?, ?)`,
    [line.name, line.color],
  );

  const lineId = result.lastID;
  for (const [index, stationName] of line.stations.entries()) {
    await run(
      `INSERT INTO line_stops (line_id, station_id, stop_order)
       VALUES (?, ?, ?)`,
      [lineId, stationIdsByName.get(stationName), index + 1],
    );
  }

  return lineId;
}

async function insertEvent(event) {
  const result = await run(
    `INSERT INTO events (description, coin_delta)
     VALUES (?, ?)`,
    [event.description, event.coinDelta],
  );
  return result.lastID;
}

async function insertHistoricalGame(game, ids) {
  const result = await run(
    `INSERT INTO games (
       user_id,
       start_station_id,
       destination_station_id,
       status,
       route_json,
       final_score,
       created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ids.users.get(game.username),
      ids.stations.get(game.start),
      ids.stations.get(game.destination),
      game.status,
      JSON.stringify(game.route),
      game.finalScore,
      game.createdAt,
    ],
  );

  const gameId = result.lastID;
  for (const step of game.steps) {
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
        ids.stations.get(step.from),
        ids.stations.get(step.to),
        ids.events.get(step.event),
        step.coinTotal,
      ],
    );
  }
}

const stations = [
  { name: 'Centrale', x: 120, y: 120 },
  { name: 'Porta Velaria', x: 260, y: 120 },
  { name: 'Crocevia del Falco', x: 400, y: 120 },
  { name: 'Piazza delle Lanterne', x: 540, y: 120 },
  { name: 'Mercato Sud', x: 680, y: 120 },
  { name: 'Fontana Oscura', x: 220, y: 260 },
  { name: 'Borgo Sereno', x: 360, y: 300 },
  { name: 'Viale dei Mosaici', x: 520, y: 300 },
  { name: 'Darsena', x: 660, y: 300 },
  { name: 'Archivio Ovest', x: 800, y: 300 },
  { name: 'Torre Cinerea', x: 340, y: 440 },
  { name: "Campo dell'Eco", x: 500, y: 460 },
  { name: 'Giardini Nord', x: 220, y: 580 },
  { name: 'Osservatorio', x: 660, y: 580 },
  { name: 'Teatro Aurora', x: 120, y: 270 },
  { name: 'Biblioteca Est', x: 180, y: 410 },
  { name: 'Bastione Vecchio', x: 320, y: 610 },
  { name: 'Ponte delle Stelle', x: 470, y: 620 },
  { name: 'Museo Marino', x: 610, y: 680 },
  { name: 'Quartiere Alto', x: 760, y: 610 },
];

const lines = [
  {
    name: 'Red Line',
    color: '#cf2e2e',
    stations: [
      'Centrale',
      'Porta Velaria',
      'Crocevia del Falco',
      'Piazza delle Lanterne',
      'Mercato Sud',
    ],
  },
  {
    name: 'Blue Line',
    color: '#1f6feb',
    stations: [
      'Centrale',
      'Fontana Oscura',
      'Borgo Sereno',
      'Viale dei Mosaici',
      'Darsena',
      'Archivio Ovest',
    ],
  },
  {
    name: 'Green Line',
    color: '#2f9e44',
    stations: [
      'Porta Velaria',
      'Fontana Oscura',
      'Torre Cinerea',
      "Campo dell'Eco",
      'Giardini Nord',
    ],
  },
  {
    name: 'Yellow Line',
    color: '#d6a307',
    stations: [
      'Piazza delle Lanterne',
      'Torre Cinerea',
      'Viale dei Mosaici',
      "Campo dell'Eco",
      'Osservatorio',
    ],
  },
  {
    name: 'Purple Line',
    color: '#7c3aed',
    stations: [
      'Centrale',
      'Teatro Aurora',
      'Biblioteca Est',
      'Bastione Vecchio',
      'Piazza delle Lanterne',
    ],
  },
  {
    name: 'Orange Line',
    color: '#f97316',
    stations: [
      'Torre Cinerea',
      'Ponte delle Stelle',
      'Museo Marino',
      'Quartiere Alto',
      "Campo dell'Eco",
    ],
  },
];

const events = [
  { description: 'Quiet journey', coinDelta: 0 },
  { description: 'Kind passenger shares a tip', coinDelta: 1 },
  { description: 'Found an unused ticket voucher', coinDelta: 2 },
  { description: 'Express shortcut opens unexpectedly', coinDelta: 3 },
  { description: 'Station festival bonus', coinDelta: 4 },
  { description: 'Small delay at the platform', coinDelta: -1 },
  { description: 'Wrong platform', coinDelta: -2 },
  { description: 'Ticket inspection fine', coinDelta: -3 },
  { description: 'Lost backpack recovery fee', coinDelta: -4 },
  { description: 'Signal cleared ahead', coinDelta: 2 },
  { description: 'Helpful conductor finds a faster platform', coinDelta: 3 },
  { description: 'Track maintenance detour', coinDelta: -3 },
];

const users = [
  { username: 'tiago', displayName: 'Tiago', password: 'tiagopass' },
];

const historicalGames = [];

async function seed() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await exec(schema);

  const ids = {
    users: new Map(),
    stations: new Map(),
    events: new Map(),
  };

  for (const user of users) {
    const id = await insertUser(user.username, user.displayName, user.password);
    ids.users.set(user.username, id);
  }

  for (const station of stations) {
    const id = await insertStation(station);
    ids.stations.set(station.name, id);
  }

  for (const line of lines) {
    await insertLine(line, ids.stations);
  }

  for (const event of events) {
    const id = await insertEvent(event);
    ids.events.set(event.description, id);
  }

  for (const game of historicalGames) {
    await insertHistoricalGame(game, ids);
  }
}

try {
  await seed();
  console.log(`Seeded database at ${dbPath}`);
} finally {
  await closeDatabase();
}
