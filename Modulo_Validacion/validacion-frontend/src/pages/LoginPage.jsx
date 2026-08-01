import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  const handleLogin = () => {
    setCargando(true)
    setError(null)
    console.log("Intentando login con:", correo, password)
    api
      .post("/usuarios/login", { correo, password })
      .then((response) => {
        console.log("Respuesta del backend:", response.data)
        const usuario = response.data
        localStorage.setItem("usuario", JSON.stringify(usuario))
        if (usuario.rol === "admin") {
          navigate("/")
        } else {
          navigate("/participante")
        }
      })
      .catch((err) => {
        console.log("Error en login:", err.response?.data, err.response?.status)
        setError("Correo o contraseña incorrectos")
        setCargando(false)
      })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-sm shadow-sm">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-navy inline-block px-4 py-2 rounded-lg mb-3">
            <p className="text-gold text-[10px] font-bold tracking-wide">CONGRESO INTERNACIONAL</p>
            <p className="text-white text-lg font-extrabold leading-tight">
              FRONTERAS <span className="text-gold">2</span>
            </p>
            <p className="text-white/50 text-[9px]">DE LAS INGENIERÍAS 2026</p>
          </div>
          <h1 className="text-xl font-bold text-navy mt-3">Iniciar sesión</h1>
          <p className="text-slate-500 text-sm mt-1">Módulo de validación</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Correo electrónico
            </label>
            <Input
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={cargando}
            className="w-full bg-navy hover:bg-navy/90 text-white"
          >
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </Button>
          <p className="text-center text-sm text-slate-500">
  ¿No tienes cuenta?{" "}
  <Link to="/registro" className="text-navy font-medium hover:underline">
    Regístrate aquí
  </Link>
</p>
        </div>
      </div>
    </div>
  )
}