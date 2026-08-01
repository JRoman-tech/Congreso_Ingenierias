import { ArrowRight, FileCheck2, FileUp, History, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { activityApi } from '../api'
import { useRouter } from '../router'
import type { ActivityItem } from '../types'

function ActivityIcon({ type }: { type: string }) {
  if (type.includes('documento')) return <FileUp size={20} />
  if (type.includes('trabajo')) return <FileCheck2 size={20} />
  return <UserCheck size={20} />
}

export default function Historial() {
  const { navigate } = useRouter()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await activityApi.historial(100)
      setItems(data)
      setError('')
    } catch {
      setError('No se pudo cargar el historial de actividad')
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const interval = window.setInterval(() => void load(), 10000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [load])

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Historial de actividad</h1>
          <p className="muted">Envíos y cambios que requieren seguimiento administrativo</p>
        </div>
        <button className="btn-secondary" onClick={() => void load()}>
          <History size={17} /> Actualizar
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="activity-list">
        {items.length === 0 ? (
          <div className="form-card empty-state">
            <History size={32} />
            <p>Aún no hay actividad registrada.</p>
          </div>
        ) : items.map(item => (
          <article className="activity-item" key={item.id}>
            <span className="activity-icon"><ActivityIcon type={item.tipo} /></span>
            <div className="activity-content">
              <div className="activity-title">
                <strong>{item.titulo}</strong>
                <time>{new Date(item.fecha).toLocaleString('es-MX')}</time>
              </div>
              <p>{item.descripcion}</p>
              <small>Realizado por <strong>{item.actor_nombre}</strong></small>
            </div>
            <button className="activity-open" onClick={() => navigate(item.ruta)}>
              Revisar <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
