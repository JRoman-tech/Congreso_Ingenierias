import { Navigate } from "react-router-dom"

export default function RutaProtegida({ children, rol }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null")

  if (!usuario) {
    return <Navigate to="/login" />
  }

  if (rol && usuario.rol !== rol) {
    return <Navigate to="/login" />
  }

  return children
}