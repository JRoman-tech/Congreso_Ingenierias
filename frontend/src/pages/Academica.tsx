import { useEffect, useState } from 'react'
import { participantesApi } from '../api'
import { useRouter } from '../router'
import type { Participante } from '../types'

const AREAS = [
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Tecnologías de la Información',
  'Ciencias Ambientales',
  'Materiales Avanzados',
]

const initial = {
  grado_maximo_estudios: '',
  institucion_academica: '',
  pais_academico: '',
  anio_egreso: '',
  area_estudio: '',
  semblanza: '',
  areas_interes: [] as string[],
}

export default function Academica({
  id,
  participantLocked = false,
}: {
  id?: string
  participantLocked?: boolean
}) {
  const { navigate } = useRouter()
  const [participants, setParticipants] = useState<Participante[]>([])
  const [form, setForm] = useState(initial)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (participantLocked) return
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await participantesApi.listar({ page: 1, limit: 1000 })
        setParticipants(data.data)
      } catch {
        setError('No se pudo cargar la lista de participantes')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [participantLocked])

  useEffect(() => {
    if (!id) return
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await participantesApi.obtenerAcademica(id)
        setForm({
          grado_maximo_estudios: data.grado_maximo_estudios || '',
          institucion_academica: data.institucion_academica || '',
          pais_academico: data.pais_academico || '',
          anio_egreso: data.anio_egreso ? String(data.anio_egreso) : '',
          area_estudio: data.area_estudio || '',
          semblanza: data.semblanza || '',
          areas_interes: data.areas_interes || [],
        })
      } catch {
        setError('No se pudo cargar la información académica')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id])

  function change(field: string, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function toggleArea(area: string) {
    setForm(current => ({
      ...current,
      areas_interes: current.areas_interes.includes(area)
        ? current.areas_interes.filter(item => item !== area)
        : [...current.areas_interes, area],
    }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!id) return
    try {
      await participantesApi.guardarAcademica(id, form)
      setMessage('Información académica guardada')
      setError('')
    } catch {
      setError('No se pudo guardar la información académica')
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{participantLocked ? 'Mi información académica' : 'Información académica'}</h1>
          <p className="muted">Formación, semblanza y áreas de interés</p>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      {!participantLocked && (
        <div className="form-card">
          <div className="field">
            <label>Participante</label>
            <select
              value={id || ''}
              onChange={event => navigate(
                event.target.value ? `/dashboard/academica/${event.target.value}` : '/dashboard/academica',
              )}
            >
              <option value="">Selecciona un participante</option>
              {participants.map(participant => (
                <option key={participant.id} value={participant.id}>
                  {participant.nombre} {participant.apellido_paterno} · {participant.correo}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-card">
          <div className="form-grid">
            <div className="field">
              <label>Grado máximo de estudios</label>
              <select value={form.grado_maximo_estudios} onChange={e => change('grado_maximo_estudios', e.target.value)}>
                <option value="">Selecciona una opción</option>
                <option>Licenciatura</option>
                <option>Especialidad</option>
                <option>Maestría</option>
                <option>Doctorado</option>
              </select>
            </div>
            <div className="field">
              <label>Institución académica</label>
              <input value={form.institucion_academica} onChange={e => change('institucion_academica', e.target.value)} />
            </div>
            <div className="field">
              <label>País</label>
              <input value={form.pais_academico} onChange={e => change('pais_academico', e.target.value)} />
            </div>
            <div className="field">
              <label>Año de egreso</label>
              <input
                type="number"
                min="1950"
                max="2100"
                value={form.anio_egreso}
                onChange={e => change('anio_egreso', e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Área de estudio</label>
              <select value={form.area_estudio} onChange={e => change('area_estudio', e.target.value)}>
                <option value="">Selecciona un área</option>
                {AREAS.map(area => <option key={area}>{area}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Semblanza</label>
              <textarea value={form.semblanza} onChange={e => change('semblanza', e.target.value)} />
            </div>
            <div className="field full">
              <label>Áreas de interés</label>
              <div className="form-grid">
                {AREAS.map(area => (
                  <label className="checkbox-row" key={area}>
                    <input
                      type="checkbox"
                      checked={form.areas_interes.includes(area)}
                      onChange={() => toggleArea(area)}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-primary" disabled={!id}>Guardar información</button>
        </div>
      </form>
    </section>
  )
}
