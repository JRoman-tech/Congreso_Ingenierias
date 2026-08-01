import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ClipboardList,
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
} from "lucide-react"

const adminNavigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Participantes", icon: Users, href: "/dashboard/participantes" },
  { label: "Información académica", icon: GraduationCap, href: "/dashboard/academica" },
  { label: "Documentos", icon: FolderOpen, href: "/dashboard/documentos" },
  { label: "Trabajos", icon: FileText, href: "/dashboard/trabajos" },
  { label: "Historial", icon: History, href: "/dashboard/historial" },
  { label: "Validación", icon: ShieldCheck, to: "/" },
]

const participantNavigation = [
  { label: "Mi panel", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Mi información académica", icon: GraduationCap, href: "/dashboard/academica" },
  { label: "Mis documentos", icon: FolderOpen, href: "/dashboard/documentos" },
  { label: "Mis trabajos", icon: FileText, href: "/dashboard/trabajos" },
  { label: "Mi validación", icon: ClipboardList, to: "/participante" },
]

export default function Layout({ children }) {
  const location = useLocation()
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}")
  const [open, setOpen] = useState(false)
  const isAdmin = usuario.rol === "admin" || usuario.rol === "administrador"
  const navigation = isAdmin ? adminNavigation : participantNavigation

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    localStorage.removeItem("usuarioSesionId")
    window.location.assign("/")
  }

  return (
    <div className="ci-shell">
      <button
        className="ci-menu-button"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(value => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>

      <aside className={`ci-sidebar ${open ? "open" : ""}`}>
        <a className="ci-brand" href="/dashboard" aria-label="Ir al dashboard">
          <span className="ci-brand-number">2</span>
          <span>
            <strong>FRONTERAS</strong>
            <small>DE LAS INGENIERÍAS 2026</small>
          </span>
        </a>

        <nav>
          {navigation.map(({ label, icon: Icon, href, to }) => {
            const active = Boolean(to) && (
              to === "/" ? location.pathname === "/" || location.pathname.startsWith("/validacion/")
                : location.pathname.startsWith(to)
            )
            const className = active ? "ci-nav-link active" : "ci-nav-link"
            const content = <><Icon size={19} /><span>{label}</span></>

            return href ? (
              <a key={label} className={className} href={href} onClick={() => setOpen(false)}>
                {content}
              </a>
            ) : (
              <Link key={label} className={className} to={to} onClick={() => setOpen(false)}>
                {content}
              </Link>
            )
          })}
        </nav>

        <div className="ci-session-card">
          <div className="ci-session-heading">
            {isAdmin ? <ShieldCheck size={19} /> : <UserCircle size={19} />}
            <span>Sesión iniciada</span>
          </div>
          <strong>{usuario.nombre || "Usuario"}</strong>
          <small>{usuario.correo}</small>
          <span className="ci-session-role">{isAdmin ? "Administrador" : "Participante"}</span>
          <button className="ci-logout-button" type="button" onClick={handleLogout}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>

        <div className="ci-institution">Universidad Autónoma de Ciudad Juárez</div>
      </aside>

      <main className="ci-content">{children}</main>
    </div>
  )
}
