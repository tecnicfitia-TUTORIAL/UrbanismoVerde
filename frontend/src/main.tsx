import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { register as registerServiceWorker } from './registerServiceWorker'
import { SyncService } from './services/sync'

// Inicializar app
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register Service Worker DESPUÉS de renderizar
// Solo en producción (no en desarrollo para evitar problemas con HMR)
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true') {
  // Esperar a que la página esté completamente cargada
  window.addEventListener('load', () => {
    registerServiceWorker()
      .then(() => {
        console.log('✅ App inicializada con Service Worker')
      })
      .catch((error) => {
        console.warn('⚠️ App inicializada sin Service Worker:', error)
      })
  })
} else {
  console.log('ℹ️ Service Worker desactivado en desarrollo')
}

// Start background sync service
// Solo en producción o si hay conexión a backend
if (import.meta.env.PROD || import.meta.env.VITE_API_URL) {
  SyncService.start()
} else {
  console.log('ℹ️ Sync service desactivado en desarrollo')
}
