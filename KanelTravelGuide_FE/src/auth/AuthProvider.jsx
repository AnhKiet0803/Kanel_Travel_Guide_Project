// Keeps the sign-in state for the whole app. Wrap <App /> (or the router) with it once.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login, logout } from '../api/authApi.js'
import { AuthContext } from './AuthContext.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On page load, ask the backend whether the login cookie is still valid.
  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current)
      })
      .catch(() => {
        // Backend down or network error: treat as signed out
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (credentials) => {
    const signedIn = await login(credentials)
    setUser(signedIn)
    return signedIn
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
