# Exam 1: Last Race

## Student

Tiago Felice

## Project Summary

Last Race is a single-player route-planning game built with React 19, React
Router, Express, Passport.js, sessions, and SQLite.

A registered player studies a complete metro network, starts a game, receives a
random start and destination station, and plans a route in 90 seconds. The server
validates the submitted route, applies one random event per segment, stores the
final score, and exposes a ranking with the best score for each registered user.

Anonymous users can only read the public instructions.

## Run The Project

Install and start the API server:

```bash
cd server
npm install
npm run seed
node index.js
```

If `nodemon` is installed globally, this also works:

```bash
cd server
nodemon index.js
```

Install and start the React client in another terminal:

```bash
cd client
npm install
npm run dev
```

The client runs on the Vite URL printed in the terminal, usually
`http://localhost:5173`.

## React Client Application Routes

- `/`: public instructions page. Shows the game goal, phase descriptions, and
  login status.
- `/login`: login form for registered users.
- `/game`: protected game page. Shows setup, planning, execution, and result
  phases.
- `/ranking`: protected ranking page. Shows each registered user's best stored
  score.

## API Server

- `GET /api/instructions`
  - Public endpoint.
  - Response: game goal, phase descriptions, and anonymous access message.

- `GET /api/sessions/current`
  - Public endpoint.
  - Response: `{ user: null }` when anonymous, or the logged-in user object.

- `POST /api/sessions`
  - Public endpoint.
  - Request body: `{ "username": "...", "password": "..." }`.
  - Response: logged-in user object.
  - Creates a session cookie.

- `DELETE /api/sessions/current`
  - Public endpoint.
  - Destroys the current session.

- `GET /api/game/setup`
  - Protected endpoint.
  - Response: full network map with stations, lines, segments, and interchange
    stations.

- `POST /api/games`
  - Protected endpoint.
  - Starts a new game.
  - Response: game assignment, station-only planning map, all available
    segments, the planning time, and the server-generated planning deadline.

- `POST /api/games/:id/submit-route`
  - Protected endpoint.
  - Request body: `{ "route": [{ "fromStationId": 1, "toStationId": 2 }] }`.
  - Response: validation result, saved game, execution steps, and final score.
  - Invalid, incomplete, or late routes are stored with score `0`.

- `GET /api/games/:id/steps`
  - Protected endpoint.
  - Response: stored execution steps for a submitted game.

- `GET /api/ranking`
  - Protected endpoint.
  - Response: ranking rows ordered by best score descending.

## Database Tables

- `users`: registered users with username, display name, salt, and password
  hash.
- `stations`: metro stations, including `x` and `y` coordinates for map drawing.
- `lines`: metro lines with name and color.
- `line_stops`: ordered stations for each line. Consecutive rows define the
  playable segment connections.
- `events`: random execution events with a coin delta between `-4` and `4`.
- `games`: one row per started game, including user, start station, destination,
  status, submitted route JSON, and final score.
- `game_steps`: stored execution steps for completed games, including the event
  applied and running coin total.

## Seeded Data

- 1 registered user.
- 20 stations.
- 6 metro lines.
- 12 random events.
- 0 historical games after seed reset.

## Main React Components

- `App` in `client/src/App.jsx`: React Router routes, header, protected route
  wrapper, and page selection.
- `GameView` in `client/src/game/GameView.jsx`: complete game flow with setup,
  planning, execution, and result phases.
- `NetworkMap` in `client/src/game/GameView.jsx`: SVG map renderer for the full
  network and selected route.
- `SegmentPicker` in `client/src/game/GameView.jsx`: shows selectable connected
  segments from the current station.
- `RankingView` in `client/src/ranking/RankingView.jsx`: loads and displays the
  best-score ranking table.
- `SessionProvider` in `client/src/session.jsx`: keeps the current login session
  in React state.

## Users Credentials

- username: `tiago`
- password: `tiagopass`

## Screenshot

A screenshot should be added after the final browser walkthrough in Step 13.

## Use of AI Tools

I used ChatGPT/Codex as a learning assistant while developing this project. It
helped organize the implementation in small steps, explain concepts, generate
initial code, and debug errors. I verified the generated code by reading it,
running the seed script, running the React linter, and building the client.
