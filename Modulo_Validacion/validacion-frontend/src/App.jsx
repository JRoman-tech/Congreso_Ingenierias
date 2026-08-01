import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import ValidacionList from "@/pages/ValidacionList"
import ValidacionDetail from "@/pages/ValidacionDetail"
import ParticipanteView from "@/pages/ParticipanteView"
import RutaProtegida from "@/components/RutaProtegida"

function RedirectToMain({ path }) {
  useEffect(() => {
    window.location.replace(path)
  }, [path])
  return <div className="ci-session-loading">Redirigiendo...</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        <RutaProtegida rol="admin">
          <Layout><ValidacionList /></Layout>
        </RutaProtegida>
      } />
      <Route path="/validacion/:id" element={
        <RutaProtegida rol="admin">
          <Layout><ValidacionDetail /></Layout>
        </RutaProtegida>
      } />
      <Route path="/participante" element={
        <RutaProtegida rol="participante">
          <Layout><ParticipanteView /></Layout>
        </RutaProtegida>
      } />
      <Route path="/login" element={<RedirectToMain path="/login" />} />
      <Route path="/registro" element={<RedirectToMain path="/registro" />} />
      <Route path="*" element={<RedirectToMain path="/dashboard" />} />
    </Routes>
  )
}
