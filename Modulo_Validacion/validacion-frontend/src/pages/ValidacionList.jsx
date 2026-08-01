import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import api from "@/lib/api"

const estadoStyles = {
  pendiente_academico: "bg-yellow-100 text-yellow-800 border-yellow-300",
  rechazado_academico: "bg-red-100 text-red-800 border-red-300",
  en_correccion_academico: "bg-orange-100 text-orange-800 border-orange-300",
  aprobado_academico: "bg-blue-100 text-blue-800 border-blue-300",
  pendiente_pago: "bg-yellow-100 text-yellow-800 border-yellow-300",
  pago_no_recibido: "bg-red-100 text-red-800 border-red-300",
  validado_completo: "bg-green-100 text-green-800 border-green-300",
}

const estadoLabels = {
  pendiente_academico: "Pendiente académico",
  rechazado_academico: "Rechazado académico",
  en_correccion_academico: "En corrección",
  aprobado_academico: "Académico aprobado",
  pendiente_pago: "Pendiente de pago",
  pago_no_recibido: "Pago no recibido",
  validado_completo: "Validado completo",
}

function EstadoBadge({ estado }) {
  if (!estado) return null
  return (
    <Badge className={estadoStyles[estado]} variant="outline">
      {estadoLabels[estado] || estado}
    </Badge>
  )
}

export default function ValidacionList() {
  const [validaciones, setValidaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  useEffect(() => {
    api.get("/validacion/con-nombre")
      .then((response) => {
        setValidaciones(response.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error al cargar validaciones:", err)
        setError("No se pudo conectar con el servidor")
        setLoading(false)
      })
  }, [])
  const validacionesFiltradas = validaciones.filter(v => {
    const coincideEstado = filtroEstado === "todos" || v.estado === filtroEstado
    const coincideBusqueda = busqueda === "" ||
      v.id.toString().includes(busqueda) ||
      v.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.correo?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideEstado && coincideBusqueda
  })
  if (loading) return <div className="ci-page text-slate-500">Cargando participantes...</div>
  if (error) return <div className="ci-page text-red-600">{error}</div>

  return (
    <section className="ci-page">
      <div className="ci-page-header">
        <div>
          <h1>Validación</h1>
          <p>Lista de participantes pendientes de revisión</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="ci-stats-grid">
        {[
          { label: "Total", valor: validaciones.length, color: "text-navy" },
          { label: "Pendientes", valor: validaciones.filter(v => v.estado === "pendiente_academico" || v.estado === "pendiente_pago").length, color: "text-yellow-700" },
          { label: "Aprobados", valor: validaciones.filter(v => v.estado === "validado_completo").length, color: "text-green-700" },
          { label: "Rechazados", valor: validaciones.filter(v => v.estado === "rechazado_academico" || v.estado === "pago_no_recibido").length, color: "text-red-700" },
        ].map(s => (
          <article key={s.label} className="ci-stat-card">
            <span>{s.label}</span>
            <strong className={s.color}>{s.valor}</strong>
          </article>
        ))}
      </div>

      {/* Filtros */}
      <div className="ci-toolbar">
        <Input
          placeholder="Buscar por ID o ID participante..."
          className="max-w-xs"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente_academico">Pendiente académico</SelectItem>
            <SelectItem value="rechazado_academico">Rechazado académico</SelectItem>
            <SelectItem value="en_correccion_academico">En corrección</SelectItem>
            <SelectItem value="aprobado_academico">Académico aprobado</SelectItem>
            <SelectItem value="pendiente_pago">Pendiente de pago</SelectItem>
            <SelectItem value="pago_no_recibido">Pago no recibido</SelectItem>
            <SelectItem value="validado_completo">Validado completo</SelectItem>
          </SelectContent>
        </Select>
        {(busqueda || filtroEstado !== "todos") && (
          <Button
            variant="outline"
            onClick={() => { setBusqueda(""); setFiltroEstado("todos") }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="ci-table-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validacionesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              validacionesFiltradas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.id}</TableCell>
                  <TableCell>
  <div className="font-medium">{v.nombre}</div>
  <div className="text-xs text-slate-400">{v.correo}</div>
</TableCell>
                  <TableCell><EstadoBadge estado={v.estado} /></TableCell>
                  <TableCell className="text-slate-500">{v.creadoEn}</TableCell>
                  <TableCell className="text-slate-500">{v.actualizadoEn?.substring(0, 16).replace("T", " ")}</TableCell>
                  <TableCell>
                    <Link to={`/validacion/${v.id}`}>
                      <Button size="sm">
                        Revisar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-400">
          Mostrando {validacionesFiltradas.length} de {validaciones.length} resultados
        </div>
      </div>
    </section>
  )
}
