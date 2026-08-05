import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BENEFITS = [
  'Leitura completa do criativo',
  'Benchmark do nicho',
  'Público identificado',
  'Emoções transmitidas',
  'Posicionamento',
  'Riscos encontrados',
  'Plano de edição cena a cena',
  'Performance prevista',
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent shrink-0">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
      {/* Coluna esquerda — proposta de valor */}
      <div className="relative hidden lg:flex flex-col justify-center px-16 py-16 overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-soft blur-[100px] pointer-events-none" />
        <div className="relative max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12 w-fit">
            <img src="/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="font-semibold tracking-tight text-lg text-ink">Ryber</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight mb-5 text-ink leading-tight">
            Descubra como a IA das plataformas de anúncio interpreta seu criativo — e como seu público
            realmente reage a ele.
          </h1>
          <p className="text-ink-soft text-base leading-relaxed mb-10">
            Relatórios completos de performance, público, posicionamento e risco, prontos antes de você
            investir um real em mídia.
          </p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-ink-soft">
                <CheckIcon />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coluna direita — formulário */}
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
