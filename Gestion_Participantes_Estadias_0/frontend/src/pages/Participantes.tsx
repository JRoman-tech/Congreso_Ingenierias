import {
  FileUp,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { participantesApi } from '../api'
import { useRouter } from '../router'
import type { Participante } from '../types'

export default function Participantes() {
  const { navigate } = useRouter()
  const [rows, setRows] = useState<Participante[]>([])
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await participantesApi.listar({
        page: 1,
        limit: 1000,
        search,
        categoria,
      })
      setRows(data.data)
      setError('')
    } catch {
      setRows([])
      setError('No se pudieron cargar los participantes')
    }
  }, [search, categoria])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este participante?')) return
    try {
      await participantesApi.eliminar(id)
      await load()
    } catch {
      setError('No se puede eliminar un participante que tiene trabajos registrados')
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Participantes</h1>
          <p className="muted">Registro y consulta de asistentes y autores</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard/participantes/nuevo')}>
          <Plus size={17} /> Nuevo participante
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={17} style={{ position: 'absolute', left: 11, top: 11 }} />
          <input
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por nombre o correo"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <select value={categoria} onChange={event => setCategoria(event.target.value)}>
          <option value="">Todas las categorías</option>
          <option>Estudiante</option>
          <option>Docente</option>
          <option>Investigador</option>
          <option>Profesional</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Institución</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="empty" colSpan={5}>No hay participantes registrados</td></tr>
            ) : rows.map(row => (
              <tr key={row.id}>
                <td>{row.nombre} {row.apellido_paterno} {row.apellido_materno}</td>
                <td>{row.correo}</td>
                <td>{row.institucion || '—'}</td>
                <td><span className="badge">{row.categoria}</span></td>
                <td>
                  <div className="actions">
                    <button
                      className="icon-button"
                      title="Editar"
                      onClick={() => navigate(`/dashboard/participantes/${row.id}/editar`)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title="Información académica"
                      onClick={() => navigate(`/dashboard/academica/${row.id}`)}
                    >
                      <GraduationCap size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title="Documentos"
                      onClick={() => navigate(`/dashboard/documentos/${row.id}`)}
                    >
                      <FileUp size={15} />
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
