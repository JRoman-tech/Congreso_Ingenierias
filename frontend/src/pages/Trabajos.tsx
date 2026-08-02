import { Download, Eye, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { API_BASE, trabajosApi } from '../api'
import { useRouter } from '../router'
import type { Trabajo } from '../types'
import { etiquetaEstadoTrabajo } from './trabajoHelpers'

const TEMPLATE_URL = '/plantillas/plantilla-trabajo-CIFIN.docx'

export default function Trabajos({ participantId }: { participantId?: string }) {
  const { navigate } = useRouter()
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
    if (!window.confirm('¿Eliminar este trabajo y su archivo PDF?')) return
    try {
      await trabajosApi.eliminar(id)
      await load()
    } catch {
      setError('No se pudo eliminar el trabajo')
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{participantId ? 'Mis trabajos' : 'Trabajos'}</h1>
          <p className="muted">
            {participantId
              ? 'Descarga la plantilla, prepara tu artículo y envíalo en PDF.'
              : 'Consulta las ponencias registradas; su dictamen se gestiona en Validación.'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard/trabajos/nuevo')}>
          <Plus size={17} /> Nuevo trabajo
        </button>
      </div>

      {participantId && (
        <article className="template-card">
          <span className="template-icon"><FileText size={24} /></span>
          <div>
            <strong>Plantilla oficial para el trabajo</strong>
            <p>Llénala respetando el formato y el límite de seis páginas. Después expórtala a PDF.</p>
          </div>
          <a className="btn-secondary" href={TEMPLATE_URL} download>
            <Download size={16} /> Descargar plantilla Word
          </a>
        </article>
      )}

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
              <th>Modalidad</th>
              <th>Estado</th>
              <th>PDF</th>
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
                <td><span className="badge">{row.modalidad}</span></td>
                <td>
                  <span className={`status-badge status-${row.estado}`}>
                    {etiquetaEstadoTrabajo(row.estado)}
                  </span>
                </td>
                <td>
                  {row.ruta_archivo ? (
                    <a className="file-link" href={`${API_BASE}${row.ruta_archivo}`}
                      target="_blank" rel="noreferrer">
                      <FileText size={15} /> Ver PDF
                    </a>
                  ) : <span className="muted">Sin archivo</span>}
                </td>
                <td>
                  <div className="actions">
                    <button className="icon-button" title="Ver"
                      onClick={() => navigate(`/dashboard/trabajos/${row.id}?mode=view`)}>
                      <Eye size={15} />
                    </button>
                    <button className="icon-button" title="Editar"
                      onClick={() => navigate(`/dashboard/trabajos/${row.id}`)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-button danger" title="Eliminar"
                      onClick={() => remove(row.id)}>
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
