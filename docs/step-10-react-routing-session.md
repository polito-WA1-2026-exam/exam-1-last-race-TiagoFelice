# Step 10 - React Routing and Session State

This step replaces the Vite starter UI with the foundation of the Last Race client.

It does not build the full game flow yet. It prepares the app structure that future views will use.

## Files Added

`client/src/api.js`

- Central API helper.
- Uses `credentials: 'include'` so session cookies are sent to Express.
- Exposes:
  - `getInstructions`
  - `getCurrentSession`
  - `loginSession`
  - `logoutSession`

`client/src/session.jsx`

- Provides global session state.
- Stores:
  - current user
  - loading state
  - session error state
- Exposes login, logout, and refresh functions through context.

`client/src/sessionContext.js`

- Exposes the session context and `useSession` hook.
- Kept separate from `session.jsx` to satisfy React Fast Refresh lint rules.

## Files Updated

`client/src/main.jsx`

- Wraps the app in `SessionProvider`.

`client/src/App.jsx`

- Replaces the starter UI.
- Adds a small browser-history router without installing `react-router`.
- Supports:
  - `/`
  - `/login`
  - `/game`
  - `/ranking`

`client/src/App.css` and `client/src/index.css`

- Replace starter styling with the Last Race app layout.

`server/index.js`

- Allows both development origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

`server/routes/sessions.js`

- `GET /api/sessions/current` now returns `user: null` for anonymous visitors.
- This keeps the browser console clean during normal anonymous page loads.

## Client Routes

`/`

- Public instructions page.
- Loads instructions from `GET /api/instructions`.

`/login`

- Login form.
- Uses the seeded account:

```txt
tiago / tiagopass
```

`/game`

- Protected route shell.
- Shows placeholder sections for setup, planning, and execution.
- The full game UI will be added next.

`/ranking`

- Protected route shell.
- The ranking API/view will be connected later.

## Why No React Router Yet

For this step, routing is small enough to use the browser History API directly:

```js
window.history.pushState(null, '', path)
```

This keeps the project simpler while there are only four routes.

If route complexity grows later, we can still introduce `react-router`.

## Verification Result

Checks run:

- `npm run lint`
- `npm run build`
- backend dev server
- Vite dev server
- headless Chrome smoke test

Browser smoke test verified:

- home page renders `Last Race`
- instructions load from the API
- login with `tiago / tiagopass` works
- login redirects to `/game`
- user name `Tiago` appears after login
- game route shell renders
- ranking route navigation works
- browser console errors: `0`

## Next Implementation Target

The next step is the real game UI:

- setup view connected to `GET /api/game/setup`
- planning view connected to `POST /api/games`
- segment selection
- route submission
- execution/result display
