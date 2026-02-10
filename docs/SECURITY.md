# 🔐 Guía de Seguridad - EcoUrbe AI

Esta guía detalla las medidas de seguridad implementadas en EcoUrbe AI y las mejores prácticas para mantener la aplicación segura.

## 📋 Tabla de Contenidos

1. [Arquitectura de Seguridad](#arquitectura-de-seguridad)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [Autenticación y Autorización](#autenticación-y-autorización)
4. [Seguridad de Variables de Entorno](#seguridad-de-variables-de-entorno)
5. [Seguridad Frontend](#seguridad-frontend)
6. [Seguridad Backend](#seguridad-backend)
7. [Seguridad de Datos](#seguridad-de-datos)
8. [Auditoría y Monitoreo](#auditoría-y-monitoreo)
9. [Incident Response](#incident-response)
10. [Compliance](#compliance)

---

## 🏗️ Arquitectura de Seguridad

### Principios de Seguridad

1. **Defense in Depth**: Múltiples capas de seguridad
2. **Least Privilege**: Permisos mínimos necesarios
3. **Zero Trust**: Verificar siempre, nunca confiar
4. **Encryption**: Datos cifrados en tránsito y reposo

### Componentes de Seguridad

```
┌─────────────────────────────────────────┐
│           USER/CLIENT                   │
│  (HTTPS, Service Worker, CSP)           │
└────────────────┬────────────────────────┘
                 │ TLS 1.3
┌────────────────▼────────────────────────┐
│         VERCEL CDN/EDGE                 │
│  (DDoS Protection, WAF)                 │
└────────────────┬────────────────────────┘
                 │ Authenticated Requests
┌────────────────▼────────────────────────┐
│         SUPABASE                        │
│  (RLS, JWT Auth, Rate Limiting)         │
└────────────────┬────────────────────────┘
                 │ Encrypted
┌────────────────▼────────────────────────┐
│       POSTGRESQL + PostGIS              │
│  (Encrypted at Rest)                    │
└─────────────────────────────────────────┘
```

---

## 🛡️ Row Level Security (RLS)

### ¿Qué es RLS?

Row Level Security permite control granular de acceso a nivel de fila en PostgreSQL. Cada query se filtra automáticamente según las políticas definidas.

### Políticas Implementadas

#### 1. Zonas Verdes

```sql
-- Lectura pública
CREATE POLICY "Zonas verdes are viewable by everyone"
  ON zonas_verdes FOR SELECT
  USING (true);

-- Solo el creador puede eliminar
CREATE POLICY "Users can delete their own zonas verdes"
  ON zonas_verdes FOR DELETE
  USING (auth.uid() = user_id);
```

**Explicación**:
- ✅ Cualquiera puede ver zonas verdes (datos públicos)
- ✅ Solo usuarios autenticados pueden crear
- ✅ Solo el propietario puede eliminar

#### 2. Análisis

```sql
-- Usuarios autenticados pueden insertar
CREATE POLICY "Authenticated users can insert analisis"
  ON analisis FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

**Explicación**:
- ✅ Previene inserciones no autenticadas
- ✅ Protege integridad de datos

### Verificar RLS

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Ver políticas activas
SELECT * FROM pg_policies;
```

### Testing RLS

```sql
-- Simular usuario anónimo
SET ROLE anon;

-- Intentar insertar (debe fallar)
INSERT INTO zonas_verdes VALUES (...);

-- Volver a rol admin
RESET ROLE;
```

---

## 🔑 Autenticación y Autorización

### Niveles de Acceso

| Rol | Permisos | Uso |
|-----|----------|-----|
| **Anonymous** | Solo lectura | Visitantes no registrados |
| **Authenticated** | Lectura + Escritura | Usuarios registrados |
| **Service Role** | Admin completo | Backend services only |

### JWT Tokens

Supabase usa JWT para autenticación:

```typescript
// Token incluye:
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "authenticated",
  "exp": 1234567890
}
```

**Seguridad de Tokens**:
- ✅ Firma con HS256
- ✅ Expira en 1 hora (configurable)
- ✅ Refresh token rotación
- ✅ Almacenado en localStorage (con Service Worker)

### Implementar Autenticación

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});

// Logout
await supabase.auth.signOut();

// Verificar sesión
const { data: { user } } = await supabase.auth.getUser();
```

### Proteger Rutas

```typescript
// En React Router
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

## 🔐 Seguridad de Variables de Entorno

### Variables Públicas vs Privadas

#### ✅ Públicas (VITE_*)

Pueden exponerse en frontend:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ Nunca incluir**:
- Service role keys
- Secrets de API privadas
- Passwords
- Private keys

#### ❌ Privadas (Backend only)

Solo en backend/server:
```env
SUPABASE_SERVICE_ROLE_KEY=xxx  # NUNCA en frontend
DATABASE_PASSWORD=xxx
JWT_SECRET=xxx
```

### Almacenamiento Seguro

#### En Desarrollo

```bash
# .env (ignorado por git)
VITE_SUPABASE_URL=xxx

# .env.example (commited)
VITE_SUPABASE_URL=your_url_here
```

#### En Producción (Vercel)

1. **Settings** > **Environment Variables**
2. Nunca en código
3. Específicas por entorno (prod/preview/dev)

### Rotación de Keys

```bash
# Cada 90 días:
1. Generar nueva key en Supabase
2. Actualizar en Vercel
3. Deploy
4. Revocar key antigua
```

---

## 🌐 Seguridad Frontend

### Content Security Policy (CSP)

```typescript
// En vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;"
        }
      ]
    }
  ]
}
```

### XSS Prevention

```typescript
// ✅ Bueno: React escapa automáticamente
<div>{userInput}</div>

// ❌ Peligroso: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Sanitizar si es necesario
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

### CSRF Protection

Supabase incluye protección CSRF automática en tokens JWT.

```typescript
// Token incluye:
// - Timestamp
// - User ID
// - Signature
```

### Secure Storage

```typescript
// ✅ Bueno: IndexedDB para datos sensibles
await CacheService.set('user_data', userData);

// ❌ Malo: localStorage para tokens grandes
localStorage.setItem('token', longToken);

// ✅ Usar Service Worker para offline
// Ya implementado en registerServiceWorker.ts
```

---

## 🔒 Seguridad Backend

### API Rate Limiting

```typescript
// En backend
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Input Validation

```typescript
// Validar entrada
import { z } from 'zod';

const ZonaVerdeSchema = z.object({
  nombre: z.string().min(3).max(255),
  area_m2: z.number().positive(),
  coordenadas: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()])))
  })
});

// Uso
const validated = ZonaVerdeSchema.parse(requestBody);
```

### SQL Injection Prevention

```typescript
// ✅ Bueno: Supabase parameteriza queries
const { data } = await supabase
  .from('zonas_verdes')
  .select('*')
  .eq('nombre', userInput);

// ❌ Peligroso: SQL crudo
const query = `SELECT * FROM zonas_verdes WHERE nombre = '${userInput}'`;
```

---

## 💾 Seguridad de Datos

### Encriptación

#### En Tránsito
- ✅ TLS 1.3 en todas las conexiones
- ✅ HTTPS obligatorio en producción
- ✅ Certificate pinning (opcional)

#### En Reposo
- ✅ Supabase encripta datos en disco
- ✅ PostgreSQL encryption at rest
- ✅ Backups encriptados

### Datos Sensibles

```typescript
// ✅ Nunca almacenar:
// - Passwords sin hash
// - Tarjetas de crédito completas
// - Datos personales sin consentimiento

// ✅ Hash de passwords (en backend)
import bcrypt from 'bcrypt';
const hashed = await bcrypt.hash(password, 10);

// ✅ Tokenización de datos sensibles
const token = crypto.randomUUID();
```

### Backups

```sql
-- Supabase hace backups automáticos
-- Retention: 7 días (Free), 30 días (Pro)

-- Verificar backups
SELECT * FROM pg_stat_database;
```

### GDPR Compliance

```typescript
// Derecho al olvido
async function deleteUserData(userId: string) {
  // Eliminar datos del usuario
  await supabase.from('zonas_verdes').delete().eq('user_id', userId);
  await supabase.from('analisis').delete().eq('user_id', userId);
  
  // Log de eliminación (auditoría)
  console.log(`User ${userId} data deleted at ${new Date()}`);
}

// Exportar datos del usuario
async function exportUserData(userId: string) {
  const { data } = await supabase
    .from('zonas_verdes')
    .select('*')
    .eq('user_id', userId);
  
  return JSON.stringify(data, null, 2);
}
```

---

## 📊 Auditoría y Monitoreo

### Logging

```typescript
// Estructura de logs
interface AuditLog {
  timestamp: Date;
  user_id: string;
  action: string;
  resource: string;
  ip_address: string;
  success: boolean;
}

// Ejemplo
console.log({
  timestamp: new Date(),
  user_id: user.id,
  action: 'CREATE',
  resource: 'zona_verde',
  success: true
});
```

### Monitoreo de Seguridad

```bash
# Supabase Dashboard > Auth > Events
# - Login attempts
# - Failed authentications
# - Password resets
# - Email verifications

# Vercel Analytics
# - Error rates
# - Response times
# - Geographic distribution
```

### Alertas

```typescript
// Configurar alertas en Supabase
// Settings > Database > Webhooks

// Ejemplo: alerta de múltiples logins fallidos
CREATE FUNCTION notify_failed_logins()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) 
      FROM auth.audit_log_entries 
      WHERE action = 'login_failed' 
      AND created_at > NOW() - INTERVAL '5 minutes') > 5 
  THEN
    -- Enviar alerta
    PERFORM pg_notify('security_alert', 'Multiple failed logins detected');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚨 Incident Response

### Plan de Respuesta

1. **Detección**
   - Monitoreo continuo
   - Alertas automáticas
   - Reportes de usuarios

2. **Contención**
   - Bloquear acceso comprometido
   - Revocar tokens
   - Deshabilitar features afectadas

3. **Investigación**
   - Revisar logs
   - Identificar impacto
   - Documentar hallazgos

4. **Remediación**
   - Aplicar parches
   - Actualizar credenciales
   - Reforzar controles

5. **Post-mortem**
   - Analizar causa raíz
   - Actualizar procedimientos
   - Comunicar a stakeholders

### Contactos de Emergencia

```
Security Team: security@ecourbe.com
Supabase Support: https://supabase.com/support
Vercel Support: https://vercel.com/support
```

---

## ✅ Security Checklist

### Pre-Deploy

- [ ] RLS habilitado en todas las tablas
- [ ] Variables de entorno configuradas
- [ ] Service role key NO en frontend
- [ ] HTTPS habilitado
- [ ] CSP configurado
- [ ] Input validation implementada
- [ ] Rate limiting activo
- [ ] Dependencias actualizadas
- [ ] No secrets en código
- [ ] .env en .gitignore

### Post-Deploy

- [ ] Vulnerability scan (npm audit)
- [ ] Penetration testing
- [ ] Load testing
- [ ] Error monitoring
- [ ] Backup verification
- [ ] Access logs review
- [ ] Performance monitoring

### Mantenimiento Regular

- [ ] Actualizar dependencias (mensual)
- [ ] Rotar credenciales (trimestral)
- [ ] Revisar logs (semanal)
- [ ] Security audit (anual)
- [ ] Backup restore test (semestral)

---

## 🛠️ Herramientas de Seguridad

### Análisis de Vulnerabilidades

```bash
# npm audit
npm audit

# npm audit fix
npm audit fix

# Snyk
npx snyk test
```

### OWASP Top 10 Coverage

| Riesgo | Mitigación |
|--------|------------|
| A01 - Broken Access Control | ✅ RLS + JWT |
| A02 - Cryptographic Failures | ✅ TLS 1.3 + Encryption |
| A03 - Injection | ✅ Parameterized queries |
| A04 - Insecure Design | ✅ Security by design |
| A05 - Security Misconfiguration | ✅ Hardened config |
| A06 - Vulnerable Components | ✅ Automated updates |
| A07 - Auth/AuthZ Failures | ✅ Supabase Auth + RLS |
| A08 - Data Integrity | ✅ Validation + Signing |
| A09 - Logging Failures | ✅ Comprehensive logging |
| A10 - SSRF | ✅ Input validation |

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/docs/security)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## 🆘 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Envía email a: security@ecourbe.com
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Propuesta de solución (opcional)

Responderemos en 48 horas.

---

**✅ La seguridad es responsabilidad de todos.**

*Última actualización: 2026-02-10*
