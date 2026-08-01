import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import api from './lib/api.js'

async function iniciarAplicacion() {
  const sesionId = localStorage.getItem('usuarioSesionId')
  if (sesionId) {
    try {
      const { data } = await api.post(`/integracion/sesion/${sesionId}`)
      localStorage.setItem('usuario', JSON.stringify(data))
    } catch {
      localStorage.removeItem('usuario')
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter basename="/modulo-validacion">
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void iniciarAplicacion()
