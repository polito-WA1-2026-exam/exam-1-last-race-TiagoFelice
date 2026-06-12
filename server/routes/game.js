import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import { chooseStartAndDestination, toPlanningSegment } from '../game/planning.js';
import {
  createPlanningGame,
  getGameById,
  getNetwork,
} from '../db/queries.js';

const router = express.Router();
const PLANNING_TIME_SECONDS = 90;

function toStationOnlyMap(network) {
  return {
    stations: network.stations,
  };
}

router.get('/game/setup', requireAuth, async (req, res, next) => {
  try {
    const network = await getNetwork();
    res.json({ network });
  } catch (error) {
    next(error);
  }
});

router.post('/games', requireAuth, async (req, res, next) => {
  try {
    const network = await getNetwork();
    const assignment = chooseStartAndDestination(network);
    const gameId = await createPlanningGame({
      userId: req.user.id,
      startStationId: assignment.start.id,
      destinationStationId: assignment.destination.id,
    });
    const game = await getGameById(gameId);

    res.status(201).json({
      game: {
        id: game.id,
        status: game.status,
        startStation: {
          id: game.startStationId,
          name: game.startStationName,
        },
        destinationStation: {
          id: game.destinationStationId,
          name: game.destinationStationName,
        },
        planningTimeSeconds: PLANNING_TIME_SECONDS,
      },
      map: toStationOnlyMap(network),
      segments: network.segments.map(toPlanningSegment),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
