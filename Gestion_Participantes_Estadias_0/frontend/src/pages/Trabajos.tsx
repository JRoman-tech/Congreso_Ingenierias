import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { participantesApi, trabajosApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { Documento, Pago, Trabajo } from '../types'

const REVIEW_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'validado', label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
] as const

export default function Trabajos({ participantId }: { participantId?: string }) {
  const { navigate } = useRouter()
  const { user } = useSession()
  const [rows, setRows] = useState<Trabajo[]>([])
  const [search, setSearch] = useState('')
  const [modalidad, setModalidad] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await trabajosApi.listar({
        page: 1,
        limit: 1000,
        search,
        modalidad,
        participante_id: participantId,
      })
      setRows(data.data)
      setError('')
    } catch {
      setRows([])
      setError('No se pudieron cargar los trabajos')
    }
  }, [search, modalidad, participantId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este trabajo?')) return
    try {
      await trabajosApi.eliminar(id)
      await load()
    } catch {
      setError('No se pudo eliminar el trabajo')
    }
  }

  async function changeSummaryStatus(row: Trabajo, status: Documento['estado']) {
    if (!row.resumen_documento_id) {
      setError('El participante todavía no ha subido el resumen del trabajo')
      return
    }
    try {
      await participantesApi.actualizarEstadoDocumento(
        row.participante_id, 'resumen_trabajo', status, user?.id,
      )
      setRows(current => current.map(item =>
        item.participante_id === row.participante_id
          ? { ...item, estado_resumen: status }
          : item,
      ))
      setError('')
    } catch {
      setError('No se pudo actualizar el estado del resumen')
    }
  }

  async function changePaymentStatus(row: Trabajo, status: Pago['estado']) {
    if (!row.comprobante_pago_id) {
      setError('Este trabajo todavía no tiene un comprobante de pago')
      return
    }
    try {
      await participantesApi.actualizarEstadoPago(
        row.participante_id, row.comprobante_pago_id, status, user?.id,
      )
      setRows(current => current.map(item =>
        item.comprobante_pago_id === row.comprobante_pago_id
          ? { ...item, estado_pago: status }
          : item,
      ))
      setError('')
    } catch {
      setError('No se pudo actualizar el estado del pago')
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{participantId ? 'Mis trabajos' : 'Trabajos'}</h1>
          <p className="muted">
            {participantId
              ? 'Ponencias asociadas a tu participación'
              : 'Ponencias, resúmenes y pagos de cada participante'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard/trabajos/nuevo')}>
          <Plus size={17} /> Nuevo trabajo
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={17} style={{ position: 'absolute', left: 11, top: 11 }} />
          <input
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por folio, título o autor"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <select value={modalidad} onChange={event => setModalidad(event.target.value)}>
          <option value="">Todas las modalidades</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
          <option value="grabado">Grabado</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Eje temático</th>
              {participantId
                ? <><th>Modalidad</th><th>Estado</th></>
                : <><th>Resumen</th><th>Pago</th></>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="empty" colSpan={7}>No hay trabajos registrados</td></tr>
            ) : rows.map(row => (
              <tr key={row.id}>
                <td>{row.folio}</td>
                <td>{row.titulo}</td>
                <td>{row.autor_principal}</td>
                <td>{row.eje_tematico}</td>
                {participantId ? (
                  <>
                    <td><span className="badge">{row.modalidad}</span></td>
                    <td>
                      <span className={`status-badge status-${row.estado}`}>
                        {row.estado === 'en_revision' ? 'En revisión' : row.estado}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <select
                        className={`status-select status-${row.estado_resumen}`}
                        value={row.estado_resumen}
                        disabled={!row.resumen_documento_id}
                        title={row.resumen_documento_id ? 'Estado del resumen' : 'Resumen no cargado'}
                        onChange={event => void changeSummaryStatus(
                          row, event.target.value as Documento['estado'],
                        )}
                      >
                        {REVIEW_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`status-select status-${row.estado_pago}`}
                        value={row.estado_pago}
                        disabled={!row.comprobante_pago_id}
                        title={row.comprobante_pago_id ? 'Estado del pago' : 'Pago no cargado'}
                        onChange={event => void changePaymentStatus(
                          row, event.target.value as Pago['estado'],
                        )}
                      >
                        {REVIEW_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                  </>
                )}
                <td>
                  <div className="actions">
                    <button className="icon-button" title="Ver" onClick={() => navigate(`/dashboard/trabajos/${row.id}?mode=view`)}>
                      <Eye size={15} />
                    </button>
                    <button className="icon-button" title="Editar" onClick={() => navigate(`/dashboard/trabajos/${row.id}`)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-button danger" title="Eliminar" onClick={() => remove(row.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
