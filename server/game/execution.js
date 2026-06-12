export const INITIAL_COINS = 20;

export async function executeValidRoute(route, getRandomEvent) {
  let coinTotal = INITIAL_COINS;
  const steps = [];

  for (const [index, routeStep] of route.entries()) {
    const event = await getRandomEvent();
    coinTotal += event.coinDelta;

    steps.push({
      stepNumber: index + 1,
      fromStationId: routeStep.fromStationId,
      toStationId: routeStep.toStationId,
      eventId: event.id,
      event,
      coinTotal,
    });
  }

  return {
    finalCoins: coinTotal,
    finalScore: Math.max(coinTotal, 0),
    steps,
  };
}
