import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthValueProp } from '../components/AuthValueProp'
import * as api from '../api/client'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.')
    } finally {
      setLoading(false)
    }
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

          {sent ? (
            <>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-ink">Verifique seu e-mail</div>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                  Se houver uma conta com o e-mail <strong className="text-ink">{email}</strong>, enviamos um
                  link para redefinir sua senha. Ele expira em 1 hora.
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center w-full rounded-full border border-line px-6 py-3.5 font-medium text-ink hover:bg-panel transition-colors"
              >
                Voltar para o login
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="text-2xl font-semibold tracking-tight text-ink">Esqueceu sua senha?</div>
                <p className="text-sm text-ink-soft mt-1">
                  Informe seu e-mail e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
              />

              {error && <p className="text-danger text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-accent text-white px-6 py-3.5 font-medium shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>

              <p className="text-center text-sm text-ink-soft">
                Lembrou a senha?{' '}
                <Link to="/login" className="text-accent hover:underline">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
