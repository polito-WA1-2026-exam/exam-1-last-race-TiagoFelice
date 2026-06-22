import { NetworkMap } from '../components/NetworkMap'

export function SetupPhase({ network, loading, error, starting, onStart }) {
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
