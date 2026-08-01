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

interface RouterValue {
  path: string
  navigate: (target: string, replace?: boolean) => void
}

const RouterContext = createContext<RouterValue | null>(null)

function currentPath() {
  return window.location.pathname
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const handlePopState = () => setPath(currentPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((target: string, replace = false) => {
    if (replace) window.history.replaceState({}, '', target)
    else window.history.pushState({}, '', target)
    setPath(window.location.pathname)
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const router = useContext(RouterContext)
  if (!router) throw new Error('useRouter debe utilizarse dentro de RouterProvider')
  return router
}
