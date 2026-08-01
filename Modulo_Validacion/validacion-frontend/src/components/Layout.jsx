import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShieldCheck, Bell, LogOut, ClipboardList } from "lucide-react"

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}")

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    navigate("/login")
  }

  const iniciales = usuario.nombre
    ? usuario.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")
    : "??"

  const navItems = usuario.rol === "admin"
    ? [{ label: "Validaciones", icon: ShieldCheck, path: "/" }]
    : [{ label: "Mi validación", icon: ClipboardList, path: "/participante" }]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-navy flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-gold text-[10px] font-bold tracking-wide leading-tight">
            CONGRESO INTERNACIONAL
          </p>
          <p className="text-white text-base font-extrabold leading-tight">
            FRONTERAS <span className="text-gold">2</span>
          </p>
          <p className="text-white/40 text-[9px] mt-0.5">DE LAS INGENIERÍAS 2026</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path
            return (
              <Link
                key={label}
                to={path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  active
                    ? "bg-gold text-navy font-semibold"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-gold text-[9px] font-semibold">UNIVERSIDAD AUTÓNOMA</p>
          <p className="text-white/50 text-[9px]">DE CIUDAD JUÁREZ</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-4 py-3">
          <Bell size={18} className="text-slate-400" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-navy text-gold text-[11px] font-bold flex items-center justify-center">
              {iniciales}
            </div>
            <span className="text-sm text-navy font-medium">{usuario.nombre || "Usuario"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}