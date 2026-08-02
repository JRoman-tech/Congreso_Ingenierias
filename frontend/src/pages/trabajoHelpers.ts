import type { Trabajo } from '../types'

export type EstadoTrabajo = Trabajo['estado']

export const ESTADOS_TRABAJO: Array<{ value: EstadoTrabajo; label: string }> = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
]

export function etiquetaEstadoTrabajo(estado: EstadoTrabajo) {
  return ESTADOS_TRABAJO.find(option => option.value === estado)?.label ?? estado
}
