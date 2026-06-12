const MIN_DESTINATION_DISTANCE = 3;

function buildAdjacency(stations, segments) {
  const adjacency = new Map(stations.map((station) => [station.id, []]));

  for (const segment of segments) {
    adjacency.get(segment.fromStationId).push(segment.toStationId);
    adjacency.get(segment.toStationId).push(segment.fromStationId);
  }

  return adjacency;
}

function getShortestDistances(startStationId, adjacency) {
  const distances = new Map([[startStationId, 0]]);
  const queue = [startStationId];

  for (let index = 0; index < queue.length; index += 1) {
    const currentStationId = queue[index];
    const currentDistance = distances.get(currentStationId);

    for (const nextStationId of adjacency.get(currentStationId) ?? []) {
      if (!distances.has(nextStationId)) {
        distances.set(nextStationId, currentDistance + 1);
        queue.push(nextStationId);
      }
    }
  }

  return distances;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function chooseStartAndDestination(network) {
  const adjacency = buildAdjacency(network.stations, network.segments);
  const candidates = [];

  for (const start of network.stations) {
    const distances = getShortestDistances(start.id, adjacency);

    for (const destination of network.stations) {
      const distance = distances.get(destination.id);

      if (
        start.id !== destination.id &&
        distance !== undefined &&
        distance >= MIN_DESTINATION_DISTANCE
      ) {
        candidates.push({
          start,
          destination,
          distance,
        });
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error('No valid start/destination pair found');
  }

  return randomItem(candidates);
}

export function toPlanningSegment(segment) {
  return {
    key: segment.key,
    fromStationId: segment.fromStationId,
    fromStationName: segment.fromStationName,
    toStationId: segment.toStationId,
    toStationName: segment.toStationName,
  };
}
