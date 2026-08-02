import axios from 'axios'
import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { API_BASE, validacionesApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { EstadoValidacion, Validacion } from '../types'
import { estadoLabels, formatDate, ValidationStatus } from './validacionHelpers'

export default function ValidacionDetalle({ id }: { id: number }) {
  const { navigate } = useRouter()
  const { user } = useSession()
  const [data, setData] = useState<Validacion | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await validacionesApi.obtener(id)
      setData(response.data)
      setError('')
    } catch {
      setError('No se pudo cargar la validación')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function changeStatus(status: EstadoValidacion) {
    setSaving(true)
    setError('')
    try {
      const response = await validacionesApi.actualizarEstado(id, status, comment, user?.id)
      setData(response.data)
      setComment('')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error : undefined
      setError(message || 'No se pudo actualizar el estado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="muted">Cargando validación...</div>
  if (!data) return <div className="alert error">{error || 'Validación no encontrada'}</div>

  const academicPhase = ['pendiente_academico', 'rechazado_academico', 'en_correccion_academico']
    .includes(data.estado)
  const paymentPhase = ['aprobado_academico', 'pendiente_pago', 'pago_no_recibido']
    .includes(data.estado)

  return (
    <section>
      <button className="back-link" onClick={() => navigate('/dashboard/validacion')}>
        <ArrowLeft size={16} /> Volver a validaciones
      </button>

      <div className="page-header validation-detail-header">
        <div>
          <h1>Revisar participante</h1>
          <p className="muted">{data.nombre} · {data.correo}</p>
        </div>
        <ValidationStatus estado={data.estado} />
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="validation-columns">
        <article className="form-card validation-phase">
          <div className="phase-heading">
            <div><span className="step-label">Fase 1</span><h2>Información académica</h2></div>
            {!academicPhase && <span className="phase-complete"><CheckCircle2 size={15} /> Completada</span>}
          </div>

          {data.academica ? (
            <div className="validation-data">
              <div><span>Título</span><strong>{data.academica.titulo}</strong></div>
              <div><span>Resumen</span><p>{data.academica.resumen}</p></div>
              <div><span>Palabras clave</span><div className="keyword-list">
                {(data.academica.palabras_clave || '').split(',').filter(Boolean)
                  .map(word => <span className="badge" key={word}>{word.trim()}</span>)}
              </div></div>
            </div>
          ) : <p className="muted empty-phase">El participante aún no ha enviado esta información.</p>}

          {academicPhase && data.academica && (
            <div className="review-actions">
              <textarea
                placeholder="Observaciones para el participante"
                value={comment}
                onChange={event => setComment(event.target.value)}
              />
              <div className="actions">
                <button className="btn-primary" disabled={saving}
                  onClick={() => void changeStatus('aprobado_academico')}>
                  <CheckCircle2 size={16} /> Aprobar información
                </button>
                <button className="btn-danger" disabled={saving}
                  onClick={() => void changeStatus('rechazado_academico')}>
                  <XCircle size={16} /> Solicitar corrección
                </button>
              </div>
            </div>
          )}
        </article>

        <article className="form-card validation-phase">
          <div className="phase-heading">
            <div><span className="step-label">Fase 2</span><h2>Comprobante de pago</h2></div>
            {data.estado === 'validado_completo'
              && <span className="phase-complete"><CheckCircle2 size={15} /> Completada</span>}
          </div>

          {data.pago ? (
            <div className="payment-review">
              <div><span>Archivo</span><strong>{data.pago.nombre_archivo}</strong></div>
              <div><span>Fecha de carga</span><strong>{formatDate(data.pago.fecha_carga)}</strong></div>
              <a className="btn-secondary" href={`${API_BASE}/api/validaciones/comprobantes/${data.pago.ruta_archivo}`}
                target="_blank" rel="noreferrer">
                <ExternalLink size={15} /> Ver comprobante
              </a>
            </div>
          ) : <p className="muted empty-phase">El participante aún no ha subido su comprobante.</p>}

          {paymentPhase && data.pago && (
            <div className="actions review-actions-inline">
              <button className="btn-primary" disabled={saving}
                onClick={() => void changeStatus('validado_completo')}>
                <CheckCircle2 size={16} /> Confirmar pago
              </button>
              <button className="btn-danger" disabled={saving}
                onClick={() => void changeStatus('pago_no_recibido')}>
                <XCircle size={16} /> Rechazar pago
              </button>
            </div>
          )}
        </article>
      </div>

      <article className="form-card">
        <h2>Historial de cambios</h2>
        {!data.historial?.length ? <p className="muted">Aún no hay cambios registrados.</p> : (
          <div className="validation-timeline">
            {data.historial.map(item => (
              <div key={item.id}>
                <span className="timeline-dot" />
                <div>
                  <strong>{estadoLabels[item.estado_nuevo]}</strong>
                  {item.comentario && <p>{item.comentario}</p>}
                  <small>{item.realizado_por} · {formatDate(item.fecha)}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
