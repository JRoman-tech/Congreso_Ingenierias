import { FileText, FolderOpen, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import type { DashboardStats } from '../types'

const initial: DashboardStats = {
  participantes: 0,
  trabajos: 0,
  documentos: 0,
  por_categoria: [],
}

export default function Dashboard() {
  const [stats, setStats] = useState(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await dashboardApi.stats()
        setStats(data)
      } catch {
        setError('No hay conexión con Spring Boot. Inicia el backend en el puerto 3001.')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const cards = [
    { label: 'Participantes', value: stats.participantes, icon: Users },
    { label: 'Trabajos', value: stats.trabajos, icon: FileText },
    { label: 'Documentos', value: stats.documentos, icon: FolderOpen },
  ]

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Resumen del módulo de gestión de participantes</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="cards">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="card" key={label}>
            <Icon color="#c89b3c" />
            <span className="card-label">{label}</span>
            <strong className="card-value">{value}</strong>
          </article>
        ))}
      </div>

      <div className="form-card" style={{ marginTop: 18 }}>
        <h2>Participantes por categoría</h2>
        {stats.por_categoria.length === 0 ? (
          <p className="muted">Aún no hay participantes registrados.</p>
        ) : (
          <div className="document-list">
            {stats.por_categoria.map(item => (
              <div className="document-row" key={item.categoria}>
                <span>{item.categoria}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

