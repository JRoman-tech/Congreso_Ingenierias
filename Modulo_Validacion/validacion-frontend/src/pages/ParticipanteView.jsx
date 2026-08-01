import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  en_correccion_academico: "En corrección",
  aprobado_academico: "Datos académicos aprobados — pendiente de pago",
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

export default function ParticipanteView() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}")
  const [validacion, setValidacion] = useState(null)
  const [academica, setAcademica] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  // Formulario académico
  const [titulo, setTitulo] = useState("")
  const [resumen, setResumen] = useState("")
  const [palabras, setPalabras] = useState(["", "", "", "", ""])
  const [enviandoAcademico, setEnviandoAcademico] = useState(false)

  // Comprobante
  const [archivo, setArchivo] = useState(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [mensajeArchivo, setMensajeArchivo] = useState("")

  useEffect(() => {
    api.get("/validacion")
      .then(res => {
        const miValidacion = res.data.find(v => v.idParticipante === usuario.id)
        if (miValidacion) {
          setValidacion(miValidacion)
          return Promise.all([
            api.get(`/validacion-academica/validacion/${miValidacion.id}`).catch(() => ({ data: null })),
            api.get(`/historial/validacion/${miValidacion.id}`).catch(() => ({ data: [] }))
          ])
        }
        setLoading(false)
        return null
      })
      .then(results => {
        if (results) {
          setAcademica(results[0].data)
          setHistorial(results[1].data)
          if (results[0].data) {
            setTitulo(results[0].data.titulo || "")
            setResumen(results[0].data.resumen || "")
            setPalabras([
              results[0].data.palabraClave1 || "",
              results[0].data.palabraClave2 || "",
              results[0].data.palabraClave3 || "",
              results[0].data.palabraClave4 || "",
              results[0].data.palabraClave5 || "",
            ])
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleEnviarAcademico = () => {
  const conteo = resumen.trim() === "" ? 0 : resumen.trim().split(/\s+/).length
  if (conteo > 250) {
    alert("El resumen excede el límite de 250 palabras")
    return
  }
    if (!validacion) return
    setEnviandoAcademico(true)
    const datos = {
      idValidacion: validacion.id,
      titulo,
      resumen,
      palabraClave1: palabras[0],
      palabraClave2: palabras[1],
      palabraClave3: palabras[2],
      palabraClave4: palabras[3],
      palabraClave5: palabras[4],
      datosValidos: false,
      observaciones: "",
      revisadoPor: "",
      revisadoEn: "",
    }
    const request = academica
      ? api.put(`/validacion-academica/${academica.id}`, datos)
      : api.post("/validacion-academica", datos)

    request.then(res => {
      setAcademica(res.data)
      if (validacion.estado === "rechazado_academico") {
        return api.put(`/validacion/${validacion.id}/en-correccion`)
      }
    })
    .then(() => setEnviandoAcademico(false))
    .catch(() => setEnviandoAcademico(false))
  }

  const handleSubirComprobante = () => {
    if (!archivo) {
      setMensajeArchivo("Selecciona un archivo PDF primero")
      return
    }
    setSubiendoArchivo(true)
    const formData = new FormData()
    formData.append("archivo", archivo)
    api.post(`/validacion-pago/subir-comprobante/${validacion.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(() => {
      setMensajeArchivo("✓ Comprobante subido correctamente")
      setSubiendoArchivo(false)
      setArchivo(null)
      // Actualizar estado a pendiente_pago
      return api.put(`/validacion/${validacion.id}/en-correccion`)
    })
    .catch(() => {
      setMensajeArchivo("Error al subir el archivo, intenta de nuevo")
      setSubiendoArchivo(false)
    })
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando tu información...</div>

  if (!validacion) return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy mb-2">Mi validación</h1>
      <p className="text-slate-500">No tienes ninguna validación registrada aún.</p>
    </div>
  )

  const puedeEditarAcademico = ["pendiente_academico", "rechazado_academico", "en_correccion_academico"].includes(validacion.estado)
  const puedeSubirPago = validacion.estado === "aprobado_academico" || validacion.estado === "pendiente_pago" || validacion.estado === "pago_no_recibido"

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-navy mb-1">Mi validación</h1>
      <p className="text-slate-500 mb-4">Hola, {usuario.nombre}</p>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-slate-500">Estado actual:</span>
        <EstadoBadge estado={validacion.estado} />
      </div>

      {/* Fase 1 — Datos académicos */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-navy text-lg">Fase 1 — Información académica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {validacion.estado === "rechazado_academico" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ⚠️ Tus datos académicos fueron rechazados. Por favor corrígelos y vuelve a enviar.
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Título de la ponencia</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              disabled={!puedeEditarAcademico}
              placeholder="Título de tu trabajo..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Resumen <span className="text-slate-400 font-normal">(máx. 250 palabras)</span>
            </label>
            {(() => {
  const conteo = resumen.trim() === "" ? 0 : resumen.trim().split(/\s+/).length
  const excede = conteo > 250
  return (
    <>
      <Textarea
        value={resumen}
        onChange={e => setResumen(e.target.value)}
        disabled={!puedeEditarAcademico}
        placeholder="Escribe tu resumen aquí..."
        rows={5}
        className={excede ? "border-red-400 focus:ring-red-300" : ""}
      />
      <div className={`text-xs text-right mt-1 ${excede ? "text-red-600 font-medium" : "text-slate-400"}`}>
        {conteo} / 250 palabras {excede && "— excede el límite"}
      </div>
    </>
  )
})()}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Palabras clave</label>
            <div className="grid grid-cols-5 gap-2">
              {palabras.map((p, i) => (
                <input
                  key={i}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  value={p}
                  onChange={e => {
                    const nuevas = [...palabras]
                    nuevas[i] = e.target.value
                    setPalabras(nuevas)
                  }}
                  disabled={!puedeEditarAcademico}
                  placeholder={`Clave ${i + 1}`}
                />
              ))}
            </div>
          </div>
          {puedeEditarAcademico && (
            <Button
              onClick={handleEnviarAcademico}
              disabled={enviandoAcademico}
              className="bg-navy hover:bg-navy/90 text-white"
            >
              {enviandoAcademico ? "Enviando..." : academica ? "Reenviar corrección" : "Enviar para revisión"}
            </Button>
          )}
          {!puedeEditarAcademico && (
            <p className="text-sm text-slate-400">✓ Información académica enviada y en proceso de revisión.</p>
          )}
        </CardContent>
      </Card>

      {/* Fase 2 — Pago */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-navy text-lg">Fase 2 — Comprobante de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!puedeSubirPago && validacion.estado !== "validado_completo" && (
            <p className="text-sm text-slate-400">
              Esta sección se habilitará una vez que tus datos académicos sean aprobados.
            </p>
          )}
          {puedeSubirPago && (
            <>
              {validacion.estado === "pago_no_recibido" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ No se recibió tu pago. Por favor sube el comprobante nuevamente.
                </div>
              )}
              <p className="text-sm text-slate-600">Sube tu comprobante de pago en formato PDF (máx. 10MB).</p>
              <input
                type="file"
                accept=".pdf"
                className="text-sm"
                onChange={e => {
                  setArchivo(e.target.files[0])
                  setMensajeArchivo("")
                }}
              />
              {mensajeArchivo && (
                <p className={`text-sm ${mensajeArchivo.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                  {mensajeArchivo}
                </p>
              )}
              <Button
                onClick={handleSubirComprobante}
                disabled={subiendoArchivo}
                className="bg-navy hover:bg-navy/90 text-white"
              >
                {subiendoArchivo ? "Subiendo..." : "Subir comprobante"}
              </Button>
            </>
          )}
          {validacion.estado === "validado_completo" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✓ Tu pago fue verificado. Tu participación está completamente validada.
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
                  <div>
                    <p className="text-slate-700">{estadoLabels[h.estadoNuevo] || h.estadoNuevo}</p>
                    {h.comentario && <p className="text-slate-400">{h.comentario}</p>}
                    <p className="text-slate-400 text-xs">{h.fecha?.substring(0, 16).replace("T", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}