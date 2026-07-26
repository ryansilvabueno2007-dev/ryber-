import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createCheckoutSession } from '../api/client'

export function Header({ right }: { right?: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [subscribing, setSubscribing] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      const { url } = await createCheckoutSession()
      window.location.href = url
    } catch {
      setSubscribing(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-panel/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img src="/logo-mark.png" alt="" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
            Ryber
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {right}
          {user && (
            <>
              <Link
                to="/history"
                className="text-sm font-medium text-ink-soft hover:text-accent transition-colors whitespace-nowrap"
              >
                Histórico
              </Link>
              {!user.is_subscribed && (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="rounded-full bg-accent text-white px-3 sm:px-4 py-2 text-sm font-medium shadow-card disabled:opacity-60 whitespace-nowrap"
                >
                  {subscribing ? 'Abrindo...' : 'Assinar'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-ink-soft hover:text-accent transition-colors whitespace-nowrap"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
