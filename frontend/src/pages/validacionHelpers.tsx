/* eslint-disable react-refresh/only-export-components */
import type { EstadoValidacion } from '../types'

export const estadoLabels: Record<EstadoValidacion, string> = {
  pendiente_academico: 'Pendiente académico',
  rechazado_academico: 'Académico rechazado',
  en_correccion_academico: 'En corrección',
  aprobado_academico: 'Académico aprobado',
  pendiente_pago: 'Pago en revisión',
  pago_no_recibido: 'Pago no recibido',
  validado_completo: 'Validado completo',
}

export function ValidationStatus({ estado }: { estado: EstadoValidacion }) {
  const kind = estado === 'validado_completo' ? 'success'
    : estado.includes('rechazado') || estado === 'pago_no_recibido' ? 'danger'
      : estado === 'aprobado_academico' ? 'info' : 'warning'
  return <span className={`validation-status ${kind}`}>{estadoLabels[estado]}</span>
}

export function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
