export default function RutaProtegida({ children, rol }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null")

  if (!usuario) {
    window.location.assign("/login")
    return null
  }

  const rolActual = usuario.rol === "administrador" ? "admin" : usuario.rol
  if (rol && rolActual !== rol) {
    window.location.assign("/dashboard")
    return null
  }

  return children
}
