import { PHASES } from './constants'
import { useGameFlow } from './hooks/useGameFlow'
import { ExecutionPhase } from './phases/ExecutionPhase'
import { PlanningPhase } from './phases/PlanningPhase'
import { ResultPhase } from './phases/ResultPhase'
import { SetupPhase } from './phases/SetupPhase'

function PhaseTabs({ activePhase }) {
  return (
    <div className="phase-tabs" aria-label="Game phases">
      {Object.values(PHASES).map((phaseName) => (
        <span className={activePhase === phaseName ? 'active' : ''} key={phaseName}>
          {phaseName}
        </span>
      ))}
    </div>
  )
}

function GameView() {
  const {
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
  } = useGameFlow()

  return (
    <div className="game-flow">
      <PhaseTabs activePhase={phase} />

      {error && (phase !== PHASES.setup || setupNetwork) ? (
        <p className="error-message game-error">{error}</p>
      ) : null}

      {phase === PHASES.setup ? (
        <SetupPhase
          error={error}
          loading={setupLoading}
          network={setupNetwork}
          onStart={startPlanning}
          starting={starting}
        />
      ) : null}

      {phase === PHASES.planning && game && planningMap ? (
        <PlanningPhase
          game={game}
          map={planningMap}
          onClear={clearRoute}
          onSelectSegment={selectSegment}
          onSubmit={submitRoute}
          onUndo={undoRoute}
          route={route}
          segments={segments}
          submitting={submitting}
          timeLeft={timeLeft}
        />
      ) : null}

      {phase === PHASES.execution && result ? (
        <ExecutionPhase onShowResult={showResult} result={result} />
      ) : null}

      {phase === PHASES.result && result ? (
        <ResultPhase onNewGame={resetToSetup} result={result} />
      ) : null}
    </div>
  )
}

export default GameView
