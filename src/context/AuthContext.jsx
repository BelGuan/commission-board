import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import { setUnauthorizedHandler } from '../lib/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getCurrentUser()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  const signIn = useCallback(async (credentials) => {
    const { user: signedIn } = await api.login(credentials)
    setUser(signedIn)
    return signedIn
  }, [])

  const signUp = useCallback(async (payload) => {
    const { user: created } = await api.register(payload)
    setUser(created)
    return created
  }, [])

  const signOut = useCallback(async () => {
    await api.logout()
    setUser(null)
    navigate('/')
  }, [navigate])

  const refresh = useCallback(async () => {
    const me = await api.getCurrentUser()
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isArtist: Boolean(user?.artistProfile),
      signIn,
      signUp,
      signOut,
      refresh,
      setUser,
    }),
    [user, loading, signIn, signUp, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export default AuthContext
