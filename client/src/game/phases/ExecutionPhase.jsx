import { formatDelta } from '../utils/format'

export function ExecutionPhase({ result, onShowResult }) {
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
        <button
          className="primary-button wide-button"
          type="button"
          onClick={onShowResult}
        >
          Show result
        </button>
      </aside>
    </div>
  )
}
