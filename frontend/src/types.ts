export interface Participante {
  id: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  correo: string
  telefono?: string
  pais?: string
  institucion?: string
  categoria: 'Estudiante' | 'Docente' | 'Investigador' | 'Profesional'
  requiere_carta_invitacion: boolean
  fecha_registro: string
}

export interface Documento {
  id: number
  participante_id: string
  tipo_documento: string
  nombre_archivo: string
  ruta_archivo: string
  tamano_bytes?: number
  estado: 'pendiente' | 'en_revision' | 'validado' | 'rechazado'
}

export interface Pago {
  id: string
  participante_id: string
  modalidad: 'individual' | 'agrupado'
  nombre_archivo: string
  ruta_archivo: string
  tamano_bytes?: number
  estado: 'pendiente' | 'en_revision' | 'validado' | 'rechazado'
  fecha_carga: string
  trabajos: Array<Pick<Trabajo, 'id' | 'folio' | 'titulo'>>
}

export interface Trabajo {
  id: string
  folio: string
  participante_id: string
  autor_principal: string
  titulo: string
  resumen?: string
  eje_tematico: string
  palabras_clave?: string
  modalidad: 'presencial' | 'virtual' | 'grabado'
  estado: 'pendiente' | 'en_revision' | 'aceptado' | 'rechazado'
  resumen_documento_id?: number
  estado_resumen: Documento['estado']
  comprobante_pago_id?: string
  estado_pago: Pago['estado']
  fecha_registro: string
}

export interface DashboardStats {
  participantes: number
  trabajos: number
  documentos: number
  por_categoria: Array<{ categoria: string; total: number }>
}

export interface SessionUser {
  id: string
  nombre: string
  correo: string
  rol: 'administrador' | 'participante'
  participante_id?: string
  categoria?: string
  institucion?: string
}

export interface ActivityItem {
  id: number
  actor_usuario_id?: string
  actor_nombre: string
  participante_id?: string
  tipo: string
  titulo: string
  descripcion: string
  entidad_tipo: string
  entidad_id?: string
  ruta: string
  fecha: string
}

export interface NotificationItem {
  id: number
  usuario_id: string
  tipo: string
  titulo: string
  mensaje: string
  ruta: string
  leida: boolean
  fecha: string
}

export type EstadoValidacion =
  | 'pendiente_academico'
  | 'rechazado_academico'
  | 'en_correccion_academico'
  | 'aprobado_academico'
  | 'pendiente_pago'
  | 'pago_no_recibido'
  | 'validado_completo'

export interface ValidacionAcademica {
  id: number
  titulo: string
  resumen: string
  palabras_clave?: string
  observaciones?: string
  actualizado_en: string
}

export interface ValidacionPago {
  id: number
  nombre_archivo: string
  ruta_archivo: string
  monto?: number
  estado: 'pendiente' | 'rechazado' | 'verificado'
  fecha_carga: string
}

export interface HistorialValidacion {
  id: number
  estado_anterior?: EstadoValidacion
  estado_nuevo: EstadoValidacion
  comentario?: string
  realizado_por: string
  fecha: string
}

export interface Validacion {
  id: number
  participante_id: string
  estado: EstadoValidacion
  creado_en: string
  actualizado_en: string
  nombre: string
  correo: string
  institucion?: string
  categoria?: string
  academica?: ValidacionAcademica
  pago?: ValidacionPago
  historial?: HistorialValidacion[]
}
