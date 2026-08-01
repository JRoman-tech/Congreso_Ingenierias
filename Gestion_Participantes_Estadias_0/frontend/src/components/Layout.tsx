import {
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import NotificationCenter from './NotificationCenter'

const adminNavigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/participantes', label: 'Participantes', icon: Users },
  { to: '/dashboard/academica', label: 'Información académica', icon: GraduationCap },
  { to: '/dashboard/documentos', label: 'Documentos', icon: FolderOpen },
  { to: '/dashboard/trabajos', label: 'Trabajos', icon: FileText },
  { to: '/dashboard/historial', label: 'Historial', icon: History },
  { to: '/modulo-validacion/', label: 'Validación', icon: ShieldCheck, external: true },
]

const participantNavigation = [
  { to: '/dashboard', label: 'Mi panel', icon: LayoutDashboard },
  { to: '/dashboard/academica', label: 'Mi información académica', icon: GraduationCap },
  { to: '/dashboard/documentos', label: 'Mis documentos', icon: FolderOpen },
  { to: '/dashboard/trabajos', label: 'Mis trabajos', icon: FileText },
  { to: '/modulo-validacion/participante', label: 'Mi validación', icon: ShieldCheck, external: true },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { path, navigate } = useRouter()
  const { user, logout } = useSession()
  const [open, setOpen] = useState(false)
  const navigation = user?.rol === 'administrador' ? adminNavigation : participantNavigation

  function closeSession() {
    logout()
    navigate('/')
    setOpen(false)
  }

  return (
    <div className="shell">
      <button className="menu-button" type="button" onClick={() => setOpen(value => !value)}>
        {open ? <X /> : <Menu />}
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-number">2</span>
          <div>
            <strong>FRONTERAS</strong>
            <small>DE LAS INGENIERÍAS 2026</small>
          </div>
        </div>

        <nav>
          {navigation.map(({ to, label, icon: Icon, external }) => {
            const active = to === '/dashboard' ? path === to : path.startsWith(to)
            return (
              <a
                key={to}
                href={to}
                onClick={event => {
                  if (external) {
                    setOpen(false)
                    return
                  }
                  event.preventDefault()
                  navigate(to)
                  setOpen(false)
                }}
                className={active ? 'nav-link active' : 'nav-link'}
              >
                <Icon size={19} />
                <span>{label}</span>
              </a>
            )
          })}
        </nav>

        <div className="session-card">
          <div className="session-heading">
            {user?.rol === 'administrador'
              ? <ShieldCheck size={19} />
              : <UserCircle size={19} />}
            <span>Sesión iniciada</span>
          </div>
          <strong>{user?.nombre}</strong>
          <small>{user?.correo}</small>
          <span className="session-role">
            {user?.rol === 'administrador' ? 'Administrador' : 'Participante'}
          </span>

          <button className="logout-button" type="button" onClick={closeSession}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>

        <div className="institution">Universidad Autónoma de Ciudad Juárez</div>
      </aside>

      <main className="content">
        <NotificationCenter />
        {children}
      </main>
    </div>
  )
}
