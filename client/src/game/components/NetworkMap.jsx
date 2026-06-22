import { useMemo } from 'react'

export function NetworkMap({
  network,
  route = [],
  showLines = true,
  startStationId,
  destinationStationId,
  currentStationId,
}) {
  const stationsById = useMemo(
    () => new Map(network.stations.map((station) => [station.id, station])),
    [network.stations],
  )

  const routeLines = route
    .map((step) => {
      const from = stationsById.get(step.fromStationId)
      const to = stationsById.get(step.toStationId)
      return from && to ? { from, to } : null
    })
    .filter(Boolean)

  return (
    <div className="map-frame">
      <svg
        className="network-map"
        viewBox="60 60 820 680"
        role="img"
        aria-label="Underground network map"
      >
        {showLines
          ? network.lines.map((line) => (
              <polyline
                key={line.id}
                className="map-line"
                points={line.stops.map((stop) => `${stop.x},${stop.y}`).join(' ')}
                stroke={line.color}
              />
            ))
          : null}

        {routeLines.map((line, index) => (
          <line
            className="selected-route-line"
            key={`${line.from.id}-${line.to.id}-${index}`}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
          />
        ))}

        {network.stations.map((station) => {
          const classes = ['map-station']

          if (station.id === startStationId) {
            classes.push('start')
          }

          if (station.id === destinationStationId) {
            classes.push('destination')
          }

          if (station.id === currentStationId) {
            classes.push('current')
          }

          return (
            <g className={classes.join(' ')} key={station.id}>
              <circle cx={station.x} cy={station.y} r="10" />
              <text x={station.x + 14} y={station.y - 12}>
                {station.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
