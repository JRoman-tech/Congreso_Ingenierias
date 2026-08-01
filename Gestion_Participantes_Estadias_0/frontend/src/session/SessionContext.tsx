/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, sessionApi, validationIntegrationApi } from '../api'
import type { SessionUser } from '../types'

const STORAGE_KEY = 'usuarioSesionId'
const VALIDATION_USER_KEY = 'usuario'

async function syncValidationSession(sessionUser: SessionUser) {
  try {
    const { data } = await validationIntegrationApi.sincronizarSesion(sessionUser.id)
    window.localStorage.setItem(VALIDATION_USER_KEY, JSON.stringify(data))
  } catch {
    // El módulo principal sigue disponible aunque validación esté temporalmente apagado.
    window.localStorage.removeItem(VALIDATION_USER_KEY)
  }
}

interface SessionValue {
  user: SessionUser | null
  loading: boolean
  error: string
  login: (correo: string, password: string) => Promise<SessionUser>
  register: (data: object) => Promise<SessionUser>
  logout: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const storedId = window.localStorage.getItem(STORAGE_KEY)
      if (!storedId) {
        setLoading(false)
        return
      }
      try {
        const { data } = await sessionApi.obtener(storedId)
        setUser(data)
        void syncValidationSession(data as SessionUser)
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const establishSession = useCallback((sessionUser: SessionUser) => {
    window.localStorage.setItem(STORAGE_KEY, sessionUser.id)
    setUser(sessionUser)
    setError('')
    void syncValidationSession(sessionUser)
    return sessionUser
  }, [])

  const login = useCallback(async (correo: string, password: string) => {
    const { data } = await authApi.login(correo, password)
    return establishSession(data as SessionUser)
  }, [establishSession])

  const register = useCallback(async (data: object) => {
    const response = await authApi.registrar(data)
    return establishSession(response.data as SessionUser)
  }, [establishSession])

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(VALIDATION_USER_KEY)
    setUser(null)
    setError('')
  }, [])

  const value = useMemo(() => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession debe utilizarse dentro de SessionProvider')
  return context
}
