import { useEffect, useMemo, useState } from 'react'
import { ApiError, getInstructions } from './api'
import GameView from './game/GameView.jsx'
import { useSession } from './sessionContext'
import './App.css'

const routes = new Set(['/', '/login', '/game', '/ranking'])

function navigate(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event('popstate'))
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return routes.has(pathname) ? pathname : '/'
}

function RouteLink({ to, children, className }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

function AppHeader() {
  const { user, loading, isAuthenticated, logout } = useSession()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="app-header">
      <RouteLink to="/" className="brand">
        <span className="brand-mark">LR</span>
        <span>Last Race</span>
      </RouteLink>

      <nav className="main-nav" aria-label="Main navigation">
        <RouteLink to="/">Instructions</RouteLink>
        <RouteLink to="/game">Game</RouteLink>
        <RouteLink to="/ranking">Ranking</RouteLink>
      </nav>

      <div className="session-area">
        {loading ? (
          <span className="muted">Checking session</span>
        ) : isAuthenticated ? (
          <>
            <span className="session-user">{user.displayName}</span>
            <button type="button" className="secondary-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <RouteLink to="/login" className="primary-button">
            Login
          </RouteLink>
        )}
      </div>
    </header>
  )
}

function HomePage() {
  const { isAuthenticated } = useSession()
  const [instructions, setInstructions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadInstructions() {
      setLoading(true)
      setError(null)

      try {
        const data = await getInstructions()

        if (!cancelled) {
          setInstructions(data)
        }
      } catch {
        if (!cancelled) {
          setError('Instructions are unavailable because the API server is not reachable.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInstructions()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page page-narrow">
      <section className="intro-section">
        <p className="eyebrow">Single-player route planning</p>
        <h1>Last Race</h1>
        <p className="lead">
          Plan a valid underground route, survive random events, and finish with
          the highest possible coin score.
        </p>
        <div className="action-row">
          {isAuthenticated ? (
            <RouteLink to="/game" className="primary-button">
              Start game
            </RouteLink>
          ) : (
            <RouteLink to="/login" className="primary-button">
              Login to play
            </RouteLink>
          )}
          <RouteLink to="/ranking" className="secondary-link">
            View ranking
          </RouteLink>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <h2>Instructions</h2>
          <p>Anonymous visitors can read this section only.</p>
        </div>

        {loading ? <p className="muted">Loading instructions</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {instructions ? (
          <>
            <p>{instructions.goal}</p>
            <div className="phase-grid">
              {instructions.phases.map((phase) => (
                <article className="phase-item" key={phase.name}>
                  <h3>{phase.name}</h3>
                  <p>{phase.description}</p>
                </article>
              ))}
            </div>
            <p className="muted">{instructions.anonymousAccess}</p>
          </>
        ) : null}
      </section>
    </main>
  )
}

function LoginPage() {
  const { isAuthenticated, login } = useSession()
  const [username, setUsername] = useState('tiago')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login({ username, password })
      navigate('/game')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid username or password.')
      } else {
        setError('Login failed because the API server is not reachable.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return (
      <main className="page page-narrow">
        <section className="content-panel">
          <h1>Logged in</h1>
          <p>Your session is active.</p>
          <RouteLink to="/game" className="primary-button">
            Continue
          </RouteLink>
        </section>
      </main>
    )
  }

  return (
    <main className="page page-narrow">
      <section className="content-panel login-panel">
        <div className="section-heading">
          <h1>Login</h1>
          <p>Use the seeded account to start a session.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="error-message">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Logging in' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

function ProtectedPage({ title, description, children }) {
  const { loading, isAuthenticated } = useSession()

  if (loading) {
    return (
      <main className="page page-narrow">
        <section className="content-panel">
          <p className="muted">Checking session</p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="page page-narrow">
        <section className="content-panel">
          <h1>{title}</h1>
          <p>{description}</p>
          <RouteLink to="/login" className="primary-button">
            Login
          </RouteLink>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="content-panel">
        <div className="section-heading">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

function GamePage() {
  return (
    <ProtectedPage
      title="Game"
      description="Study the network, plan a route, execute it, and review the score."
    >
      <GameView />
    </ProtectedPage>
  )
}

function RankingPage() {
  return (
    <ProtectedPage
      title="Ranking"
      description="The ranking view will be connected after the game flow is in place."
    >
      <div className="empty-state">
        <p>No ranking data is loaded in this client step.</p>
      </div>
    </ProtectedPage>
  )
}

function App() {
  const pathname = usePathname()
  const page = useMemo(() => {
    if (pathname === '/login') {
      return <LoginPage />
    }

    if (pathname === '/game') {
      return <GamePage />
    }

    if (pathname === '/ranking') {
      return <RankingPage />
    }

    return <HomePage />
  }, [pathname])

  return (
    <div className="app-shell">
      <AppHeader />
      {page}
    </div>
  )
}

export default App
