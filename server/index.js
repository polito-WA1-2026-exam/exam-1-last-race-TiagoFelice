import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from './auth/passport.js';
import gameRouter from './routes/game.js';
import instructionsRouter from './routes/instructions.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
const port = 3001;
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    name: 'last-race.sid',
    secret: process.env.SESSION_SECRET ?? 'last-race-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/instructions', instructionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api', gameRouter);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
