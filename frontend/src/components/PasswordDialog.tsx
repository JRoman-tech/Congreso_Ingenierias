import axios from 'axios'
import { KeyRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { authApi } from '../api'
import { useSession } from '../session/SessionContext'

type Target = { participanteId: string; nombre: string }

export default function PasswordDialog({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target?: Target
}) {
  const { user } = useSession()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function close() {
    setActual('')
    setNueva('')
    setConfirmacion('')
    setError('')
    setSuccess('')
    onClose()
  }

  if (!open || !user) return null
  const userId = user.id

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (nueva !== confirmacion) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (target) {
        await authApi.restablecerPassword(userId, target.participanteId, nueva)
      } else {
        await authApi.cambiarPassword(userId, actual, nueva)
      }
      setSuccess('La contraseña se actualizó correctamente')
      setActual('')
      setNueva('')
      setConfirmacion('')
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.error
        : undefined
      setError(message || 'No se pudo actualizar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="password-dialog-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button className="password-dialog-close" type="button" onClick={close} title="Cerrar">
          <X size={19} />
        </button>
        <div className="password-dialog-icon"><KeyRound size={23} /></div>
        <h2 id="password-dialog-title">
          {target ? 'Restablecer contraseña' : 'Cambiar mi contraseña'}
        </h2>
        <p className="muted">
          {target ? `Asignar una nueva contraseña a ${target.nombre}.` : 'Confirma tu contraseña actual antes de guardar la nueva.'}
        </p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <form onSubmit={submit}>
          {!target && (
            <div className="field">
              <label>Contraseña actual</label>
              <input required type="password" autoComplete="current-password" value={actual}
                onChange={event => setActual(event.target.value)} />
            </div>
          )}
          <div className="field">
            <label>Nueva contraseña</label>
            <input required type="password" minLength={6} maxLength={72} autoComplete="new-password"
              value={nueva} onChange={event => setNueva(event.target.value)} />
          </div>
          <div className="field">
            <label>Confirmar nueva contraseña</label>
            <input required type="password" minLength={6} maxLength={72} autoComplete="new-password"
              value={confirmacion} onChange={event => setConfirmacion(event.target.value)} />
          </div>
          <div className="password-dialog-actions">
            <button className="btn-secondary" type="button" onClick={close}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>
              <KeyRound size={16} /> {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
