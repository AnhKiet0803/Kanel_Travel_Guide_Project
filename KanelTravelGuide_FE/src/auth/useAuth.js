import { useContext } from 'react'
import { AuthContext } from './AuthContext.js'

/** Returns { user, loading, signIn, signOut } from AuthProvider. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.')
  return context
}
