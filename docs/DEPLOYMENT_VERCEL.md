# 🚀 Guía de Despliegue en Vercel - EcoUrbe AI

Esta guía detalla cómo desplegar el frontend de EcoUrbe AI en Vercel, incluyendo configuración de variables de entorno, optimización y CI/CD.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del Proyecto](#preparación-del-proyecto)
3. [Despliegue en Vercel](#despliegue-en-vercel)
4. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
5. [Configuración Avanzada](#configuración-avanzada)
6. [CI/CD con GitHub](#cicd-con-github)
7. [Monitoreo y Logs](#monitoreo-y-logs)
8. [Troubleshooting](#troubleshooting)
9. [Optimización](#optimización)

---

## ✅ Requisitos Previos

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Repositorio en GitHub (público o privado)
- ✅ Supabase configurado (ver [SETUP_SUPABASE.md](./SETUP_SUPABASE.md))
- ✅ Node.js 18+ instalado localmente

---

## 📦 Preparación del Proyecto

### 1. Verificar Estructura

Asegúrate de que el proyecto tenga esta estructura:

```
UrbanismoVerde/
├── frontend/
│   ├── src/
│   ├── public/
│   │   └── service-worker.js
│   ├── package.json
│   ├── vercel.json
│   ├── .env.example
│   └── .gitignore
└── ...
```

### 2. Build Local

```bash
cd frontend
npm install
npm run build
```

Verifica que no haya errores. El build debe generar una carpeta `dist/`.

### 3. Verificar vercel.json

El archivo raíz `vercel.json` está configurado de forma simplificada para trabajar con Root Directory:

```json
{
  "functions": {
    "api/analyze.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/analyze",
      "destination": "/api/analyze.py"
    }
  ]
}
```

**⚠️ IMPORTANTE**: 
- Este archivo `vercel.json` debe estar en la **raíz del repositorio**, no dentro de `frontend/`
- Al usar esta configuración, debes configurar **Root Directory** a `frontend` en **Project Settings → General → Root Directory** del Vercel Dashboard
- Esto permite que Vercel acceda directamente al directorio frontend sin necesidad de comandos `cd`
- El directorio `api/` (que contiene `analyze.py`) está en la raíz del repositorio, y Vercel lo accede independientemente del Root Directory configurado

---

## 🌐 Despliegue en Vercel

### Opción 1: Desde Vercel Dashboard (Recomendada)

#### 1. Importar Proyecto

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Click en **Import Git Repository**
3. Selecciona tu repositorio: `tecnicfitia-TUTORIAL/UrbanismoVerde`
4. Click en **Import**

#### 2. Configurar Proyecto

**Configure Project:**
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` ⚠️ MUY IMPORTANTE
- **Build Command**: `npm run build` (auto-detectado)
- **Output Directory**: `dist` (auto-detectado)

#### 3. Agregar Variables de Entorno

En la sección **Environment Variables**, agrega:

```
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eHp0ZHBrd2J5dmdncHdxZGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4ODEwMDAsImV4cCI6MjA1NDQ1NzAwMH0.sb_publishable_ixXatFFRmRZNgvBJVflnjg_V7IQTbnU
VITE_API_URL=https://your-backend-api.com
VITE_AI_SERVICE_URL=https://your-ai-service.com
VITE_ENABLE_SERVICE_WORKER=true
```

#### 4. Deploy

Click en **Deploy** y espera a que termine (1-3 minutos).

### Opción 2: Desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy desde carpeta frontend
cd frontend
vercel

# Seguir prompts:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing? No
# - Project name? ecourbe-ai (o el que prefieras)
# - Directory? ./ (ya estás en frontend)
# - Override settings? No
```

---

## ⚙️ Configurar Variables de Entorno

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase | `eyJhbGc...` |
| `VITE_API_URL` | URL del backend (opcional) | `https://api.ecourbe.com` |
| `VITE_AI_SERVICE_URL` | URL del servicio IA (opcional) | `https://ai.ecourbe.com` |

### Agregar/Editar Variables

#### Desde Dashboard:

1. Ve a tu proyecto en Vercel
2. **Settings** > **Environment Variables**
3. Click **Add New**
4. Agrega cada variable con su valor
5. Selecciona environments: Production, Preview, Development
6. Click **Save**

#### Desde CLI:

```bash
# Agregar variable
vercel env add VITE_SUPABASE_URL production

# Listar variables
vercel env ls

# Pull variables a .env.local
vercel env pull
```

### Variables por Entorno

```bash
# Production
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co

# Preview (branches)
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co

# Development (vercel dev)
VITE_SUPABASE_URL=http://localhost:54321
```

---

## 🔧 Configuración Avanzada

### Custom Domain

#### 1. Agregar Dominio

1. **Settings** > **Domains**
2. Click **Add**
3. Ingresa tu dominio: `ecourbe.com`
4. Configura DNS según instrucciones:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 2. SSL Automático

Vercel genera certificado SSL automáticamente (puede tardar hasta 24h).

### Redirects

Agregar en `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### Headers de Seguridad

Ya incluidos en `vercel.json`, pero puedes agregar más:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 🔄 CI/CD con GitHub

### Auto-Deploy en Push

Vercel automáticamente despliega cuando:
- ✅ Push a rama `main` → Production
- ✅ Push a otras ramas → Preview
- ✅ Pull Requests → Preview único

### Configurar Branch Protection

1. GitHub repo > **Settings** > **Branches**
2. Add rule para `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks (Vercel)
   - ✅ Include administrators

### Deploy Hooks

Para desplegar desde externos (CI, webhooks):

1. **Settings** > **Git** > **Deploy Hooks**
2. Create Hook para tu branch
3. Usa el URL en tu pipeline:

```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/xxx
```

---

## 📊 Monitoreo y Logs

### Ver Logs de Deploy

```bash
# Desde CLI
vercel logs <deployment-url>

# En tiempo real
vercel logs --follow
```

### Dashboard Analytics

1. **Analytics** tab en tu proyecto
2. Ver:
   - Page views
   - Top pages
   - Visitors
   - Performance

### Integración con Sentry (Opcional)

```bash
npm install @sentry/react @sentry/vite-plugin
```

Configurar en `vite.config.ts`:

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "ecourbe-ai"
    })
  ]
});
```

---

## 🔧 Troubleshooting

### Error: "Build failed"

**Revisar logs**:
```bash
vercel logs <deployment-url> | grep ERROR
```

**Causas comunes**:
- Dependencias faltantes
- TypeScript errors
- Variables de entorno no configuradas

**Solución**:
```bash
# Limpiar caché
vercel build --force

# Verificar localmente
npm run build
```

### Error: "404 on refresh"

**Causa**: Falta configuración de rewrites.

**Solución**: Verifica que `vercel.json` tenga:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Error: "Service Worker not working"

**Causa**: Headers incorrectos.

**Solución**: Agrega en `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

### Error: "CORS blocked"

**Causa**: Backend no acepta requests de Vercel.

**Solución**: Configura CORS en backend:
```javascript
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000'
  ]
}));
```

### Supabase RLS issues

**Causa**: URL de Supabase incorrecta o anon key inválida.

**Solución**:
1. Verifica variables en Vercel Dashboard
2. Confirma valores en Supabase Dashboard > Settings > API
3. Redeploy después de cambiar variables

---

## ⚡ Optimización

### 1. Code Splitting

Ya habilitado con Vite, pero puedes optimizar más:

```typescript
// Lazy load components
const MapComponent = lazy(() => import('./components/Map'));
```

### 2. Image Optimization

```bash
npm install sharp
```

Usa `<Image>` de Vercel (si aplica).

### 3. Bundle Size

```bash
# Analizar bundle
npm install -D rollup-plugin-visualizer

# En vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true })
]
```

### 4. Caching

Ya configurado en `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 5. Prerender/SSG (Opcional)

Si necesitas páginas estáticas:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html'
      }
    }
  }
});
```

---

## 📈 Performance Checklist

- ✅ Lighthouse score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Bundle size < 200KB (gzipped)
- ✅ Images optimized (WebP, lazy load)
- ✅ Service Worker caching
- ✅ No console errors

---

## 🔐 Security Checklist

- ✅ HTTPS habilitado (automático)
- ✅ Environment variables seguras
- ✅ No secrets en código
- ✅ Headers de seguridad
- ✅ CSP configurado
- ✅ Dependencies actualizadas

---

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/quickstarts/vercel)

---

## 🆘 Soporte

- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Discord](https://discord.supabase.com)

---

**✅ ¡Deployment completado!** Tu aplicación está en producción.

**URL de ejemplo**: `https://ecourbe-ai.vercel.app`
