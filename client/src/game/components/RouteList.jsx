import { getStationName } from '../utils/route'

export function RouteList({ route, stationsById }) {
  if (route.length === 0) {
    return <p className="muted">No segments selected yet.</p>
  }

  return (
    <ol className="route-list">
      {route.map((step, index) => (
        <li key={`${step.fromStationId}-${step.toStationId}-${index}`}>
          <span>{getStationName(stationsById, step.fromStationId)}</span>
          <span className="route-arrow">to</span>
          <span>{getStationName(stationsById, step.toStationId)}</span>
        </li>
      ))}
    </ol>
  )
}
