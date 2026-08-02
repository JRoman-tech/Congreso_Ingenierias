import axios from 'axios'
import { CheckCircle2, FileUp, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { validacionesApi } from '../api'
import type { Validacion } from '../types'
import { formatDate, ValidationStatus } from './validacionHelpers'

export default function MiValidacion({ participantId }: { participantId: string }) {
  const [data, setData] = useState<Validacion | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [keywords, setKeywords] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await validacionesApi.obtenerParticipante(participantId)
      const validation = response.data as Validacion
      setData(validation)
      setTitle(validation.academica?.titulo || '')
      setSummary(validation.academica?.resumen || '')
      setKeywords(validation.academica?.palabras_clave || '')
    } catch {
      setError('No se pudo cargar tu validación')
    } finally {
      setLoading(false)
    }
  }, [participantId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function saveAcademic(event: React.FormEvent) {
    event.preventDefault()
    const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0
    if (wordCount > 250) {
      setError('El resumen no puede superar 250 palabras')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await validacionesApi.guardarAcademica(participantId, {
        titulo: title,
        resumen: summary,
        palabras_clave: keywords,
      })
      setData(response.data)
      setSuccess('Información académica enviada para revisión')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error : undefined
      setError(message || 'No se pudo guardar la información')
    } finally {
      setSaving(false)
    }
  }

  async function uploadReceipt() {
    if (!file) {
      setError('Selecciona un comprobante PDF')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body = new FormData()
      body.append('archivo', file)
      const response = await validacionesApi.subirComprobante(participantId, body)
      setData(response.data)
      setFile(null)
      setSuccess('Comprobante enviado para revisión')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error : undefined
      setError(message || 'No se pudo subir el comprobante')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="muted">Cargando tu validación...</div>
  if (!data) return <div className="alert error">{error || 'Validación no encontrada'}</div>

  const editableAcademic = ['pendiente_academico', 'rechazado_academico', 'en_correccion_academico']
    .includes(data.estado)
  const canUploadPayment = ['aprobado_academico', 'pendiente_pago', 'pago_no_recibido']
    .includes(data.estado)
  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0

  return (
    <section className="participant-validation">
      <div className="participant-welcome validation-welcome">
        <div>
          <span className="eyebrow">Proceso de acreditación</span>
          <h1>Mi validación</h1>
          <p>Completa las dos fases para validar tu participación.</p>
        </div>
        <ValidationStatus estado={data.estado} />
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form className="form-card validation-phase" onSubmit={saveAcademic}>
        <div className="phase-heading">
          <div><span className="step-label">Fase 1</span><h2>Información académica</h2></div>
          {!editableAcademic && <span className="phase-complete"><CheckCircle2 size={15} /> Enviada</span>}
        </div>
        {data.estado === 'rechazado_academico' && (
          <div className="alert error">Revisa y corrige la información antes de volver a enviarla.</div>
        )}
        <div className="field">
          <label>Título de la ponencia *</label>
          <input required disabled={!editableAcademic} value={title}
            onChange={event => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label>Resumen * <span className="muted">(máximo 250 palabras)</span></label>
          <textarea required disabled={!editableAcademic} value={summary}
            onChange={event => setSummary(event.target.value)} />
          <small className={wordCount > 250 ? 'word-count exceeded' : 'word-count'}>
            {wordCount} / 250 palabras
          </small>
        </div>
        <div className="field">
          <label>Palabras clave</label>
          <input disabled={!editableAcademic} value={keywords}
            placeholder="Ingeniería, innovación, tecnología"
            onChange={event => setKeywords(event.target.value)} />
        </div>
        {editableAcademic && (
          <div className="form-actions">
            <button className="btn-primary" disabled={saving || wordCount > 250}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Enviar para revisión'}
            </button>
          </div>
        )}
      </form>

      <article className="form-card validation-phase">
        <div className="phase-heading">
          <div><span className="step-label">Fase 2</span><h2>Comprobante de pago</h2></div>
          {data.estado === 'validado_completo'
            && <span className="phase-complete"><CheckCircle2 size={15} /> Validado</span>}
        </div>
        {data.estado === 'validado_completo' ? (
          <div className="validation-complete"><CheckCircle2 /> Tu participación está completamente validada.</div>
        ) : canUploadPayment ? (
          <div className="payment-upload-form">
            {data.estado === 'pago_no_recibido'
              && <div className="alert error">El comprobante fue rechazado. Sube uno nuevo.</div>}
            {data.pago && <p className="muted">Archivo actual: {data.pago.nombre_archivo} · {formatDate(data.pago.fecha_carga)}</p>}
            <div className="field">
              <label>Comprobante PDF *</label>
              <input type="file" accept="application/pdf,.pdf"
                onChange={event => setFile(event.target.files?.[0] || null)} />
            </div>
            <button className="btn-primary" type="button" disabled={saving}
              onClick={() => void uploadReceipt()}>
              <FileUp size={16} /> {saving ? 'Subiendo...' : 'Subir comprobante'}
            </button>
          </div>
        ) : <p className="muted">Esta fase se habilitará cuando se apruebe la información académica.</p>}
      </article>
    </section>
  )
}
