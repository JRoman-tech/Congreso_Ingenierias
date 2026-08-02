import axios from 'axios'
import { Download, ExternalLink, FileText, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_BASE, participantesApi, trabajosApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { Participante, Trabajo } from '../types'
import { ESTADOS_TRABAJO, etiquetaEstadoTrabajo } from './trabajoHelpers'

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
  reviewMode = false,
  fixedParticipantId,
}: {
  id?: string
  readOnly?: boolean
  reviewMode?: boolean
  fixedParticipantId?: string
}) {
  const { navigate } = useRouter()
  const { user } = useSession()
  const [participants, setParticipants] = useState<Participante[]>([])
  const [form, setForm] = useState(initial)
  const [file, setFile] = useState<File | null>(null)
  const [storedFile, setStoredFile] = useState<Pick<Trabajo, 'nombre_archivo' | 'ruta_archivo'>>({})
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
          const work = workResponse.data as Trabajo
          setWorkStatus(work.estado || 'pendiente')
          setStoredFile({ nombre_archivo: work.nombre_archivo, ruta_archivo: work.ruta_archivo })
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

  function selectFile(selected?: File) {
    if (!selected) {
      setFile(null)
      return
    }
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(null)
      setError('El trabajo solo puede subirse en formato PDF')
      return
    }
    setFile(selected)
    setError('')
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
    if (readOnly || reviewMode) return
    if (!id && !file) {
      setError('Selecciona el trabajo en formato PDF')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (id) {
        await trabajosApi.actualizar(id, { ...form, usuario_id: user?.id })
        if (file) {
          const fileBody = new FormData()
          fileBody.append('archivo', file)
          await trabajosApi.reemplazarArchivo(id, fileBody)
        }
      } else {
        const body = new FormData()
        Object.entries(form).forEach(([key, value]) => body.append(key, value))
        if (user) body.append('usuario_id', user.id)
        body.append('archivo', file as File)
        await trabajosApi.crear(body)
      }
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
          <h1>{reviewMode ? 'Validar trabajo' : readOnly ? 'Detalle del trabajo' : id ? 'Editar trabajo' : 'Nuevo trabajo'}</h1>
          <p className="muted">
            {reviewMode ? 'Revisa el PDF y asigna un dictamen.' : 'Información académica de la ponencia y archivo final.'}
          </p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {id && (readOnly || reviewMode) && (
        <div className="form-card review-bar">
          <div>
            <span className="muted">Estado del trabajo</span>
            <strong className={`status-badge status-${workStatus}`}>
              {etiquetaEstadoTrabajo(workStatus)}
            </strong>
          </div>
          {reviewMode && user?.rol === 'administrador' && (
            <select className={`status-select status-${workStatus}`} value={workStatus}
              onChange={event => void changeStatus(event.target.value as Trabajo['estado'])}>
              {ESTADOS_TRABAJO.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-card">
          <div className="form-grid">
            <div className="field full">
              <label>Autor principal *</label>
              <select required disabled={readOnly || reviewMode || Boolean(fixedParticipantId)}
                value={form.participante_id} onChange={e => change('participante_id', e.target.value)}>
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
              <input required disabled={readOnly || reviewMode} value={form.titulo}
                onChange={e => change('titulo', e.target.value)} />
            </div>
            <div className="field">
              <label>Eje temático *</label>
              <select required disabled={readOnly || reviewMode} value={form.eje_tematico}
                onChange={e => change('eje_tematico', e.target.value)}>
                <option value="">Selecciona un eje</option>
                {TOPICS.map(topic => <option key={topic}>{topic}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Modalidad *</label>
              <select disabled={readOnly || reviewMode} value={form.modalidad}
                onChange={e => change('modalidad', e.target.value)}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="grabado">Grabado</option>
              </select>
            </div>
            <div className="field full">
              <label>Palabras clave</label>
              <input disabled={readOnly || reviewMode} value={form.palabras_clave}
                onChange={e => change('palabras_clave', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card work-file-card">
          <div>
            <h2>Archivo del trabajo</h2>
            <p className="muted">Usa la plantilla oficial, expórtala y carga únicamente el PDF (máximo 10 MB).</p>
          </div>
          <div className="work-file-actions">
            <a className="btn-secondary" href="/plantillas/plantilla-trabajo-CIFIN.docx" download>
              <Download size={16} /> Descargar plantilla
            </a>
            {storedFile.ruta_archivo && (
              <a className="btn-secondary" href={`${API_BASE}${storedFile.ruta_archivo}`}
                target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Ver PDF enviado
              </a>
            )}
            {!readOnly && !reviewMode && (
              <label className="btn-primary file-picker">
                <Upload size={16} /> {file ? file.name : id ? 'Reemplazar PDF' : 'Seleccionar PDF'}
                <input hidden required={!id} type="file" accept="application/pdf,.pdf"
                  onChange={event => selectFile(event.target.files?.[0])} />
              </label>
            )}
          </div>
          {!storedFile.ruta_archivo && (readOnly || reviewMode) && (
            <div className="alert error"><FileText size={16} /> Este registro anterior no tiene un PDF asociado.</div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary"
            onClick={() => navigate(reviewMode ? '/dashboard/validacion' : '/dashboard/trabajos')}>
            Volver
          </button>
          {!readOnly && !reviewMode && (
            <button className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : id ? 'Guardar cambios' : 'Enviar trabajo'}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
