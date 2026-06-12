import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getRanking } from '../db/queries.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ranking = await getRanking();
    res.json({ ranking });
  } catch (error) {
    next(error);
  }
});

export default router;
