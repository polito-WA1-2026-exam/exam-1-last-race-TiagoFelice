function toSegmentKey(firstStationId, secondStationId) {
  const low = Math.min(firstStationId, secondStationId);
  const high = Math.max(firstStationId, secondStationId);
  return `${low}-${high}`;
}

function buildKnownSegments(segments) {
  return new Set(
    segments.map((segment) =>
      toSegmentKey(segment.fromStationId, segment.toStationId),
    ),
  );
}

function isRouteStep(value) {
  return (
    value &&
    Number.isInteger(value.fromStationId) &&
    Number.isInteger(value.toStationId)
  );
}

function normalizeRoute(route) {
  if (!Array.isArray(route)) {
    return undefined;
  }

  return route.map((step) => ({
    fromStationId: step.fromStationId,
    toStationId: step.toStationId,
  }));
}

export function validateSubmittedRoute({ game, network, route }) {
  const normalizedRoute = normalizeRoute(route);

  if (!normalizedRoute) {
    return {
      valid: false,
      route: [],
      reason: 'Route must be an array of segment objects',
    };
  }

  if (normalizedRoute.length === 0) {
    return {
      valid: false,
      route: normalizedRoute,
      reason: 'Route is empty',
    };
  }

  const knownSegments = buildKnownSegments(network.segments);
  const usedSegments = new Set();
  let expectedFromStationId = game.startStationId;

  for (const [index, step] of normalizedRoute.entries()) {
    if (!isRouteStep(step)) {
      return {
        valid: false,
        route: normalizedRoute,
        reason: `Route step ${index + 1} is malformed`,
      };
    }

    if (step.fromStationId !== expectedFromStationId) {
      return {
        valid: false,
        route: normalizedRoute,
        reason: `Route step ${index + 1} does not continue from the current station`,
      };
    }

    const segmentKey = toSegmentKey(step.fromStationId, step.toStationId);

    if (!knownSegments.has(segmentKey)) {
      return {
        valid: false,
        route: normalizedRoute,
        reason: `Route step ${index + 1} is not an existing segment`,
      };
    }

    if (usedSegments.has(segmentKey)) {
      return {
        valid: false,
        route: normalizedRoute,
        reason: `Route step ${index + 1} reuses a segment`,
      };
    }

    usedSegments.add(segmentKey);
    expectedFromStationId = step.toStationId;
  }

  if (expectedFromStationId !== game.destinationStationId) {
    return {
      valid: false,
      route: normalizedRoute,
      reason: 'Route does not reach the assigned destination',
    };
  }

  return {
    valid: true,
    route: normalizedRoute,
    reason: null,
  };
}
