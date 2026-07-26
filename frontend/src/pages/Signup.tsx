import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { useAuth } from '../context/AuthContext'

export function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup(email, password, inviteCode)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl border border-line bg-panel p-8 shadow-elevated space-y-5"
        >
          <div className="text-2xl font-medium text-center">Criar conta</div>
          <div className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha (mín. 8 caracteres)"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
            <input
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Código de convite"
              className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent text-white px-6 py-3 font-medium shadow-card disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
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
