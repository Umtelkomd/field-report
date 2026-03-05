import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'

// Auto-reload when a new SW version is available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
