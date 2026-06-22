export function segmentKey(fromStationId, toStationId) {
  return [fromStationId, toStationId].sort((a, b) => a - b).join('-')
}

export function getStationName(stationsById, stationId) {
  return stationsById.get(stationId)?.name ?? `Station ${stationId}`
}
