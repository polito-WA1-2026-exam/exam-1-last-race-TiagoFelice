import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, createGame, getGameSetup, submitGameRoute } from '../../api'
import { PHASES } from '../constants'
import { segmentKey } from '../utils/route'

function getTimeLeft(planningDeadlineAt, fallbackSeconds) {
  const deadline = Date.parse(planningDeadlineAt)

  if (Number.isNaN(deadline)) {
    return fallbackSeconds
  }

  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
}

export function useGameFlow() {
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
  const submissionInFlight = useRef(false)

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
    async (routeToSubmit) => {
      if (!game || submissionInFlight.current) {
        return
      }

      const selectedRoute = Array.isArray(routeToSubmit) ? routeToSubmit : route

      submissionInFlight.current = true
      setSubmitting(true)
      setError(null)

      try {
        const data = await submitGameRoute(game.id, selectedRoute)
        setResult(data)
        setGame(data.game)
        setPhase(data.validation.valid ? PHASES.execution : PHASES.result)
      } catch (error) {
        if (error instanceof ApiError) {
          setError(`The route could not be submitted: ${error.message}`)
        } else {
          setError('The route could not be submitted. Check that the API server is running.')
        }
      } finally {
        submissionInFlight.current = false
        setSubmitting(false)
      }
    },
    [game, route],
  )

  useEffect(() => {
    submitRouteRef.current = submitRoute
  }, [submitRoute])

  useEffect(() => {
    if (phase !== PHASES.planning || !game) {
      return undefined
    }

    const planningSeconds = game.planningTimeSeconds ?? 90
    const parsedDeadline = Date.parse(game.planningDeadlineAt)
    const deadline = Number.isNaN(parsedDeadline)
      ? Date.now() + planningSeconds * 1000
      : parsedDeadline
    const timeUntilDeadline = Math.max(0, deadline - Date.now())
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
    }, timeUntilDeadline)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(timeout)
    }
  }, [game, phase])

  const startPlanning = useCallback(async () => {
    setStarting(true)
    setError(null)

    try {
      const data = await createGame()
      setGame(data.game)
      setPlanningMap(data.map)
      setSegments(data.segments)
      setRoute([])
      setTimeLeft(
        getTimeLeft(data.game.planningDeadlineAt, data.game.planningTimeSeconds),
      )
      setResult(null)
      setPhase(PHASES.planning)
    } catch {
      setError('Cannot start a new game right now.')
    } finally {
      setStarting(false)
    }
  }, [])

  const selectSegment = useCallback(
    (segment) => {
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
    },
    [game],
  )

  const undoRoute = useCallback(() => {
    setRoute((currentRoute) => currentRoute.slice(0, -1))
  }, [])

  const clearRoute = useCallback(() => {
    setRoute([])
  }, [])

  const showResult = useCallback(() => {
    setPhase(PHASES.result)
  }, [])

  const resetToSetup = useCallback(() => {
    setPhase(PHASES.setup)
    setGame(null)
    setPlanningMap(null)
    setSegments([])
    setRoute([])
    setTimeLeft(90)
    setResult(null)
    setError(null)
  }, [])

  return {
    clearRoute,
    error,
    game,
    phase,
    planningMap,
    resetToSetup,
    result,
    route,
    segments,
    selectSegment,
    setupLoading,
    setupNetwork,
    showResult,
    startPlanning,
    starting,
    submitRoute,
    submitting,
    timeLeft,
    undoRoute,
  }
}
