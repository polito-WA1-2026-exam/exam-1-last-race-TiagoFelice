export function ResultPhase({ result, onNewGame }) {
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
        <button
          className="primary-button wide-button"
          type="button"
          onClick={onNewGame}
        >
          New game
        </button>
      </aside>
    </div>
  )
}
