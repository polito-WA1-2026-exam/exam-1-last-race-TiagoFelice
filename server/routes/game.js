import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import { executeValidRoute, INITIAL_COINS } from '../game/execution.js';
import { chooseStartAndDestination, toPlanningSegment } from '../game/planning.js';
import { validateSubmittedRoute } from '../game/routeValidation.js';
import {
  createPlanningGame,
  getGameById,
  getGameForUser,
  getGameSteps,
  getNetwork,
  getRandomEvent,
  saveGameResult,
} from '../db/queries.js';

const router = express.Router();
const PLANNING_TIME_SECONDS = 90;

function toStationOnlyMap(network) {
  return {
    stations: network.stations,
  };
}

function toGameAssignment(game) {
  return {
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
    finalScore: game.finalScore,
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

router.get('/games/:id/steps', requireAuth, async (req, res, next) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const game = await getGameForUser(gameId, req.user.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status === 'planning') {
      return res.status(409).json({ error: 'Game has not been submitted yet' });
    }

    const steps = await getGameSteps(game.id);

    return res.json({
      game: toGameAssignment(game),
      steps,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/games/:id/submit-route', requireAuth, async (req, res, next) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const game = await getGameForUser(gameId, req.user.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'planning') {
      return res.status(409).json({ error: 'Game is not in planning phase' });
    }

    const network = await getNetwork();
    const validation = validateSubmittedRoute({
      game,
      network,
      route: req.body.route,
    });

    if (!validation.valid) {
      await saveGameResult({
        gameId: game.id,
        status: 'invalid',
        route: validation.route,
        finalScore: 0,
        steps: [],
      });

      const savedGame = await getGameById(game.id);

      return res.json({
        game: toGameAssignment(savedGame),
        validation,
        execution: {
          initialCoins: INITIAL_COINS,
          finalCoins: 0,
          finalScore: 0,
          steps: [],
        },
      });
    }

    const execution = await executeValidRoute(validation.route, getRandomEvent);

    await saveGameResult({
      gameId: game.id,
      status: 'completed',
      route: validation.route,
      finalScore: execution.finalScore,
      steps: execution.steps,
    });

    const [savedGame, savedSteps] = await Promise.all([
      getGameById(game.id),
      getGameSteps(game.id),
    ]);

    return res.json({
      game: toGameAssignment(savedGame),
      validation,
      execution: {
        initialCoins: INITIAL_COINS,
        finalCoins: execution.finalCoins,
        finalScore: execution.finalScore,
        steps: savedSteps,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
