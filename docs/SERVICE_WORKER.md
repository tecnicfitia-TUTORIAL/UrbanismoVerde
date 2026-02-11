# 🔧 Service Worker - Troubleshooting

## Problemas Comunes

### Error: InvalidStateError

```
Failed to update a ServiceWorker for scope with script ('Unknown')
```

**Solución:**
1. Abre DevTools (F12)
2. Application → Service Workers
3. Click "Unregister" en todos los SW
4. Recarga la página (Ctrl+Shift+R)

### Service Worker no actualiza

**Solución en código:**
```typescript
// En consola del navegador (solo desarrollo):
window.__SW__.unregisterAll()
window.location.reload()
```

**Solución manual:**
1. DevTools → Application → Storage
2. Click "Clear site data"
3. Recargar página

## Testing

### Verificar registro correcto

```javascript
// En consola:
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Registrados:', regs.length))
```

### Forzar actualización

```javascript
// En consola:
window.__SW__.forceUpdate()
```

## Desarrollo

Service Worker está **DESACTIVADO** en modo desarrollo para evitar:
- Conflictos con HMR (Hot Module Replacement)
- Caché de archivos durante desarrollo
- Debugging complicado

Para habilitarlo en desarrollo:
```bash
VITE_ENABLE_SERVICE_WORKER=true npm run dev
```

## Producción

En producción el Service Worker:
- ✅ Se registra automáticamente
- ✅ Cachea assets para offline
- ✅ Sincroniza datos en background
- ✅ Se actualiza automáticamente
