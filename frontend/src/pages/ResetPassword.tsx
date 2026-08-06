import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthValueProp } from '../components/AuthValueProp'
import * as api from '../api/client'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
        <AuthValueProp />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="text-2xl font-semibold tracking-tight text-ink">Link inválido</div>
            <p className="text-sm text-ink-soft">
              Esse link de redefinição de senha está incompleto ou inválido. Solicite um novo.
            </p>
            <Link
              to="/esqueci-senha"
              className="inline-block w-full rounded-full bg-accent text-white px-6 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
      <AuthValueProp />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-5">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <img src="/logo-mark.png" alt="" className="h-7 w-7" />
            <span className="font-semibold tracking-tight text-ink">Ryber</span>
          </div>

          {done ? (
            <div className="text-center space-y-2">
              <div className="text-2xl font-semibold tracking-tight text-ink">Senha redefinida!</div>
              <p className="text-sm text-ink-soft">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="text-2xl font-semibold tracking-tight text-ink">Criar nova senha</div>
                <p className="text-sm text-ink-soft mt-1">Escolha uma nova senha para sua conta.</p>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
                />
              </div>

              {error && <p className="text-danger text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-accent text-white px-6 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
