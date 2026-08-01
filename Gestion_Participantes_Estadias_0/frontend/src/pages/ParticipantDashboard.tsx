import { FileText, FolderOpen, GraduationCap, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { participantesApi, trabajosApi } from '../api'
import type { Participante } from '../types'

interface Summary {
  trabajos: number
  documentos: number
  areas: number
  grado: string
}

const emptySummary: Summary = {
  trabajos: 0,
  documentos: 0,
  areas: 0,
  grado: 'Sin registrar',
}

export default function ParticipantDashboard({ participantId }: { participantId: string }) {
  const [participant, setParticipant] = useState<Participante | null>(null)
  const [summary, setSummary] = useState(emptySummary)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const [participantResponse, academicResponse, documentsResponse, worksResponse] =
          await Promise.all([
            participantesApi.obtener(participantId),
            participantesApi.obtenerAcademica(participantId),
            participantesApi.documentos(participantId),
            trabajosApi.listar({
              page: 1,
              limit: 1000,
              participante_id: participantId,
            }),
          ])

        setParticipant(participantResponse.data)
        setSummary({
          trabajos: worksResponse.data.total,
          documentos: documentsResponse.data.length,
          areas: academicResponse.data.areas_interes?.length ?? 0,
          grado: academicResponse.data.grado_maximo_estudios || 'Sin registrar',
        })
        setError('')
      } catch {
        setError('No se pudo cargar el panel personalizado')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [participantId])

  const cards = [
    { label: 'Mis trabajos', value: summary.trabajos, icon: FileText },
    { label: 'Mis documentos', value: summary.documentos, icon: FolderOpen },
    { label: 'Áreas de interés', value: summary.areas, icon: GraduationCap },
  ]

  return (
    <section>
      <div className="participant-welcome">
        <div>
          <span className="eyebrow">Panel del participante</span>
          <h1>Bienvenido, {participant?.nombre ?? 'participante'}</h1>
          <p>Consulta y actualiza la información asociada a tu participación.</p>
        </div>
        <UserCircle size={58} strokeWidth={1.3} />
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="cards">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="card" key={label}>
            <Icon color="#c89b3c" />
            <span className="card-label">{label}</span>
            <strong className="card-value">{value}</strong>
          </article>
        ))}
      </div>

      <div className="form-card profile-summary">
        <div>
          <span className="muted">Nombre completo</span>
          <strong>
            {participant?.nombre} {participant?.apellido_paterno} {participant?.apellido_materno}
          </strong>
        </div>
        <div>
          <span className="muted">Correo</span>
          <strong>{participant?.correo}</strong>
        </div>
        <div>
          <span className="muted">Institución</span>
          <strong>{participant?.institucion || 'Sin registrar'}</strong>
        </div>
        <div>
          <span className="muted">Grado máximo</span>
          <strong>{summary.grado}</strong>
        </div>
      </div>
    </section>
  )
}
