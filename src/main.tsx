import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'

// Auto-reload when a new SW version is available
registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
  onOfflineReady() {},
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
