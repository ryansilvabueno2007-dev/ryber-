import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Ryber crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full flex items-center justify-center px-6 py-20">
          <div className="max-w-md text-center space-y-3">
            <div className="text-2xl font-medium">Algo deu errado nesta tela</div>
            <p className="text-ink-soft text-sm">Tente voltar para o início e repetir a ação.</p>
            <button
              onClick={() => (window.location.href = '/')}
              className="mt-4 rounded-full bg-accent text-white px-5 py-2.5 text-sm font-medium"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
