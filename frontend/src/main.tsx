import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { register as registerServiceWorker } from './registerServiceWorker'
import { SyncService } from './services/sync'

// Register Service Worker for offline support
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true') {
  registerServiceWorker();
}

// Start background sync service
SyncService.start();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
