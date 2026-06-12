import { all } from '../sqlite.js';

function toStation(row) {
  return {
    id: row.id,
    name: row.name,
    x: row.x,
    y: row.y,
  };
}

function makeSegmentKey(firstStationId, secondStationId) {
  const low = Math.min(firstStationId, secondStationId);
  const high = Math.max(firstStationId, secondStationId);
  return `${low}-${high}`;
}

export async function getStations() {
  const rows = await all(
    `SELECT id, name, x, y
     FROM stations
     ORDER BY id`,
  );

  return rows.map(toStation);
}

export async function getLines() {
  const rows = await all(
    `SELECT
       l.id AS line_id,
       l.name AS line_name,
       l.color,
       s.id AS station_id,
       s.name AS station_name,
       s.x,
       s.y,
       ls.stop_order
     FROM lines l
     JOIN line_stops ls ON ls.line_id = l.id
     JOIN stations s ON s.id = ls.station_id
     ORDER BY l.id, ls.stop_order`,
  );

  const linesById = new Map();

  for (const row of rows) {
    if (!linesById.has(row.line_id)) {
      linesById.set(row.line_id, {
        id: row.line_id,
        name: row.line_name,
        color: row.color,
        stops: [],
      });
    }

    linesById.get(row.line_id).stops.push({
      stationId: row.station_id,
      stationName: row.station_name,
      x: row.x,
      y: row.y,
      stopOrder: row.stop_order,
    });
  }

  return [...linesById.values()];
}

export async function getSegments() {
  const lines = await getLines();
  const segmentsByKey = new Map();

  for (const line of lines) {
    for (let index = 0; index < line.stops.length - 1; index += 1) {
      const from = line.stops[index];
      const to = line.stops[index + 1];
      const key = makeSegmentKey(from.stationId, to.stationId);

      if (!segmentsByKey.has(key)) {
        segmentsByKey.set(key, {
          key,
          fromStationId: from.stationId,
          fromStationName: from.stationName,
          toStationId: to.stationId,
          toStationName: to.stationName,
          lines: [],
        });
      }

      segmentsByKey.get(key).lines.push({
        id: line.id,
        name: line.name,
        color: line.color,
      });
    }
  }

  return [...segmentsByKey.values()];
}

export async function getInterchangeStations() {
  const rows = await all(
    `SELECT
       s.id,
       s.name,
       s.x,
       s.y,
       COUNT(ls.line_id) AS line_count
     FROM stations s
     JOIN line_stops ls ON ls.station_id = s.id
     GROUP BY s.id
     HAVING line_count > 1
     ORDER BY s.name`,
  );

  return rows.map((row) => ({
    ...toStation(row),
    lineCount: row.line_count,
  }));
}

export async function getNetwork() {
  const [stations, lines, segments, interchangeStations] = await Promise.all([
    getStations(),
    getLines(),
    getSegments(),
    getInterchangeStations(),
  ]);

  return {
    stations,
    lines,
    segments,
    interchangeStations,
  };
}
