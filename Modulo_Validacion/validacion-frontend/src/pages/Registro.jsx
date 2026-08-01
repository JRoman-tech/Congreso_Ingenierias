
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  const handleRegistro = () => {
    if (!nombre || !correo || !password || !confirmar) {
      setError("Todos los campos son obligatorios")
      return
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)
    setError(null)

    api.post("/usuarios/registro", { nombre, correo, password })
      .then(() => {
        navigate("/login?registrado=true")
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          setError("Este correo ya está registrado")
        } else {
          setError("Error al crear la cuenta, intenta de nuevo")
        }
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
          <h1 className="text-xl font-bold text-navy mt-3">Crear cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">Registro de participante</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Nombre completo
            </label>
            <Input
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Confirmar contraseña
            </label>
            <Input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegistro()}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <Button
            onClick={handleRegistro}
            disabled={cargando}
            className="w-full bg-navy hover:bg-navy/90 text-white"
          >
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-navy font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}