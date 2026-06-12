import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from './auth/passport.js';
import gameRouter from './routes/game.js';
import instructionsRouter from './routes/instructions.js';
import rankingRouter from './routes/ranking.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
const port = 3001;
const clientOrigins = (
  process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
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
app.use('/api/ranking', rankingRouter);
app.use('/api', gameRouter);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
