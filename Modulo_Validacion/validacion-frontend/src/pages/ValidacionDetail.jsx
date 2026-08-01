import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  pendiente_academico: "Pendiente de revisión académica",
  rechazado_academico: "Datos académicos rechazados",
  en_correccion_academico: "En corrección — participante corrigió",
  aprobado_academico: "Académico aprobado — pendiente de pago",
  pendiente_pago: "Comprobante en revisión",
  pago_no_recibido: "Pago no recibido",
  validado_completo: "✓ Validado completamente",
}

function EstadoBadge({ estado }) {
  if (!estado) return null
  return (
    <Badge className={estadoStyles[estado]} variant="outline">
      {estadoLabels[estado] || estado}
    </Badge>
  )
}

export default function ValidacionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [validacion, setValidacion] = useState(null)
  const [pago, setPago] = useState(null)
  const [academica, setAcademica] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [observaciones, setObservaciones] = useState("")

  const cargarTodo = () => {
    Promise.all([
      api.get(`/validacion/${id}`),
      api.get(`/validacion-pago/validacion/${id}`).catch(() => ({ data: null })),
      api.get(`/validacion-academica/validacion/${id}`).catch(() => ({ data: null })),
      api.get(`/historial/validacion/${id}`).catch(() => ({ data: [] })),
    ])
      .then(([resV, resP, resA, resH]) => {
        setValidacion(resV.data)
        setPago(resP.data)
        setAcademica(resA.data)
        setHistorial(resH.data)
        setLoading(false)
      })
      .catch(() => {
        setError("No se pudo cargar la información")
        setLoading(false)
      })
  }

  useEffect(() => {
    cargarTodo()
  }, [id])

  const cambiarEstado = (endpoint) => {
    setProcesando(true)
    api.put(`/validacion/${id}/${endpoint}`)
      .then((res) => {
        setValidacion(res.data)
        // Recargar historial
        api.get(`/historial/validacion/${id}`)
          .then(r => setHistorial(r.data))
        setProcesando(false)
        setObservaciones("")
      })
      .catch(() => setProcesando(false))
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (error || !validacion) return <div className="p-8 text-red-600">{error || "No encontrado"}</div>

  const estado = validacion.estado
  const faseAcademico = ["pendiente_academico", "rechazado_academico", "en_correccion_academico"].includes(estado)
  const fasePago = ["aprobado_academico", "pendiente_pago", "pago_no_recibido"].includes(estado)
  const completo = estado === "validado_completo"

  return (
    <div className="p-8">
      <Link to="/" className="text-sm text-slate-500 hover:text-navy">
        ← Volver a la lista
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Revisar participante</h1>
          <p className="text-slate-500">Validación #{validacion.id} · Participante #{validacion.idParticipante}</p>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      {/* FASE 1 — Revisión académica */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-navy text-lg flex items-center justify-between">
            Fase 1 — Información académica
            {!faseAcademico && <span className="text-xs font-normal text-green-600">✓ Completada</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {academica ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Título</span>
                <span className="font-medium max-w-xs text-right">{academica.titulo}</span>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Resumen</span>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {academica.resumen}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Palabras clave</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[academica.palabraClave1, academica.palabraClave2, academica.palabraClave3,
                    academica.palabraClave4, academica.palabraClave5].filter(Boolean).map(p => (
                    <Badge key={p} variant="outline" className="text-navy border-navy/30">{p}</Badge>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">El participante aún no ha enviado su información académica.</p>
          )}

          {/* Botones fase académica */}
          {faseAcademico && academica && (
            <>
              <Separator />
              <Textarea
                placeholder="Observaciones para el participante (opcional)..."
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => cambiarEstado("aprobar-academico")}
                  disabled={procesando}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {procesando ? "Procesando..." : "Aprobar datos académicos"}
                </Button>
                <Button
                  onClick={() => cambiarEstado("rechazar-academico")}
                  disabled={procesando}
                  variant="outline"
                  className="border-red-300 text-red-700 flex-1"
                >
                  {procesando ? "Procesando..." : "Rechazar y pedir corrección"}
                </Button>
              </div>
            </>
          )}

          {estado === "en_correccion_academico" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              ⚠️ El participante envió una corrección — revisa los datos actualizados arriba.
            </div>
          )}
        </CardContent>
      </Card>

      {/* FASE 2 — Comprobante de pago */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-navy text-lg flex items-center justify-between">
            Fase 2 — Comprobante de pago
            {completo && <span className="text-xs font-normal text-green-600">✓ Completada</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!fasePago && !completo ? (
            <p className="text-sm text-slate-400">
              Esta sección se habilita una vez que se aprueben los datos académicos.
            </p>
          ) : pago ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monto</span>
                <span className="font-medium">${pago.monto} MXN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fecha de pago</span>
                <span className="font-medium">{pago.fechaPago}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Comprobante</span>
                <a 
  href={`http://localhost:8081/api/validacion-pago/archivo/${pago.comprobantePago}`}
  target="_blank"
  className="text-blue-600 underline text-sm"
>
  {pago.comprobantePago}
</a>
              </div>

              {fasePago && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-slate-700">¿Se recibió el pago?</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => cambiarEstado("pago-recibido")}
                      disabled={procesando}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      {procesando ? "Procesando..." : "Sí, pago recibido"}
                    </Button>
                    <Button
                      onClick={() => cambiarEstado("pago-no-recibido")}
                      disabled={procesando}
                      variant="outline"
                      className="border-red-300 text-red-700 flex-1"
                    >
                      {procesando ? "Procesando..." : "No se recibió el pago"}
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">El participante aún no ha subido su comprobante.</p>
          )}

          {completo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✓ Pago verificado. Este participante está completamente validado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg">Historial de cambios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historial.map(h => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-b border-slate-100 pb-3 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-navy mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{estadoLabels[h.estadoNuevo] || h.estadoNuevo}</span>
                      <span className="text-slate-400 text-xs">{h.fecha?.substring(0, 16).replace("T", " ")}</span>
                    </div>
                    {h.comentario && <p className="text-slate-500 mt-0.5">{h.comentario}</p>}
                    <p className="text-slate-400 text-xs mt-0.5">Por: {h.realizadoPor}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={() => navigate("/")}>
          Volver a la lista
        </Button>
      </div>
    </div>
  )
}