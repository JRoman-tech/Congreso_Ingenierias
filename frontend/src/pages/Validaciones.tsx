import { Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { validacionesApi } from '../api'
import { useRouter } from '../router'
import type { EstadoValidacion, Validacion } from '../types'
import { estadoLabels, formatDate, ValidationStatus } from './validacionHelpers'

export default function Validaciones() {
  const { navigate } = useRouter()
  const [rows, setRows] = useState<Validacion[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await validacionesApi.listar()
        setRows(data)
      } catch {
        setError('No se pudieron cargar las validaciones')
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term
      || row.nombre.toLowerCase().includes(term)
      || row.correo.toLowerCase().includes(term)
    return matchesSearch && (!status || row.estado === status)
  }), [rows, search, status])

  const stats = [
    { label: 'Total', value: rows.length },
    { label: 'Pendientes', value: rows.filter(row => row.estado.startsWith('pendiente')).length },
    { label: 'Validados', value: rows.filter(row => row.estado === 'validado_completo').length },
    { label: 'Con observaciones', value: rows.filter(row => row.estado.includes('rechazado') || row.estado === 'pago_no_recibido').length },
  ]

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Validación</h1>
          <p className="muted">Revisión académica y comprobantes de pago</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="validation-stats">
        {stats.map(item => (
          <article className="card" key={item.label}>
            <ShieldCheck color="#c89b3c" size={21} />
            <span className="card-label">{item.label}</span>
            <strong className="card-value">{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="toolbar validation-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="Buscar por nombre o correo"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(estadoLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Institución</th>
              <th>Estado</th>
              <th>Actualizado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="empty" colSpan={5}>Cargando validaciones...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="empty" colSpan={5}>No se encontraron validaciones</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id}>
                <td><strong>{row.nombre}</strong><small className="table-secondary">{row.correo}</small></td>
                <td>{row.institucion || '—'}</td>
                <td><ValidationStatus estado={row.estado as EstadoValidacion} /></td>
                <td>{formatDate(row.actualizado_en)}</td>
                <td>
                  <button className="btn-primary" onClick={() => navigate(`/dashboard/validacion/${row.id}`)}>
                    Revisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">Mostrando {filtered.length} de {rows.length} participantes</div>
      </div>
    </section>
  )
}
