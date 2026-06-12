import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import passport from '../auth/passport.js';

const router = express.Router();

function toSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

router.get('/current', requireAuth, (req, res) => {
  res.json({ user: toSessionUser(req.user) });
});

router.post('/', (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }

      return res.status(201).json({ user: toSessionUser(req.user) });
    });
  })(req, res, next);
});

router.delete('/current', (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(204).end();
  }

  req.logout((error) => {
    if (error) {
      return next(error);
    }

    return req.session.destroy((destroyError) => {
      if (destroyError) {
        return next(destroyError);
      }

      res.clearCookie('last-race.sid');
      return res.status(204).end();
    });
  });
});

export default router;
