import { createContext } from 'react'

// Value: { user, loading, signIn(credentials), signOut() }
// user = null when signed out; otherwise { userId, username, fullName, email, role }.
export const AuthContext = createContext(null)
