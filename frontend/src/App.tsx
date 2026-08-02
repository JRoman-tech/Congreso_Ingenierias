import Layout from './components/Layout'
import Academica from './pages/Academica'
import Dashboard from './pages/Dashboard'
import Documentos from './pages/Documentos'
import Historial from './pages/Historial'
import Home from './pages/Home'
import Login from './pages/Login'
import ParticipanteForm from './pages/ParticipanteForm'
import Participantes from './pages/Participantes'
import ParticipantDashboard from './pages/ParticipantDashboard'
import Registro from './pages/Registro'
import TrabajoForm from './pages/TrabajoForm'
import Trabajos from './pages/Trabajos'
import Validaciones from './pages/Validaciones'
import { RouterProvider, useRouter } from './router'
import { SessionProvider, useSession } from './session/SessionContext'

function AdminRoutes({ path }: { path: string }) {
  const participantEdit = path.match(/^\/dashboard\/participantes\/([^/]+)\/editar$/)
  const academic = path.match(/^\/dashboard\/academica\/([^/]+)$/)
  const documents = path.match(/^\/dashboard\/documentos\/([^/]+)$/)
  const work = path.match(/^\/dashboard\/trabajos\/([^/]+)$/)
  const validation = path.match(/^\/dashboard\/validacion\/([^/]+)$/)

  if (path === '/dashboard') return <Dashboard />
  if (path === '/dashboard/participantes') return <Participantes />
  if (path === '/dashboard/participantes/nuevo') return <ParticipanteForm />
  if (participantEdit) return <ParticipanteForm id={participantEdit[1]} />
  if (path === '/dashboard/academica') return <Academica />
  if (academic) return <Academica id={academic[1]} />
  if (path === '/dashboard/documentos') return <Documentos />
  if (documents) return <Documentos id={documents[1]} />
  if (path === '/dashboard/trabajos') return <Trabajos />
  if (path === '/dashboard/historial') return <Historial />
  if (path === '/dashboard/validacion') return <Validaciones />
  if (validation) return <TrabajoForm id={validation[1]} readOnly reviewMode />
  if (path === '/dashboard/trabajos/nuevo') return <TrabajoForm />
  if (work) {
    const readOnly = new URLSearchParams(window.location.search).get('mode') === 'view'
    return <TrabajoForm id={work[1]} readOnly={readOnly} />
  }
  return <Dashboard />
}

function ParticipantRoutes({ path, participantId }: { path: string; participantId: string }) {
  const work = path.match(/^\/dashboard\/trabajos\/([^/]+)$/)

  if (path === '/dashboard') return <ParticipantDashboard participantId={participantId} />
  if (path.startsWith('/dashboard/academica')) {
    return <Academica id={participantId} participantLocked />
  }
  if (path.startsWith('/dashboard/documentos')) {
    return <Documentos id={participantId} participantLocked />
  }
  if (path === '/dashboard/trabajos') return <Trabajos participantId={participantId} />
  if (path === '/dashboard/trabajos/nuevo') {
    return <TrabajoForm fixedParticipantId={participantId} />
  }
  if (work) {
    const readOnly = new URLSearchParams(window.location.search).get('mode') === 'view'
    return <TrabajoForm id={work[1]} readOnly={readOnly} fixedParticipantId={participantId} />
  }
  return <ParticipantDashboard participantId={participantId} />
}

function ApplicationRoutes() {
  const { path } = useRouter()
  const { user, loading, error } = useSession()

  if (loading) return <div className="session-loading">Cargando...</div>
  if (path === '/') return <Home />
  if (path === '/login') return <Login />
  if (path === '/registro') return <Registro />
  if (error) return <div className="session-loading error">{error}</div>
  if (!user) return <Login />

  const page = user.rol === 'administrador'
    ? <AdminRoutes path={path} />
    : <ParticipantRoutes path={path} participantId={user.participante_id ?? ''} />

  return <Layout>{page}</Layout>
}

export default function App() {
  return (
    <RouterProvider>
      <SessionProvider>
        <ApplicationRoutes />
      </SessionProvider>
    </RouterProvider>
  )
}
