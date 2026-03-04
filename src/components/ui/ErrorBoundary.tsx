import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-lg font-bold text-gray-800">Algo salió mal</h1>
          <p className="text-sm text-gray-500">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
