import axios from 'axios'
import { useEffect, useState } from 'react'
import { participantesApi } from '../api'
import { useRouter } from '../router'

const initial = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo: '',
  telefono: '',
  pais: '',
  institucion: '',
  categoria: 'Estudiante',
  requiere_carta_invitacion: false,
}

export default function ParticipanteForm({ id }: { id?: string }) {
  const { navigate } = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await participantesApi.obtener(id)
        setForm({
          nombre: data.nombre || '',
          apellido_paterno: data.apellido_paterno || '',
          apellido_materno: data.apellido_materno || '',
          correo: data.correo || '',
          telefono: data.telefono || '',
          pais: data.pais || '',
          institucion: data.institucion || '',
          categoria: data.categoria || 'Estudiante',
          requiere_carta_invitacion: Boolean(data.requiere_carta_invitacion),
        })
      } catch {
        setError('No se pudo cargar el participante')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id])

  function change(field: string, value: string | boolean) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (id) await participantesApi.actualizar(id, form)
      else await participantesApi.crear(form)
      navigate('/dashboard/participantes')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo guardar el participante')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{id ? 'Editar participante' : 'Nuevo participante'}</h1>
          <p className="muted">Datos generales y de contacto</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-card">
          <div className="form-grid">
            <div className="field">
              <label>Nombre *</label>
              <input required value={form.nombre} onChange={e => change('nombre', e.target.value)} />
            </div>
            <div className="field">
              <label>Apellido paterno *</label>
              <input required value={form.apellido_paterno} onChange={e => change('apellido_paterno', e.target.value)} />
            </div>
            <div className="field">
              <label>Apellido materno</label>
              <input value={form.apellido_materno} onChange={e => change('apellido_materno', e.target.value)} />
            </div>
            <div className="field">
              <label>Correo electrónico *</label>
              <input required type="email" value={form.correo} onChange={e => change('correo', e.target.value)} />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={e => change('telefono', e.target.value)} />
            </div>
            <div className="field">
              <label>País</label>
              <input value={form.pais} onChange={e => change('pais', e.target.value)} />
            </div>
            <div className="field">
              <label>Institución</label>
              <input value={form.institucion} onChange={e => change('institucion', e.target.value)} />
            </div>
            <div className="field">
              <label>Categoría *</label>
              <select value={form.categoria} onChange={e => change('categoria', e.target.value)}>
                <option>Estudiante</option>
                <option>Docente</option>
                <option>Investigador</option>
                <option>Profesional</option>
              </select>
            </div>
            <label className="checkbox-row full">
              <input
                type="checkbox"
                checked={form.requiere_carta_invitacion}
                onChange={e => change('requiere_carta_invitacion', e.target.checked)}
              />
              Requiere carta de invitación
            </label>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard/participantes')}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </section>
  )
}
