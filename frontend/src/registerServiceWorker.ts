/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline support and background sync.
 * Includes robust error handling and prevents duplicate registrations.
 */

let isRegistering = false;

/**
 * Registra Service Worker con manejo robusto de errores
 */
export async function register(): Promise<ServiceWorkerRegistration | null> {
  // Solo en producción o si está explícitamente habilitado
  if (!('serviceWorker' in navigator)) {
    console.log('ℹ️ Service Worker no soportado en este navegador');
    return null;
  }

  // Evitar registros múltiples simultáneos
  if (isRegistering) {
    console.log('⏳ Registro de Service Worker ya en progreso...');
    return null;
  }

  try {
    isRegistering = true;

    // Verificar si ya hay un SW activo
    const existingRegistration = await navigator.serviceWorker.getRegistration('/');
    
    if (existingRegistration) {
      console.log('✅ Service Worker ya registrado:', existingRegistration);
      
      // Intentar actualizar si hay nueva versión
      try {
        await existingRegistration.update();
        console.log('🔄 Service Worker actualizado');
      } catch (updateError) {
        console.warn('⚠️ No se pudo actualizar Service Worker:', updateError);
        // No hacer nada crítico - el SW existente sigue funcionando
      }
      
      return existingRegistration;
    }

    // Registrar nuevo Service Worker
    console.log('🔧 Registrando nuevo Service Worker...');
    
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none' // Evitar caché del archivo SW
    });

    console.log('✅ Service Worker registered successfully:', registration);

    // Manejar actualizaciones
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        console.log('🆕 Nueva versión de Service Worker encontrada');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ Nueva versión lista - considera recargar');
            // Opcionalmente mostrar notificación al usuario
            showUpdateNotification();
          }
        });
      }
    });

    return registration;

  } catch (error: any) {
    // Manejar errores específicos
    if (error.name === 'SecurityError') {
      console.warn('🔒 Service Worker bloqueado por política de seguridad');
    } else if (error.name === 'InvalidStateError') {
      console.warn('⚠️ Service Worker en estado inválido - limpiando...');
      // Intentar limpiar y re-registrar
      await unregisterAll();
    } else {
      console.error('❌ Error registrando Service Worker:', error);
    }
    
    // No lanzar error - la app debe seguir funcionando
    return null;

  } finally {
    isRegistering = false;
  }
}

/**
 * Desregistra todos los Service Workers (útil para desarrollo/debugging)
 */
export async function unregisterAll(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      const success = await registration.unregister();
      if (success) {
        console.log('🧹 Service Worker desregistrado:', registration.scope);
      }
    }
    
    console.log('✅ Todos los Service Workers desregistrados');
  } catch (error) {
    console.error('❌ Error desregistrando Service Workers:', error);
  }
}

/**
 * Muestra notificación de actualización disponible
 */
function showUpdateNotification(): void {
  // Solo si el usuario está activo en la página
  if (document.visibilityState === 'visible') {
    const shouldReload = confirm(
      '🆕 Nueva versión disponible\n\n¿Recargar para actualizar?'
    );
    
    if (shouldReload) {
      window.location.reload();
    }
  }
}

/**
 * Fuerza actualización del Service Worker
 */
export async function forceUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    
    if (registration) {
      await registration.update();
      console.log('🔄 Service Worker actualización forzada');
    }
  } catch (error) {
    console.error('❌ Error forzando actualización:', error);
  }
}

// Exportar para debugging en consola del navegador
if (import.meta.env.DEV) {
  (window as any).__SW__ = {
    register,
    unregisterAll,
    forceUpdate
  };
  console.log('🛠️ Service Worker utils disponibles en window.__SW__');
}
