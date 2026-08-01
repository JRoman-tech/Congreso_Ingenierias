import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/Layout"
import ValidacionList from "@/pages/ValidacionList"
import ValidacionDetail from "@/pages/ValidacionDetail"
import Login from "@/pages/LoginPage"
import ParticipanteView from "@/pages/ParticipanteView"
import RutaProtegida from "@/components/RutaProtegida"
import Registro from "@/pages/Registro"
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
      <Route path="/registro" element={<Registro />} />
      <Route path="*" element={<Navigate to="/login" />} />
      
    </Routes>
  )
}
export default App