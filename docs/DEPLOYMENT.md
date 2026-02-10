# 🚀 Guía de Despliegue - EcoUrbe AI

Esta guía cubre el despliegue completo de EcoUrbe AI en producción.

---

## 📋 Requisitos Previos

### Cuentas Necesarias
- [x] GitHub account (para CI/CD)
- [x] Vercel account (para Frontend) - ✅ **Ya configurado**
- [x] Supabase/Neon account (para PostgreSQL + PostGIS)
- [x] Railway/Render account (para Backend y AI Service)
- [x] Google Cloud account (para Earth Engine API) - _Opcional_

### Herramientas Locales
- Docker Desktop (para testing local)
- Git
- Node.js ≥ 18
- Python ≥ 3.10

---

## 🗄️ Paso 1: Desplegar Base de Datos

### Opción A: Supabase (Recomendado)

1. **Crear Proyecto**
   - Ve a [supabase.com](https://supabase.com)
   - Click en "New Project"
   - Nombre: `ecourbe-db`
   - Región: Elige la más cercana
   - Password: Guarda en lugar seguro

2. **Habilitar PostGIS**
   ```sql
   -- En SQL Editor de Supabase
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

3. **Ejecutar Schema**
   - Copia el contenido de `database/schema.sql`
   - Pégalo en SQL Editor
   - Ejecuta (puede tardar 30-60 segundos)

4. **Obtener Connection String**
   - Ve a Settings > Database
   - Copia la Connection String (modo `Transaction`)
   - Ejemplo: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### Opción B: Neon (Alternativa)

1. **Crear Proyecto**
   - Ve a [neon.tech](https://neon.tech)
   - New Project > Name: `ecourbe`

2. **Habilitar PostGIS**
   ```sql
   CREATE EXTENSION postgis;
   CREATE EXTENSION "uuid-ossp";
   CREATE EXTENSION pg_trgm;
   ```

3. **Ejecutar schema.sql** igual que en Supabase

### Opción C: Railway

1. New Project > Add PostgreSQL
2. Enable PostGIS extension
3. Run schema.sql

---

## 🔧 Paso 2: Desplegar Backend (Node.js + Express)

### Opción A: Railway (Recomendado para Node.js)

1. **Conectar Repositorio**
   - Ve a [railway.app](https://railway.app)
   - New Project > Deploy from GitHub repo
   - Selecciona `tecnicfitia-TUTORIAL/UrbanismoVerde`

2. **Configurar Service**
   - Name: `ecourbe-backend`
   - Root Directory: `/backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Variables de Entorno**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]
   REDIS_URL=redis://[RAILWAY_REDIS_URL]
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=[genera_un_secreto_seguro_aqui]
   AI_SERVICE_URL=https://[tu-ai-service-url]
   ```

4. **Generar Domain**
   - Settings > Networking > Generate Domain
   - Guarda la URL (ej: `https://ecourbe-backend-production.up.railway.app`)

### Opción B: Render

1. New Web Service > Connect Repository
2. Root Directory: `backend`
3. Build Command: `npm install; npm run build`
4. Start Command: `npm start`
5. Add Environment Variables (igual que Railway)

### Opción C: Vercel (Serverless)

1. Import Project > Select `backend` folder
2. Framework Preset: Other
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`
6. Add Environment Variables

---

## 🤖 Paso 3: Desplegar AI Service (Python + FastAPI)

### Opción A: Railway

1. **New Service from Repo**
   - Root Directory: `/ai-service`
   - Build Command: _Auto-detected_
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Variables de Entorno**
   ```env
   PYTHONUNBUFFERED=1
   DATABASE_URL=postgresql://[...]
   PORT=8000
   ```

3. **Generate Domain**
   - Guarda la URL (ej: `https://ecourbe-ai-production.up.railway.app`)

### Opción B: Render

1. New Web Service > Python
2. Root Directory: `ai-service`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 🎨 Paso 4: Configurar Frontend (Vercel)

### ✅ Ya Desplegado en Vercel

Tu frontend ya está en Vercel. Solo necesitas **actualizar variables de entorno**:

1. **Ve a tu proyecto en Vercel**
   - Dashboard > Tu Proyecto > Settings > Environment Variables

2. **Actualiza las Variables**
   ```env
   VITE_API_URL=https://[TU-BACKEND-URL]
   VITE_AI_SERVICE_URL=https://[TU-AI-SERVICE-URL]
   ```

3. **Redeploy**
   - Deployments > Latest > Redeploy

---

## ⚙️ Variables de Entorno - Resumen

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NODE_ENV=production
PORT=4000
JWT_SECRET=your-256-bit-secret-key
AI_SERVICE_URL=https://ai-service-url.com
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_AI_SERVICE_URL=https://your-ai-service-url.railway.app
```

### AI Service
```env
PYTHONUNBUFFERED=1
DATABASE_URL=postgresql://user:pass@host:5432/db
PORT=8000
```

---

## 📊 Paso 5: Monitoreo y Logs

### Vercel
- Dashboard > Logs (real-time)
- Runtime Logs para errores

### Railway
- Service > Deployments > View Logs
- Metrics tab para CPU/Memory

### Render
- Dashboard > Logs
- Metrics disponibles

### Sentry (Opcional pero Recomendado)
```bash
npm install @sentry/node @sentry/react
```

Configurar `SENTRY_DSN` en variables de entorno.

---

## 🧪 Paso 6: Verificación Post-Deploy

### Checklist de Verificación

#### Frontend ✅
- [ ] URL principal carga sin errores
- [ ] Mapa de Leaflet se renderiza
- [ ] Capas base (OSM, Satellite, Topo) funcionan
- [ ] Dibujo de polígonos funciona
- [ ] Modal form se abre correctamente
- [ ] No hay errores en consola del navegador

#### Backend
- [ ] `GET /health` retorna 200
  ```bash
  curl https://[backend-url]/health
  ```
- [ ] `GET /` retorna info de API
- [ ] Conexión a base de datos OK (check logs)

#### AI Service
- [ ] `GET /health` retorna 200
- [ ] `GET /docs` muestra Swagger UI
  ```bash
  curl https://[ai-service-url]/docs
  ```
- [ ] `POST /analyze` funciona con datos de prueba

#### Base de Datos
- [ ] Conexión desde backend exitosa
- [ ] Tablas creadas (10 tablas)
- [ ] Extensiones habilitadas (PostGIS, uuid-ossp, pg_trgm)
- [ ] Seed data insertado (usuario admin, 3 especies)

---

## 🔧 Troubleshooting Común

### Error: "Cannot connect to database"
**Solución:**
- Verifica `DATABASE_URL` en variables de entorno
- Asegúrate de que la IP de tu servicio está en allowlist (Supabase/Neon)
- Check logs para ver el error exacto

### Error: "Module not found"
**Solución:**
```bash
# Reinstalar dependencias
npm install
# O en Python
pip install -r requirements.txt
```

### Error: "CORS policy blocked"
**Solución:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000'
  ]
}));
```

### Frontend muestra "404 Not Found"
**Solución:**
- Verifica `frontend/vercel.json` tiene rewrites configurados:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Docker build falla en AI Service
**Solución:**
- ✅ Ya resuelto: Actualizar Dockerfile con `libgl1` en lugar de `libgl1-mesa-glx`

---

## 📈 Escalabilidad y Optimización

### Caching
- Implementar Redis en Railway
- Cache de consultas frecuentes
- TTL de 5 minutos para datos estáticos

### CDN
- Vercel incluye CDN global para frontend
- Para assets del backend: Usar Cloudflare

### Load Balancing
- Railway Pro plan: Auto-scaling
- Render: Horizontal scaling disponible

### Database Optimization
- Índices en consultas frecuentes (ya implementado)
- Connection pooling (Prisma default)
- Read replicas para queries pesados (Neon feature)

---

## 🔐 Seguridad en Producción

### Checklist
- [ ] JWT_SECRET es una cadena aleatoria de 256 bits
- [ ] CORS configurado solo para dominios permitidos
- [ ] Rate limiting implementado (express-rate-limit)
- [ ] HTTPS habilitado en todos los endpoints
- [ ] Variables de entorno no hardcodeadas
- [ ] Dependencias actualizadas (npm audit)
- [ ] SQL injection protegido (Prisma ORM)
- [ ] XSS protegido (escape de inputs)

### Rate Limiting
```typescript
// backend/src/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});

app.use('/api/', limiter);
```

---

## 📞 Soporte y Recursos

### Documentación Oficial
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)

### Comunidad
- GitHub Issues: Reportar bugs
- GitHub Discussions: Preguntas generales

---

## ✅ Checklist Final de Deployment

### Pre-Deployment
- [ ] Código en rama `main` actualizado
- [ ] Tests pasando localmente
- [ ] Variables de entorno documentadas
- [ ] Secrets generados y guardados de forma segura

### Deployment
- [ ] Base de datos desplegada y schema ejecutado
- [ ] Backend desplegado y health check OK
- [ ] AI Service desplegado y docs accesibles
- [ ] Frontend actualizado con URLs de producción
- [ ] CORS configurado correctamente

### Post-Deployment
- [ ] Smoke tests ejecutados
- [ ] Monitoreo configurado (logs, métricas)
- [ ] Backups de base de datos configurados
- [ ] Dominio personalizado configurado (opcional)
- [ ] SSL/HTTPS verificado en todos los endpoints

---

**Última actualización**: 2026-02-10  
**Versión**: 1.0.0  
**Mantenedor**: @tecnicfitia-TUTORIAL

**Estado**: 🟢 Frontend desplegado | 🟡 Backend y DB pendientes
