import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthValueProp } from '../components/AuthValueProp'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
      <AuthValueProp />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <img src="/logo-mark.png" alt="" className="h-7 w-7" />
            <span className="font-semibold tracking-tight text-ink">Ryber</span>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-ink">Entrar</div>
            <p className="text-sm text-ink-soft mt-1">Acesse sua conta pra continuar analisando.</p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
          </div>

          {error && <p className="text-danger text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent text-white px-6 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <GoogleSignInButton mode="login" onError={setError} />

          <p className="text-center text-sm text-ink-soft">
            Não tem conta?{' '}
            <Link to="/signup" className="text-accent hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
