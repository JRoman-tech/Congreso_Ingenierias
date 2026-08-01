import axios from 'axios'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'

const initial = {
  nombre: '', apellido_paterno: '', apellido_materno: '', correo: '',
  telefono: '', pais: 'México', institucion: '', categoria: 'Estudiante',
  password: '', confirmacion_password: '',
}

export default function Registro() {
  const { navigate } = useRouter()
  const { register } = useSession()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function change(field: string, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (form.password !== form.confirmacion_password) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { confirmacion_password: _confirmation, ...payload } = form
      void _confirmation
      await register(payload)
      navigate('/dashboard', true)
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error : undefined
      setError(message || 'No se pudo completar el registro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page register-page">
      <button className="back-home" onClick={() => navigate('/')}><ArrowLeft size={16} /> Volver al inicio</button>
      <form className="auth-card register-card" onSubmit={submit}>
        <span className="eyebrow">Nueva participación</span><h1>Crear cuenta</h1>
        <p className="muted">Elige una contraseña personal para proteger tu cuenta.</p>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid">
          <div className="field"><label>Nombre *</label><input required value={form.nombre} onChange={e => change('nombre', e.target.value)} /></div>
          <div className="field"><label>Apellido paterno *</label><input required value={form.apellido_paterno} onChange={e => change('apellido_paterno', e.target.value)} /></div>
          <div className="field"><label>Apellido materno</label><input value={form.apellido_materno} onChange={e => change('apellido_materno', e.target.value)} /></div>
          <div className="field"><label>Correo electrónico *</label><input required type="email" value={form.correo} onChange={e => change('correo', e.target.value)} /></div>
          <div className="field"><label>Teléfono</label><input value={form.telefono} onChange={e => change('telefono', e.target.value)} /></div>
          <div className="field"><label>País</label><input value={form.pais} onChange={e => change('pais', e.target.value)} /></div>
          <div className="field"><label>Institución</label><input value={form.institucion} onChange={e => change('institucion', e.target.value)} /></div>
          <div className="field"><label>Categoría</label><select value={form.categoria} onChange={e => change('categoria', e.target.value)}><option>Estudiante</option><option>Docente</option><option>Investigador</option><option>Profesional</option></select></div>
          <div className="field"><label>Contraseña *</label><input required type="password" minLength={6} maxLength={72} value={form.password} onChange={e => change('password', e.target.value)} /></div>
          <div className="field"><label>Confirmar contraseña *</label><input required type="password" minLength={6} maxLength={72} value={form.confirmacion_password} onChange={e => change('confirmacion_password', e.target.value)} /></div>
        </div>
        <button className="btn-primary auth-submit" disabled={saving}><UserPlus size={17} /> {saving ? 'Creando cuenta...' : 'Registrarme'}</button>
        <p className="auth-alternative">¿Ya estás registrado? <button type="button" onClick={() => navigate('/login')}>Inicia sesión</button></p>
      </form>
    </div>
  )
}
