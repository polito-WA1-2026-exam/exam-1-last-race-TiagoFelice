import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    title: 'Last Race',
    goal:
      'Plan a valid underground route before time runs out and finish with as many coins as possible.',
    phases: [
      {
        name: 'Setup',
        description:
          'A logged-in player studies the full network map with stations, lines, and connections.',
      },
      {
        name: 'Planning',
        description:
          'The player receives a start station, a destination station, and 90 seconds to select connected segments in sequence.',
      },
      {
        name: 'Execution',
        description:
          'The server validates the route and applies one random coin event for each segment.',
      },
      {
        name: 'Result',
        description:
          'The final score is the remaining coins. Negative totals are stored as zero.',
      },
    ],
    anonymousAccess:
      'Anonymous visitors can read these instructions, but cannot view the network map, play games, or see the ranking.',
  });
});

export default router;
