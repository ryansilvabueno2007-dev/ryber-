import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthValueProp } from '../components/AuthValueProp'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'

export function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
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
            <div className="text-2xl font-semibold tracking-tight text-ink">Criar conta</div>
            <p className="text-sm text-ink-soft mt-1">Comece a analisar seus criativos em minutos.</p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha (mín. 8 caracteres)"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar senha"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
          </div>

          {error && <p className="text-danger text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent text-white px-6 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>

          <GoogleSignInButton mode="signup" onError={setError} />

          <div className="text-center space-y-1">
            <p className="text-xs text-ink-soft">
              Sua conta começa com <span className="text-ink font-medium">1 análise gratuita</span>. Nenhum
              cartão é necessário.
            </p>
            <p className="text-xs text-ink-faint">
              Depois da análise grátis, é só assinar um plano para continuar usando a plataforma.
            </p>
          </div>

          <p className="text-center text-sm text-ink-soft">
            Já tem conta?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
