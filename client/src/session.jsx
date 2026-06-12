import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ApiError, getCurrentSession, loginSession, logoutSession } from './api'
import { SessionContext } from './sessionContext'

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshSession = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await getCurrentSession()
      setUser(data.user)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
      } else {
        setError('Cannot reach the server right now.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getCurrentSession()
      .then((data) => {
        if (!cancelled) {
          setUser(data.user)
          setError(null)
        }
      })
      .catch((err) => {
        if (cancelled) {
          return
        }

        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
        } else {
          setError('Cannot reach the server right now.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginSession(credentials)
    setUser(data.user)
    setError(null)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await logoutSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshSession,
    }),
    [error, loading, login, logout, refreshSession, user],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
