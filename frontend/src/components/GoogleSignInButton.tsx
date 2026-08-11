import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface GoogleCredentialResponse {
  credential: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

// Só renderiza se VITE_GOOGLE_CLIENT_ID estiver configurado — sem isso, some do
// formulário em vez de mostrar um botão quebrado.
interface Props {
  mode: 'signup' | 'login'
  onError: (message: string) => void
  // Só é relevante pra mode="signup" (login nunca cria conta, então nunca depende
  // disso) — controla se o clique cria a conta ou é bloqueado com um aviso.
  termsAccepted?: boolean
}

export function GoogleSignInButton({ mode, onError, termsAccepted = true }: Props) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  // O callback do Google só é registrado uma vez no mount — sem o ref, ele ficaria
  // preso no valor de termsAccepted daquele instante inicial, ignorando o checkbox.
  const termsAcceptedRef = useRef(termsAccepted)
  useEffect(() => {
    termsAcceptedRef.current = termsAccepted
  }, [termsAccepted])

  useEffect(() => {
    if (!CLIENT_ID) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      if (!window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          if (mode === 'signup' && !termsAcceptedRef.current) {
            onError('Marque que você aceita os Termos de Uso e a Política de Privacidade antes de continuar.')
            return
          }
          try {
            await loginWithGoogle(response.credential, mode === 'signup', termsAcceptedRef.current)
            navigate(mode === 'signup' ? '/welcome' : '/app')
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Não foi possível entrar com o Google.')
          }
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: 'continue_with',
        locale: 'pt-BR',
      })
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!CLIENT_ID) return null

  const blocked = mode === 'signup' && !termsAccepted

  function handleBlockedClick() {
    onError('Marque que você aceita os Termos de Uso e a Política de Privacidade para continuar com o Google.')
    const checkbox = document.getElementById('terms-checkbox')
    checkbox?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    checkbox?.focus()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] text-ink-faint uppercase tracking-wide">ou</span>
        <div className="h-px flex-1 bg-line" />
      </div>
      <div className="relative flex justify-center">
        <div ref={containerRef} className={blocked ? 'opacity-50 pointer-events-none' : ''} />
        {/* O botão do Google é um iframe renderizado pelo SDK deles — não dá pra
            interceptar clique nele diretamente. Essa camada transparente por cima
            captura o clique quando os termos não foram aceitos, em vez de deixar o
            clique simplesmente não fazer nada (pointer-events-none sozinho). */}
        {blocked && (
          <button
            type="button"
            onClick={handleBlockedClick}
            aria-label="Marque que você aceita os Termos de Uso e a Política de Privacidade antes de continuar com o Google"
            className="absolute inset-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  )
}
