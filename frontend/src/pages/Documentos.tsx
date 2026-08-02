import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LockKeyhole,
  SearchCheck,
  Receipt,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { API_BASE, participantesApi, paymentConfigApi, trabajosApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { Documento, ModalidadPago, Pago, Participante, Trabajo } from '../types'

type OptionalDocument = 'carta_autorizacion'

interface DocumentConfiguration {
  carta_autorizacion: boolean
}

const EMPTY_CONFIGURATION: DocumentConfiguration = {
  carta_autorizacion: false,
}

const DOCUMENT_TYPES: Array<{
  value: string
  label: string
  icon: typeof FileText
  optionalKey?: OptionalDocument
}> = [
  {
    value: 'carta_autorizacion',
    label: 'Carta de autorización',
    icon: ShieldCheck,
    optionalKey: 'carta_autorizacion',
  },
]

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  validado: 'Aceptado',
  rechazado: 'Rechazado',
}

export default function Documentos({
  id,
  participantLocked = false,
}: {
  id?: string
  participantLocked?: boolean
}) {
  const { navigate } = useRouter()
  const { user } = useSession()
  const [participants, setParticipants] = useState<Participante[]>([])
  const [documents, setDocuments] = useState<Documento[]>([])
  const [payments, setPayments] = useState<Pago[]>([])
  const [works, setWorks] = useState<Trabajo[]>([])
  const [paymentMode, setPaymentMode] = useState<ModalidadPago>('individual')
  const [savingPaymentMode, setSavingPaymentMode] = useState(false)
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const [configuration, setConfiguration] =
    useState<DocumentConfiguration>(EMPTY_CONFIGURATION)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await paymentConfigApi.obtener()
        setPaymentMode(data.modalidad)
      } catch {
        setError('No se pudo cargar la modalidad global de pagos')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (participantLocked) return
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await participantesApi.listar({ page: 1, limit: 1000 })
        setParticipants(data.data)
      } catch {
        setError('No se pudo cargar la lista de participantes')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [participantLocked])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!id) {
        setDocuments([])
        setPayments([])
        setWorks([])
        setSelectedWorkIds([])
        setConfiguration(EMPTY_CONFIGURATION)
        return
      }
      try {
        const [documentsResponse, configurationResponse, paymentsResponse, worksResponse] = await Promise.all([
          participantesApi.documentos(id),
          participantesApi.configuracionDocumentos(id),
          participantesApi.pagos(id),
          trabajosApi.listar({ page: 1, limit: 1000, participante_id: id }),
        ])
        setDocuments(documentsResponse.data)
        setPayments(paymentsResponse.data)
        setWorks(worksResponse.data.data)
        setConfiguration({
          carta_autorizacion: Boolean(configurationResponse.data.carta_autorizacion),
        })
        setError('')
      } catch {
        setError('No se pudieron cargar los documentos')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id])

  async function upload(type: string, file?: File) {
    if (!id || !file) return
    const body = new FormData()
    body.append('archivo', file)
    body.append('tipo_documento', type)
    if (user) body.append('usuario_id', user.id)
    setUploading(type)
    try {
      await participantesApi.subirDocumento(id, body)
      const { data } = await participantesApi.documentos(id)
      setDocuments(data)
      setError('')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo subir el documento. Usa PDF, JPG o PNG de máximo 10 MB.')
    } finally {
      setUploading('')
    }
  }

  async function remove(type: string) {
    if (!id || !window.confirm('¿Eliminar este documento?')) return
    try {
      await participantesApi.eliminarDocumento(id, type)
      setDocuments(current => current.filter(document => document.tipo_documento !== type))
    } catch {
      setError('No se pudo eliminar el documento')
    }
  }

  async function changeStatus(type: string, status: Documento['estado']) {
    if (!id) return
    try {
      await participantesApi.actualizarEstadoDocumento(id, type, status, user?.id)
      setDocuments(current => current.map(document =>
        document.tipo_documento === type ? { ...document, estado: status } : document,
      ))
      setError('')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo actualizar el estado del documento')
    }
  }

  async function toggleOptional(key: OptionalDocument) {
    if (!id) return
    const next = { ...configuration, [key]: !configuration[key] }
    try {
      await participantesApi.guardarConfiguracionDocumentos(id, {
        ...next,
        trabajo_completo: false,
        usuario_id: user?.id,
      })
      setConfiguration(next)
      setError('')
    } catch {
      setError('No se pudo actualizar la configuración de documentos')
    }
  }

  function toggleWork(workId: string) {
    setSelectedWorkIds(current => {
      if (paymentMode === 'individual') return current.includes(workId) ? [] : [workId]
      return current.includes(workId)
        ? current.filter(currentId => currentId !== workId)
        : [...current, workId]
    })
  }

  async function changePaymentMode(mode: ModalidadPago) {
    if (participantLocked || !user || mode === paymentMode) return
    setSavingPaymentMode(true)
    try {
      await paymentConfigApi.actualizar(mode, user.id)
      setPaymentMode(mode)
      setSelectedWorkIds([])
      setError('')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo cambiar la modalidad global de pagos')
    } finally {
      setSavingPaymentMode(false)
    }
  }

  async function uploadPayment(file?: File) {
    if (!id || !file || (paymentMode === 'individual' && selectedWorkIds.length === 0)) return
    const body = new FormData()
    body.append('archivo', file)
    selectedWorkIds.forEach(workId => body.append('trabajo_ids', workId))
    if (user) body.append('usuario_id', user.id)
    setUploading('pago')
    try {
      await participantesApi.subirPago(id, body)
      const { data } = await participantesApi.pagos(id)
      setPayments(data)
      setSelectedWorkIds([])
      setError('')
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo subir el comprobante de pago')
    } finally {
      setUploading('')
    }
  }

  async function removePayment(paymentId: string) {
    if (!id || !window.confirm('¿Eliminar este comprobante de pago?')) return
    try {
      await participantesApi.eliminarPago(id, paymentId)
      setPayments(current => current.filter(payment => payment.id !== paymentId))
      setError('')
    } catch {
      setError('No se pudo eliminar el comprobante de pago')
    }
  }

  async function changePaymentStatus(paymentId: string, status: Pago['estado']) {
    if (!id) return
    try {
      await participantesApi.actualizarEstadoPago(id, paymentId, status, user?.id)
      setPayments(current => current.map(payment =>
        payment.id === paymentId ? { ...payment, estado: status } : payment,
      ))
      setError('')
    } catch {
      setError('No se pudo actualizar el estado del comprobante')
    }
  }

  const visibleTypes = DOCUMENT_TYPES.filter(type =>
    !participantLocked || !type.optionalKey || configuration[type.optionalKey],
  )
  const requiredTypes = DOCUMENT_TYPES.filter(type =>
    !type.optionalKey || configuration[type.optionalKey],
  )
  const coveredWorkIds = new Set(payments.flatMap(payment =>
    payment.trabajos.map(work => work.id),
  ))
  const availableWorks = works.filter(work => !coveredWorkIds.has(work.id))
  const documentsApproved = requiredTypes.every(type => documents.some(document =>
    document.tipo_documento === type.value && document.estado === 'validado',
  ))
  const canUploadPayment = paymentMode === 'agrupado'
    ? availableWorks.length > 0
    : selectedWorkIds.length === 1

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{participantLocked ? 'Mis documentos' : 'Documentos'}</h1>
          <p className="muted">
            {participantLocked
              ? 'Archivos solicitados para tu participación'
              : 'Configura y revisa los archivos de cada participante'}
          </p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {!participantLocked && (
        <div className="form-card payment-global-config">
          <div>
            <span className="eyebrow">Configuración general</span>
            <h2>Modalidad de comprobantes de pago</h2>
            <p className="muted">
              Esta elección se aplica a todos los participantes y no puede cambiarla el participante.
            </p>
          </div>
          <div className="payment-mode" role="radiogroup" aria-label="Modalidad global de pago">
            <label className={paymentMode === 'individual' ? 'active' : ''}>
              <input
                type="radio"
                name="global-payment-mode"
                checked={paymentMode === 'individual'}
                disabled={savingPaymentMode}
                onChange={() => void changePaymentMode('individual')}
              />
              <span>
                <strong>Un pago por cada trabajo</strong>
                <small>Cada comprobante se relaciona con un solo trabajo.</small>
              </span>
            </label>
            <label className={paymentMode === 'agrupado' ? 'active' : ''}>
              <input
                type="radio"
                name="global-payment-mode"
                checked={paymentMode === 'agrupado'}
                disabled={savingPaymentMode}
                onChange={() => void changePaymentMode('agrupado')}
              />
              <span>
                <strong>Un solo pago para todos</strong>
                <small>El comprobante cubre automáticamente todos los trabajos del participante.</small>
              </span>
            </label>
          </div>
          {savingPaymentMode && <small className="muted">Guardando configuración...</small>}
        </div>
      )}

      {!participantLocked && (
        <div className="form-card">
          <div className="field">
            <label>Participante</label>
            <select
              value={id || ''}
              onChange={event => navigate(
                event.target.value
                  ? `/dashboard/documentos/${event.target.value}`
                  : '/dashboard/documentos',
              )}
            >
              <option value="">Selecciona un participante</option>
              {participants.map(participant => (
                <option key={participant.id} value={participant.id}>
                  {participant.nombre} {participant.apellido_paterno} · {participant.correo}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-card">
        {!id && !participantLocked ? (
          <p className="muted empty">Selecciona un participante para configurar sus documentos.</p>
        ) : (
          <>
            <div className="hierarchy-notice">
              <LockKeyhole size={18} />
              <span>
                Sube los documentos en orden. Cada paso se habilita cuando el anterior sea aprobado.
              </span>
            </div>
            <div className="document-list">
            {visibleTypes.map(type => {
              const document = documents.find(item => item.tipo_documento === type.value)
              const Icon = type.icon
              const approvedAndLocked = participantLocked && document?.estado === 'validado'
              const enabled = !type.optionalKey || configuration[type.optionalKey]
              const enabledSequence = DOCUMENT_TYPES.filter(item =>
                !item.optionalKey || configuration[item.optionalKey],
              )
              const stepIndex = enabledSequence.findIndex(item => item.value === type.value)
              const previousType = stepIndex > 0 ? enabledSequence[stepIndex - 1] : undefined
              const prerequisiteMet = !previousType || documents.some(
                item => item.tipo_documento === previousType.value && item.estado === 'validado',
              )
              const hasLaterDocument = (stepIndex >= 0 && enabledSequence
                .slice(stepIndex + 1)
                .some(item => documents.some(
                  documentItem => documentItem.tipo_documento === item.value,
                ))) || payments.length > 0
              const canUpload = enabled && prerequisiteMet && !approvedAndLocked

              return (
                <div
                  className={`document-row ${enabled ? '' : 'optional-disabled'}`}
                  key={type.value}
                >
                  <div className="document-info">
                    <span className="document-icon"><Icon size={22} /></span>
                    <div>
                      <div className="document-title-line">
                        <strong>{type.label}</strong>
                        {enabled && stepIndex >= 0 && (
                          <span className="step-label">Paso {stepIndex + 1}</span>
                        )}
                      </div>
                      {type.optionalKey && (
                        <span className="optional-label">
                          Opcional · {enabled ? 'Solicitado' : 'No solicitado'}
                        </span>
                      )}
                      <small>
                        {document
                          ? document.nombre_archivo
                          : 'PDF, JPG o PNG · máximo 10 MB'}
                      </small>
                      {enabled && !prerequisiteMet && previousType && (
                        <span className="hierarchy-message">
                          <LockKeyhole size={12} />
                          Esperando aprobación de: {previousType.label}
                        </span>
                      )}
                      {document && (
                        <span className={`status-badge status-${document.estado}`}>
                          {STATUS_LABELS[document.estado]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="document-actions">
                    {type.optionalKey && !participantLocked && (
                      <button
                        className={enabled ? 'optional-toggle active' : 'optional-toggle'}
                        onClick={() => void toggleOptional(type.optionalKey as OptionalDocument)}
                      >
                        <Settings2 size={15} />
                        {enabled ? 'Quitar solicitud' : 'Solicitar'}
                      </button>
                    )}

                    {document && (
                      <>
                        <a
                          className="icon-button"
                          href={`${API_BASE}${document.ruta_archivo}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver documento"
                        >
                          <Eye size={15} />
                        </a>
                        {!approvedAndLocked && (
                          <button
                            className={`icon-button danger ${hasLaterDocument ? 'disabled' : ''}`}
                            title={hasLaterDocument
                              ? 'Primero elimina los documentos posteriores'
                              : 'Eliminar'}
                            disabled={hasLaterDocument}
                            onClick={() => remove(type.value)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}

                    {document && !participantLocked && (
                      <div className="status-actions" aria-label={`Estado de ${type.label}`}>
                        <button
                          className={document.estado === 'pendiente'
                            ? 'status-button pending active'
                            : 'status-button pending'}
                          title="Marcar pendiente"
                          onClick={() => changeStatus(type.value, 'pendiente')}
                        >
                          <Clock3 size={16} />
                        </button>
                        <button
                          className={document.estado === 'en_revision'
                            ? 'status-button review active'
                            : 'status-button review'}
                          title="Marcar en revisión"
                          onClick={() => changeStatus(type.value, 'en_revision')}
                        >
                          <SearchCheck size={16} />
                        </button>
                        <button
                          className={document.estado === 'validado'
                            ? 'status-button approved active'
                            : 'status-button approved'}
                          title="Aceptar documento"
                          onClick={() => changeStatus(type.value, 'validado')}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          className={document.estado === 'rechazado'
                            ? 'status-button rejected active'
                            : 'status-button rejected'}
                          title="Rechazar documento"
                          onClick={() => changeStatus(type.value, 'rechazado')}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}

                    <label
                      className={`btn-primary ${canUpload ? '' : 'disabled'}`}
                      style={{
                        cursor: id && canUpload
                          ? 'pointer'
                          : 'not-allowed',
                      }}
                    >
                      <Upload size={15} />
                      {!prerequisiteMet
                        ? 'Bloqueado'
                        : uploading === type.value
                        ? 'Subiendo...'
                        : document
                          ? 'Reemplazar'
                          : 'Subir'}
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!id || Boolean(uploading) || !canUpload}
                        onChange={event => void upload(type.value, event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              )
            })}

              <div className="payment-section">
                <div className="document-info payment-heading">
                  <span className="document-icon"><Receipt size={22} /></span>
                  <div>
                    <div className="document-title-line">
                      <strong>Comprobante de pago</strong>
                      <span className="step-label">Paso {requiredTypes.length + 1}</span>
                    </div>
                    <small>
                      {paymentMode === 'agrupado'
                        ? 'La modalidad global aplica un solo comprobante a todos tus trabajos.'
                        : 'La modalidad global requiere un comprobante por cada trabajo.'}
                    </small>
                  </div>
                </div>

                {payments.length > 0 && (
                  <div className="payment-list">
                    {payments.map(payment => {
                      const approvedAndLocked = participantLocked && payment.estado === 'validado'
                      return (
                        <div className="payment-item" key={payment.id}>
                          <div className="payment-summary">
                            <strong>
                              {payment.modalidad === 'individual'
                                ? 'Pago individual'
                                : 'Pago único para todos'}
                            </strong>
                            <span className={`status-badge status-${payment.estado}`}>
                              {STATUS_LABELS[payment.estado]}
                            </span>
                            <small>{payment.nombre_archivo}</small>
                            <div className="payment-work-tags">
                              {payment.trabajos.map(work => (
                                <span className="badge" key={work.id}>
                                  {work.folio} · {work.titulo}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="document-actions">
                            <a
                              className="icon-button"
                              href={`${API_BASE}${payment.ruta_archivo}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver comprobante"
                            >
                              <Eye size={15} />
                            </a>
                            {!approvedAndLocked && (
                              <button
                                className="icon-button danger"
                                title="Eliminar comprobante"
                                onClick={() => void removePayment(payment.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                            {!participantLocked && (
                              <div className="status-actions" aria-label="Estado del pago">
                                <button
                                  className={`status-button pending ${payment.estado === 'pendiente' ? 'active' : ''}`}
                                  title="Marcar pendiente"
                                  onClick={() => void changePaymentStatus(payment.id, 'pendiente')}
                                ><Clock3 size={16} /></button>
                                <button
                                  className={`status-button review ${payment.estado === 'en_revision' ? 'active' : ''}`}
                                  title="Marcar en revisión"
                                  onClick={() => void changePaymentStatus(payment.id, 'en_revision')}
                                ><SearchCheck size={16} /></button>
                                <button
                                  className={`status-button approved ${payment.estado === 'validado' ? 'active' : ''}`}
                                  title="Aceptar pago"
                                  onClick={() => void changePaymentStatus(payment.id, 'validado')}
                                ><CheckCircle2 size={16} /></button>
                                <button
                                  className={`status-button rejected ${payment.estado === 'rechazado' ? 'active' : ''}`}
                                  title="Rechazar pago"
                                  onClick={() => void changePaymentStatus(payment.id, 'rechazado')}
                                ><XCircle size={16} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!documentsApproved ? (
                  <span className="hierarchy-message">
                    <LockKeyhole size={12} />
                    Todos los documentos anteriores deben estar aprobados.
                  </span>
                ) : availableWorks.length === 0 ? (
                  <p className="muted payment-empty">
                    {works.length === 0
                      ? 'Registra al menos un trabajo antes de subir un pago.'
                      : 'Todos los trabajos ya tienen un comprobante asociado.'}
                  </p>
                ) : (
                  <div className="payment-form">
                    {paymentMode === 'individual' ? (
                      <div className="payment-work-picker">
                        {availableWorks.map(work => (
                          <label
                            key={work.id}
                            className={selectedWorkIds.includes(work.id) ? 'selected' : ''}
                          >
                            <input
                              type="radio"
                              name="paid-work"
                              checked={selectedWorkIds.includes(work.id)}
                              onChange={() => toggleWork(work.id)}
                            />
                            <span><strong>{work.folio}</strong>{work.titulo}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="hierarchy-notice">
                        <Receipt size={18} />
                        <span>
                          El comprobante se asociará automáticamente con los {availableWorks.length}
                          {availableWorks.length === 1 ? ' trabajo disponible.' : ' trabajos disponibles.'}
                        </span>
                      </div>
                    )}
                    <label
                      className={`btn-primary payment-upload ${canUploadPayment ? '' : 'disabled'}`}
                      style={{ cursor: canUploadPayment && !uploading ? 'pointer' : 'not-allowed' }}
                    >
                      <Upload size={15} />
                      {uploading === 'pago' ? 'Subiendo...' : 'Elegir comprobante y subir'}
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canUploadPayment || Boolean(uploading)}
                        onChange={event => void uploadPayment(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
