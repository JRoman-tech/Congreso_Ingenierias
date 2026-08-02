import axios from 'axios'
import { ArrowLeft, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'

export default function Login() {
  const { navigate } = useRouter()
  const { user, login } = useSession()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard', true)
  }, [user, navigate])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await login(correo, password)
      navigate('/dashboard', true)
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error : undefined
      setError(message || 'No se pudo iniciar sesión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <button className="back-home" onClick={() => navigate('/')}><ArrowLeft size={16} /> Volver al inicio</button>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand"><span className="brand-number">2</span></div>
        <span className="eyebrow">Acceso de participantes</span>
        <h1>Iniciar sesión</h1>
        <p className="muted">Utiliza el correo con el que estás registrado.</p>
        {error && <div className="alert error">{error}</div>}
        <div className="field"><label>Correo electrónico</label><input required type="email" value={correo} onChange={event => setCorreo(event.target.value)} /></div>
        <div className="field"><label>Contraseña</label><input required type="password" value={password} onChange={event => setPassword(event.target.value)} /></div>
        <button className="btn-primary auth-submit" disabled={saving}><LogIn size={17} /> {saving ? 'Ingresando...' : 'Ingresar'}</button>
        <p className="auth-alternative">¿Aún no tienes cuenta? <button type="button" onClick={() => navigate('/registro')}>Regístrate</button></p>
      </form>
    </div>
  )
}
