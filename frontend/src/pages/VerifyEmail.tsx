import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/client'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Link inválido.')
      return
    }
    api
      .verifyEmail(token)
      .then(() => {
        setStatus('done')
        refreshUser().catch(() => {})
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-4">
          {status === 'loading' && <p className="text-ink-soft">Confirmando seu e-mail...</p>}

          {status === 'done' && (
            <>
              <div className="text-2xl font-semibold tracking-tight text-ink">E-mail confirmado!</div>
              <p className="text-ink-soft">Sua conta está com o e-mail verificado. Pode continuar por aqui.</p>
              <Link
                to="/app"
                className="inline-block rounded-full bg-accent text-white px-6 py-3 font-medium shadow-glow hover:bg-accent-strong transition-colors"
              >
                Ir para o dashboard
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-2xl font-semibold tracking-tight text-ink">Não foi possível confirmar</div>
              <p className="text-ink-soft">{error}</p>
              <Link to="/app" className="text-accent hover:underline">
                Voltar para o dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
