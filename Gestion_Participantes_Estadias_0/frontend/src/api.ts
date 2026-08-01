import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
export const VALIDATION_API_BASE = import.meta.env.VITE_VALIDATION_API_URL ?? 'http://localhost:8081'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
})

const validationApiClient = axios.create({
  baseURL: `${VALIDATION_API_BASE}/api`,
  timeout: 10000,
})

export const validationIntegrationApi = {
  sincronizarSesion: (sessionId: string) =>
    validationApiClient.post(`/integracion/sesion/${sessionId}`),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
}

export const activityApi = {
  historial: (limit = 50) => api.get('/actividad', { params: { limit } }),
  notificaciones: (usuarioId: string, limit = 30) =>
    api.get(`/notificaciones/usuario/${usuarioId}`, { params: { limit } }),
  marcarLeida: (id: number, usuarioId: string) =>
    api.put(`/notificaciones/${id}/leer`, null, { params: { usuarioId } }),
  marcarTodas: (usuarioId: string) =>
    api.put(`/notificaciones/usuario/${usuarioId}/leer-todas`),
}

export const sessionApi = {
  opciones: () => api.get('/sesion/opciones'),
  obtener: (id: string) => api.get(`/sesion/${id}`),
}

export const authApi = {
  login: (correo: string, password: string) =>
    api.post('/auth/login', { correo, password }),
  registrar: (data: object) => api.post('/auth/registro', data),
}

export const participantesApi = {
  listar: (params?: object) => api.get('/participantes', { params }),
  obtener: (id: string) => api.get(`/participantes/${id}`),
  crear: (data: object) => api.post('/participantes', data),
  actualizar: (id: string, data: object) => api.put(`/participantes/${id}`, data),
  eliminar: (id: string) => api.delete(`/participantes/${id}`),
  obtenerAcademica: (id: string) => api.get(`/participantes/${id}/academica`),
  guardarAcademica: (id: string, data: object) =>
    api.put(`/participantes/${id}/academica`, data),
  documentos: (id: string) => api.get(`/participantes/${id}/documentos`),
  configuracionDocumentos: (id: string) =>
    api.get(`/participantes/${id}/documentos/configuracion`),
  guardarConfiguracionDocumentos: (id: string, data: object) =>
    api.put(`/participantes/${id}/documentos/configuracion`, data),
  subirDocumento: (id: string, data: FormData) =>
    api.post(`/participantes/${id}/documentos`, data),
  eliminarDocumento: (id: string, tipo: string) =>
    api.delete(`/participantes/${id}/documentos/${tipo}`),
  actualizarEstadoDocumento: (
    id: string,
    tipo: string,
    estado: string,
    usuarioId?: string,
  ) => api.put(`/participantes/${id}/documentos/${tipo}/estado`, {
    estado,
    usuario_id: usuarioId,
  }),
  pagos: (id: string) => api.get(`/participantes/${id}/pagos`),
  subirPago: (id: string, data: FormData) =>
    api.post(`/participantes/${id}/pagos`, data),
  eliminarPago: (id: string, pagoId: string) =>
    api.delete(`/participantes/${id}/pagos/${pagoId}`),
  actualizarEstadoPago: (
    id: string,
    pagoId: string,
    estado: string,
    usuarioId?: string,
  ) => api.put(`/participantes/${id}/pagos/${pagoId}/estado`, {
    estado,
    usuario_id: usuarioId,
  }),
}

export const trabajosApi = {
  listar: (params?: object) => api.get('/trabajos', { params }),
  obtener: (id: string) => api.get(`/trabajos/${id}`),
  crear: (data: object) => api.post('/trabajos', data),
  actualizar: (id: string, data: object) => api.put(`/trabajos/${id}`, data),
  actualizarEstado: (id: string, estado: string, usuarioId?: string) =>
    api.put(`/trabajos/${id}/estado`, { estado, usuario_id: usuarioId }),
  eliminar: (id: string) => api.delete(`/trabajos/${id}`),
}
