import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  )
}

export function Welcome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent-soft blur-[120px] pointer-events-none" />

      <div className="relative max-w-md w-full text-center">
        <div className="mx-auto mb-7 h-16 w-16 rounded-2xl bg-accent shadow-glow flex items-center justify-center">
          <SparkleIcon />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2.5">Bem-vindo à Ryber{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
        <p className={`text-ink-soft text-base leading-relaxed ${user?.email_verified ? 'mb-8' : 'mb-3'}`}>
          Sua conta foi criada com sucesso. Você possui{' '}
          <span className="text-ink font-medium">1 análise gratuita disponível</span>, sem compromisso.
        </p>
        {!user?.email_verified && (
          <p className="text-ink-faint text-sm leading-relaxed mb-8">
            Enviamos um link de confirmação para o seu e-mail — vale dar uma olhada quando puder.
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate('/analyze')}
          className="rounded-full bg-accent text-white px-8 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-all"
        >
          Iniciar primeira análise
        </button>
      </div>
    </div>
  )
}
