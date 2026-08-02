import { FileCheck2, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { trabajosApi } from '../api'
import { useRouter } from '../router'
import type { Trabajo } from '../types'
import { ESTADOS_TRABAJO, etiquetaEstadoTrabajo } from './trabajoHelpers'

export default function Validaciones() {
  const { navigate } = useRouter()
  const [rows, setRows] = useState<Trabajo[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await trabajosApi.listar({ page: 1, limit: 1000 })
        setRows(data.data)
      } catch {
        setError('No se pudieron cargar los trabajos por validar')
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term
      || row.titulo.toLowerCase().includes(term)
      || row.folio.toLowerCase().includes(term)
      || row.autor_principal.toLowerCase().includes(term)
    return matchesSearch && (!status || row.estado === status)
  }), [rows, search, status])

  const stats = [
    { label: 'Por revisar', value: rows.filter(row => row.estado === 'pendiente').length },
    { label: 'En revisión', value: rows.filter(row => row.estado === 'en_revision').length },
    { label: 'Aceptados', value: rows.filter(row => row.estado === 'aceptado').length },
    { label: 'Rechazados', value: rows.filter(row => row.estado === 'rechazado').length },
  ]

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Validación de trabajos</h1>
          <p className="muted">Revisa cada PDF y asigna un único estado al trabajo.</p>
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
          <input placeholder="Buscar por folio, título o autor" value={search}
            onChange={event => setSearch(event.target.value)} />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS_TRABAJO.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Trabajo</th>
              <th>Autor</th>
              <th>Eje temático</th>
              <th>Estado</th>
              <th>Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="empty" colSpan={6}>Cargando trabajos...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="empty" colSpan={6}>No se encontraron trabajos</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id}>
                <td><strong>{row.folio} · {row.titulo}</strong></td>
                <td>{row.autor_principal}</td>
                <td>{row.eje_tematico}</td>
                <td><span className={`status-badge status-${row.estado}`}>
                  {etiquetaEstadoTrabajo(row.estado)}
                </span></td>
                <td>{row.ruta_archivo
                  ? <span className="file-available"><FileCheck2 size={15} /> PDF disponible</span>
                  : <span className="muted">Sin PDF</span>}
                </td>
                <td>
                  <button className="btn-primary"
                    onClick={() => navigate(`/dashboard/validacion/${row.id}`)}>
                    Revisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">Mostrando {filtered.length} de {rows.length} trabajos</div>
      </div>
    </section>
  )
}
