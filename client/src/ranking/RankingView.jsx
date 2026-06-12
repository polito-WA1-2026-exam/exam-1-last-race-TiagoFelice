import { useEffect, useState } from 'react'
import { getRanking } from '../api'

function RankingTable({ rows }) {
  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th scope="col">Position</th>
            <th scope="col">Player</th>
            <th scope="col">Best score</th>
            <th scope="col">Finished games</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.userId}>
              <td>{index + 1}</td>
              <td>
                <strong>{row.displayName}</strong>
                <span>{row.username}</span>
              </td>
              <td>{row.bestScore}</td>
              <td>{row.playedGames}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankingView() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadRanking() {
      try {
        const data = await getRanking()

        if (!cancelled) {
          setRanking(data.ranking)
        }
      } catch {
        if (!cancelled) {
          setError('Cannot load the ranking from the API server.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRanking()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="muted">Loading ranking</p>
  }

  if (error) {
    return <p className="error-message">{error}</p>
  }

  if (ranking.length === 0) {
    return (
      <div className="empty-state">
        <h2>No stored scores yet</h2>
        <p>Complete a game to create the first ranking entry.</p>
      </div>
    )
  }

  return <RankingTable rows={ranking} />
}

export default RankingView
