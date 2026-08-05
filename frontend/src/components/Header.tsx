import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Header({ right }: { right?: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-canvas/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to={user ? '/app' : '/'} className="flex items-center gap-2 shrink-0 group">
          <img src="/logo-mark.png" alt="" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
            Ryber
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {right}
          {user ? (
            <>
              <Link
                to="/"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Página inicial
              </Link>
              <Link
                to="/app"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Histórico
              </Link>
              <Link
                to="/planos"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Planos
              </Link>
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-block text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
                >
                  Admin
                </Link>
              )}
              {!user.is_subscribed && (
                <Link
                  to="/planos"
                  className="rounded-full bg-accent text-white px-3 sm:px-4 py-2 text-sm font-medium shadow-glow hover:bg-accent-strong transition-colors whitespace-nowrap"
                >
                  Assinar
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-accent text-white px-3 sm:px-4 py-2 text-sm font-medium shadow-glow hover:bg-accent-strong transition-colors whitespace-nowrap"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
