import axios from 'axios'
import { useEffect, useState } from 'react'
import { participantesApi, trabajosApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { Participante, Trabajo } from '../types'

const TOPICS = [
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Tecnologías de la Información',
  'Ciencias Ambientales',
  'Materiales Avanzados',
]

const initial = {
  participante_id: '',
  titulo: '',
  resumen: '',
  eje_tematico: '',
  palabras_clave: '',
  modalidad: 'presencial',
}

export default function TrabajoForm({
  id,
  readOnly = false,
  fixedParticipantId,
}: {
  id?: string
  readOnly?: boolean
  fixedParticipantId?: string
}) {
  const { navigate } = useRouter()
  const { user } = useSession()
  const [participants, setParticipants] = useState<Participante[]>([])
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [workStatus, setWorkStatus] = useState<Trabajo['estado']>('pendiente')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const [participantsResponse, workResponse] = await Promise.all([
          participantesApi.listar({ page: 1, limit: 1000 }),
          id ? trabajosApi.obtener(id) : Promise.resolve(null),
        ])
        setParticipants(participantsResponse.data.data)
        if (workResponse) {
          const work = workResponse.data
          setWorkStatus(work.estado || 'pendiente')
          if (fixedParticipantId && work.participante_id !== fixedParticipantId) {
            setError('Este trabajo no pertenece al participante de la sesión')
            return
          }
          setForm({
            participante_id: work.participante_id || '',
            titulo: work.titulo || '',
            resumen: work.resumen || '',
            eje_tematico: work.eje_tematico || '',
            palabras_clave: work.palabras_clave || '',
            modalidad: work.modalidad || 'presencial',
          })
        } else if (fixedParticipantId) {
          setForm(current => ({ ...current, participante_id: fixedParticipantId }))
        }
      } catch {
        setError('No se pudo cargar el formulario')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id, fixedParticipantId])

  function change(field: string, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function changeStatus(status: Trabajo['estado']) {
    if (!id) return
    try {
      await trabajosApi.actualizarEstado(id, status, user?.id)
      setWorkStatus(status)
      setError('')
    } catch {
      setError('No se pudo actualizar el estado del trabajo')
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (readOnly) return
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, usuario_id: user?.id }
      if (id) await trabajosApi.actualizar(id, payload)
      else await trabajosApi.crear(payload)
      navigate('/dashboard/trabajos')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo guardar el trabajo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{readOnly ? 'Detalle del trabajo' : id ? 'Editar trabajo' : 'Nuevo trabajo'}</h1>
          <p className="muted">Información académica de la ponencia</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {id && readOnly && (
        <div className="form-card review-bar">
          <div>
            <span className="muted">Estado de revisión</span>
            <strong className={`status-badge status-${workStatus}`}>
              {workStatus === 'en_revision' ? 'En revisión' : workStatus}
            </strong>
          </div>
          {user?.rol === 'administrador' && (
            <select
              className={`status-select status-${workStatus}`}
              value={workStatus}
              onChange={event => void changeStatus(event.target.value as Trabajo['estado'])}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En revisión</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          )}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-card">
          <div className="form-grid">
            <div className="field full">
              <label>Autor principal *</label>
              <select
                required
                disabled={readOnly || Boolean(fixedParticipantId)}
                value={form.participante_id}
                onChange={e => change('participante_id', e.target.value)}
              >
                <option value="">Selecciona un participante</option>
                {participants.map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {participant.nombre} {participant.apellido_paterno} · {participant.correo}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>Título *</label>
              <input
                required
                disabled={readOnly}
                value={form.titulo}
                onChange={e => change('titulo', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Eje temático *</label>
              <select
                required
                disabled={readOnly}
                value={form.eje_tematico}
                onChange={e => change('eje_tematico', e.target.value)}
              >
                <option value="">Selecciona un eje</option>
                {TOPICS.map(topic => <option key={topic}>{topic}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Modalidad *</label>
              <select disabled={readOnly} value={form.modalidad} onChange={e => change('modalidad', e.target.value)}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="grabado">Grabado</option>
              </select>
            </div>
            <div className="field full">
              <label>Palabras clave</label>
              <input
                disabled={readOnly}
                value={form.palabras_clave}
                onChange={e => change('palabras_clave', e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Resumen</label>
              <textarea
                disabled={readOnly}
                value={form.resumen}
                onChange={e => change('resumen', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard/trabajos')}>
            Volver
          </button>
          {!readOnly && (
            <button className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
