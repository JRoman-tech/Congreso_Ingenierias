import { ArrowRight, FileCheck2, Layers3, UsersRound } from 'lucide-react'
import { useRouter } from '../router'
import { useSession } from '../session/SessionContext'

export default function Home() {
  const { navigate } = useRouter()
  const { user } = useSession()

  return (
    <div className="public-page">
      <header className="public-nav">
        <button className="public-brand" onClick={() => navigate('/')}>
          <span className="brand-number">2</span>
          <span><strong>FRONTERAS</strong><small>DE LAS INGENIERÍAS 2026</small></span>
        </button>
        <div>
          {user ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Ir a mi panel</button>
          ) : (
            <>
              <button className="public-link" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="btn-primary" onClick={() => navigate('/registro')}>Registrarme</button>
            </>
          )}
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div>
            <span className="eyebrow">Congreso universitario 2026</span>
            <h1>Gestiona tu participación y tus trabajos desde un solo lugar.</h1>
            <p>Registra ponencias, entrega documentos, consulta revisiones y administra tus comprobantes de pago.</p>
            <div className="home-actions">
              <button className="btn-primary" onClick={() => navigate(user ? '/dashboard' : '/registro')}>
                {user ? 'Abrir mi panel' : 'Crear mi cuenta'} <ArrowRight size={17} />
              </button>
              {!user && <button className="btn-secondary" onClick={() => navigate('/login')}>Ya tengo cuenta</button>}
            </div>
          </div>
          <div className="hero-mark" aria-hidden="true"><span>2</span><strong>2026</strong></div>
        </section>

        <section className="home-features">
          <article><UsersRound /><h2>Registro sencillo</h2><p>Mantén actualizados tus datos generales y académicos.</p></article>
          <article><Layers3 /><h2>Trabajos organizados</h2><p>Consulta folios, modalidades y resultados de revisión.</p></article>
          <article><FileCheck2 /><h2>Seguimiento documental</h2><p>Entrega cada requisito y revisa cuándo ha sido aprobado.</p></article>
        </section>
      </main>
    </div>
  )
}
