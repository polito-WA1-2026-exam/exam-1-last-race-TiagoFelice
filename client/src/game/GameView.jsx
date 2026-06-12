import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createGame, getGameSetup, submitGameRoute } from '../api'

const PHASES = {
  setup: 'setup',
  planning: 'planning',
  execution: 'execution',
  result: 'result',
}

function segmentKey(fromStationId, toStationId) {
  return [fromStationId, toStationId].sort((a, b) => a - b).join('-')
}

function formatDelta(value) {
  if (value > 0) {
    return `+${value}`
  }

  return String(value)
}

function getStationName(stationsById, stationId) {
  return stationsById.get(stationId)?.name ?? `Station ${stationId}`
}

function NetworkMap({
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

function RouteList({ route, stationsById }) {
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

function SegmentPicker({
  segments,
  currentStationId,
  route,
  onSelectSegment,
}) {
  const usedSegmentKeys = useMemo(
    () =>
      new Set(
        route.map((step) => segmentKey(step.fromStationId, step.toStationId)),
      ),
    [route],
  )

  const availableSegments = segments.filter(
    (segment) =>
      segment.fromStationId === currentStationId ||
      segment.toStationId === currentStationId,
  )

  return (
    <div className="segment-list" aria-label="Available route segments">
      {availableSegments.length === 0 ? (
        <p className="muted">No unused segment leaves the current station.</p>
      ) : null}

      {availableSegments.map((segment) => {
        const key = segmentKey(segment.fromStationId, segment.toStationId)
        const used = usedSegmentKeys.has(key)
        const nextStationName =
          segment.fromStationId === currentStationId
            ? segment.toStationName
            : segment.fromStationName

        return (
          <button
            className="segment-button"
            disabled={used}
            key={segment.key}
            type="button"
            onClick={() => onSelectSegment(segment)}
          >
            <span>{nextStationName}</span>
            <span>{used ? 'used' : 'select'}</span>
          </button>
        )
      })}
    </div>
  )
}

function SetupPhase({ network, loading, error, starting, onStart }) {
  if (loading) {
    return <p className="muted">Loading network</p>
  }

  if (error && !network) {
    return <p className="error-message">{error}</p>
  }

  if (!network) {
    return null
  }

  return (
    <div className="game-layout">
      <NetworkMap network={network} />
      <aside className="game-side-panel">
        <div>
          <h2>Setup</h2>
          <p>
            Study the complete network before starting. The next phase hides the
            connecting lines and starts the timer.
          </p>
        </div>

        <dl className="network-stats">
          <div>
            <dt>Stations</dt>
            <dd>{network.stations.length}</dd>
          </div>
          <div>
            <dt>Lines</dt>
            <dd>{network.lines.length}</dd>
          </div>
          <div>
            <dt>Segments</dt>
            <dd>{network.segments.length}</dd>
          </div>
          <div>
            <dt>Interchanges</dt>
            <dd>{network.interchangeStations.length}</dd>
          </div>
        </dl>

        <button
          className="primary-button wide-button"
          disabled={starting}
          type="button"
          onClick={onStart}
        >
          {starting ? 'Starting' : 'Start planning'}
        </button>
      </aside>
    </div>
  )
}

function PlanningPhase({
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
            onClick={onSubmit}
          >
            {submitting ? 'Submitting' : 'Submit'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function ExecutionPhase({ result, onShowResult }) {
  const steps = result.execution.steps

  return (
    <div className="execution-layout">
      <section>
        <h2>Execution</h2>
        <div className="execution-steps">
          {steps.map((step) => (
            <article className="execution-step" key={step.stepNumber}>
              <div className="step-number">Step {step.stepNumber}</div>
              <h3>
                {step.fromStationName} to {step.toStationName}
              </h3>
              <p>{step.event.description}</p>
              <div className="coin-row">
                <span>{formatDelta(step.event.coinDelta)} coins</span>
                <strong>{step.coinTotal} total</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="game-side-panel">
        <div className="timer-box">
          <span>Initial coins</span>
          <strong>{result.execution.initialCoins}</strong>
        </div>
        <div className="timer-box">
          <span>Projected score</span>
          <strong>{result.execution.finalScore}</strong>
        </div>
        <button className="primary-button wide-button" type="button" onClick={onShowResult}>
          Show result
        </button>
      </aside>
    </div>
  )
}

function ResultPhase({ result, onNewGame }) {
  const valid = result.validation.valid

  return (
    <div className="result-layout">
      <section className="result-score">
        <span>{valid ? 'Final score' : 'Route failed'}</span>
        <strong>{result.execution.finalScore}</strong>
        <p>
          {valid
            ? `You finished with ${result.execution.finalCoins} coins before score normalization.`
            : result.validation.reason}
        </p>
      </section>

      <aside className="game-side-panel">
        <h2>{valid ? 'Completed' : 'Invalid Route'}</h2>
        <p>
          {valid
            ? `${result.execution.steps.length} segment events were applied.`
            : 'Execution was skipped and the score was stored as zero.'}
        </p>
        <button className="primary-button wide-button" type="button" onClick={onNewGame}>
          New game
        </button>
      </aside>
    </div>
  )
}

function GameView() {
  const [phase, setPhase] = useState(PHASES.setup)
  const [setupNetwork, setSetupNetwork] = useState(null)
  const [setupLoading, setSetupLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [game, setGame] = useState(null)
  const [planningMap, setPlanningMap] = useState(null)
  const [segments, setSegments] = useState([])
  const [route, setRoute] = useState([])
  const [timeLeft, setTimeLeft] = useState(90)
  const [result, setResult] = useState(null)
  const latestPlanning = useRef({ game: null, route: [], phase, submitting })
  const submitRouteRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function loadSetup() {
      try {
        const data = await getGameSetup()

        if (!cancelled) {
          setSetupNetwork(data.network)
        }
      } catch {
        if (!cancelled) {
          setError('Cannot load the network from the API server.')
        }
      } finally {
        if (!cancelled) {
          setSetupLoading(false)
        }
      }
    }

    loadSetup()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    latestPlanning.current = { game, route, phase, submitting }
  }, [game, phase, route, submitting])

  const submitRoute = useCallback(
    async (routeToSubmit = route) => {
      if (!game || submitting) {
        return
      }

      setSubmitting(true)
      setError(null)

      try {
        const data = await submitGameRoute(game.id, routeToSubmit)
        setResult(data)
        setGame(data.game)
        setPhase(data.validation.valid ? PHASES.execution : PHASES.result)
      } catch {
        setError('The route could not be submitted.')
      } finally {
        setSubmitting(false)
      }
    },
    [game, route, submitting],
  )

  useEffect(() => {
    submitRouteRef.current = submitRoute
  }, [submitRoute])

  useEffect(() => {
    if (phase !== PHASES.planning || !game) {
      return undefined
    }

    const planningSeconds = game.planningTimeSeconds ?? 90
    const deadline = Date.now() + planningSeconds * 1000
    const tick = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setTimeLeft(remaining)
    }, 250)
    const timeout = window.setTimeout(() => {
      const snapshot = latestPlanning.current

      if (
        snapshot.phase === PHASES.planning &&
        snapshot.game &&
        !snapshot.submitting
      ) {
        submitRouteRef.current?.(snapshot.route)
      }
    }, planningSeconds * 1000)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(timeout)
    }
  }, [game, phase])

  async function handleStartPlanning() {
    setStarting(true)
    setError(null)

    try {
      const data = await createGame()
      setGame(data.game)
      setPlanningMap(data.map)
      setSegments(data.segments)
      setRoute([])
      setTimeLeft(data.game.planningTimeSeconds)
      setResult(null)
      setPhase(PHASES.planning)
    } catch {
      setError('Cannot start a new game right now.')
    } finally {
      setStarting(false)
    }
  }

  function handleSelectSegment(segment) {
    if (!game) {
      return
    }

    setRoute((currentRoute) => {
      const currentStationId =
        currentRoute.length > 0
          ? currentRoute[currentRoute.length - 1].toStationId
          : game.startStation.id
      const key = segmentKey(segment.fromStationId, segment.toStationId)
      const used = currentRoute.some(
        (step) => segmentKey(step.fromStationId, step.toStationId) === key,
      )

      if (used) {
        return currentRoute
      }

      if (segment.fromStationId === currentStationId) {
        return [
          ...currentRoute,
          {
            fromStationId: segment.fromStationId,
            toStationId: segment.toStationId,
          },
        ]
      }

      if (segment.toStationId === currentStationId) {
        return [
          ...currentRoute,
          {
            fromStationId: segment.toStationId,
            toStationId: segment.fromStationId,
          },
        ]
      }

      return currentRoute
    })
  }

  function resetToSetup() {
    setPhase(PHASES.setup)
    setGame(null)
    setPlanningMap(null)
    setSegments([])
    setRoute([])
    setTimeLeft(90)
    setResult(null)
    setError(null)
  }

  return (
    <div className="game-flow">
      <div className="phase-tabs" aria-label="Game phases">
        {Object.values(PHASES).map((phaseName) => (
          <span
            className={phase === phaseName ? 'active' : ''}
            key={phaseName}
          >
            {phaseName}
          </span>
        ))}
      </div>

      {error && (phase !== PHASES.setup || setupNetwork) ? (
        <p className="error-message game-error">{error}</p>
      ) : null}

      {phase === PHASES.setup ? (
        <SetupPhase
          error={error}
          loading={setupLoading}
          network={setupNetwork}
          onStart={handleStartPlanning}
          starting={starting}
        />
      ) : null}

      {phase === PHASES.planning && game && planningMap ? (
        <PlanningPhase
          game={game}
          map={planningMap}
          onClear={() => setRoute([])}
          onSelectSegment={handleSelectSegment}
          onSubmit={() => submitRoute(route)}
          onUndo={() => setRoute((currentRoute) => currentRoute.slice(0, -1))}
          route={route}
          segments={segments}
          submitting={submitting}
          timeLeft={timeLeft}
        />
      ) : null}

      {phase === PHASES.execution && result ? (
        <ExecutionPhase
          onShowResult={() => setPhase(PHASES.result)}
          result={result}
        />
      ) : null}

      {phase === PHASES.result && result ? (
        <ResultPhase onNewGame={resetToSetup} result={result} />
      ) : null}
    </div>
  )
}

export default GameView
