/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline support and background sync.
 * Includes error handling and cleanup of old service workers.
 */

// Configuration constants
const SW_UPDATE_CHECK_INTERVAL = 60000; // 1 minute

export function register(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Desregistrar SWs antiguos primero para evitar conflictos
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Registrar nuevo SW
        const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
          updateViaCache: 'none'  // Evitar caché del SW
        });

        console.log('✅ Service Worker registered successfully:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, SW_UPDATE_CHECK_INTERVAL);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, reload to update');
                
                // Optionally notify user about update
                if (window.confirm('Nueva versión disponible. ¿Desea actualizar?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
        // No hacer nada crítico si falla - la app sigue funcionando
      }
    });
  } else {
    console.log('Service Worker not supported in this browser');
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
}
