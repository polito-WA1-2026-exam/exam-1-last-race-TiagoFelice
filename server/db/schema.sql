PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS game_steps;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS line_stops;
DROP TABLE IF EXISTS lines;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

CREATE TABLE lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

CREATE TABLE line_stops (
  line_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  stop_order INTEGER NOT NULL,
  PRIMARY KEY (line_id, stop_order),
  UNIQUE (line_id, station_id),
  FOREIGN KEY (line_id) REFERENCES lines(id),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  coin_delta INTEGER NOT NULL CHECK (coin_delta BETWEEN -4 AND 4)
);

CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_station_id INTEGER NOT NULL,
  destination_station_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning', 'completed', 'invalid')),
  route_json TEXT,
  final_score INTEGER CHECK (final_score IS NULL OR final_score >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (start_station_id) REFERENCES stations(id),
  FOREIGN KEY (destination_station_id) REFERENCES stations(id)
);

CREATE TABLE game_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  from_station_id INTEGER NOT NULL,
  to_station_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  coin_total INTEGER NOT NULL,
  UNIQUE (game_id, step_number),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (from_station_id) REFERENCES stations(id),
  FOREIGN KEY (to_station_id) REFERENCES stations(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
