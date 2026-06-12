import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { getUserById, getUserByUsername } from '../db/queries.js';
import { verifyPassword } from './passwords.js';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);

      if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      return done(null, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      });
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user ?? false);
  } catch (error) {
    done(error);
  }
});

export default passport;
