import { Bell, CheckCheck, FileCheck2, FileUp, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { activityApi } from '../api'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'
import type { NotificationItem } from '../types'

function NotificationIcon({ type }: { type: string }) {
  if (type.includes('documento')) return <FileUp size={18} />
  if (type.includes('trabajo')) return <FileCheck2 size={18} />
  return <UserCheck size={18} />
}

export default function NotificationCenter() {
  const { user } = useSession()
  const { navigate } = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await activityApi.notificaciones(user.id)
      setItems(data)
    } catch {
      // La siguiente actualización automática volverá a intentarlo.
    }
  }, [user])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const interval = window.setInterval(() => void load(), 8000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [load])

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  async function openNotification(item: NotificationItem) {
    if (!user) return
    if (!item.leida) {
      await activityApi.marcarLeida(item.id, user.id)
      setItems(current => current.map(value =>
        value.id === item.id ? { ...value, leida: true } : value,
      ))
    }
    setOpen(false)
    navigate(item.ruta)
  }

  async function markAll() {
    if (!user) return
    await activityApi.marcarTodas(user.id)
    setItems(current => current.map(item => ({ ...item, leida: true })))
  }

  const unread = items.filter(item => !item.leida).length

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        className="notification-trigger"
        title="Notificaciones"
        onClick={() => setOpen(value => !value)}
      >
        <Bell size={21} />
        {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-header">
            <div>
              <strong>Notificaciones</strong>
              <small>{unread} sin leer</small>
            </div>
            {unread > 0 && (
              <button title="Marcar todas como leídas" onClick={() => void markAll()}>
                <CheckCheck size={17} />
              </button>
            )}
          </div>
          <div className="notification-list">
            {items.length === 0 ? (
              <p className="notification-empty">No tienes notificaciones nuevas.</p>
            ) : items.map(item => (
              <button
                key={item.id}
                className={item.leida ? 'notification-item' : 'notification-item unread'}
                onClick={() => void openNotification(item)}
              >
                <span className="notification-icon"><NotificationIcon type={item.tipo} /></span>
                <span>
                  <strong>{item.titulo}</strong>
                  <small>{item.mensaje}</small>
                  <time>{new Date(item.fecha).toLocaleString('es-MX')}</time>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
