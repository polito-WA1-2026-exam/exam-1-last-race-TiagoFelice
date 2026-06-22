import { useMemo } from 'react'
import { NetworkMap } from '../components/NetworkMap'
import { RouteList } from '../components/RouteList'
import { SegmentPicker } from '../components/SegmentPicker'
import { getStationName } from '../utils/route'

export function PlanningPhase({
  game,
  map,
  segments,
  route,
  timeLeft,
  submitting,
  onSelectSegment,
  onUndo,
  onClear,
  onSubmit,
}) {
  const stationsById = useMemo(
    () => new Map(map.stations.map((station) => [station.id, station])),
    [map.stations],
  )
  const currentStationId =
    route.length > 0 ? route[route.length - 1].toStationId : game.startStation.id
  const currentStationName = getStationName(stationsById, currentStationId)

  return (
    <div className="game-layout">
      <NetworkMap
        currentStationId={currentStationId}
        destinationStationId={game.destinationStation.id}
        network={{ stations: map.stations, lines: [] }}
        route={route}
        showLines={false}
        startStationId={game.startStation.id}
      />

      <aside className="game-side-panel planning-panel">
        <div className="timer-box">
          <span>Time left</span>
          <strong>{timeLeft}s</strong>
        </div>

        <div className="assignment-box">
          <div>
            <span>Start</span>
            <strong>{game.startStation.name}</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>{game.destinationStation.name}</strong>
          </div>
          <div>
            <span>Current</span>
            <strong>{currentStationName}</strong>
          </div>
        </div>

        <div>
          <h2>Available Segments</h2>
          <SegmentPicker
            currentStationId={currentStationId}
            onSelectSegment={onSelectSegment}
            route={route}
            segments={segments}
          />
        </div>

        <div>
          <h2>Selected Route</h2>
          <RouteList route={route} stationsById={stationsById} />
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            disabled={route.length === 0 || submitting}
            type="button"
            onClick={onUndo}
          >
            Undo
          </button>
          <button
            className="secondary-button"
            disabled={route.length === 0 || submitting}
            type="button"
            onClick={onClear}
          >
            Clear
          </button>
          <button
            className="primary-button"
            disabled={submitting}
            type="button"
            onClick={() => onSubmit()}
          >
            {submitting ? 'Submitting' : 'Submit'}
          </button>
        </div>
      </aside>
    </div>
  )
}
