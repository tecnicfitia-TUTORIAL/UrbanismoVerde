# 🌱 EcoUrbe AI - Plataforma Inteligente de Regeneración Urbana

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## 🎯 Visión del Proyecto

**EcoUrbe AI** es una plataforma inteligente de regeneración urbana que utiliza Inteligencia Artificial y datos geoespaciales para identificar zonas grises o abandonadas en ciudades (azoteas, solares vacíos) y proponer planes de reforestación urbana de bajo coste.

La plataforma está diseñada para ser escalable a nivel gubernamental, permitiendo a municipios y organizaciones transformar espacios urbanos degradados en pulmones verdes mediante:

- 🛰️ Análisis de imágenes satelitales con Google Earth Engine
- 🤖 Detección automática de zonas candidatas mediante IA
- 🗺️ Visualización geoespacial interactiva
- 📊 Análisis de viabilidad basado en exposición solar y tipo de suelo
- 💰 Estimación de costes y retorno de inversión ambiental

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue el patrón **Clean Architecture** para garantizar:
- ✅ Separación de responsabilidades
- ✅ Testabilidad
- ✅ Mantenibilidad
- ✅ Escalabilidad

### Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│          (React + Tailwind + Leaflet/Google Maps)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│              (Use Cases + Business Logic)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    DOMAIN LAYER                         │
│            (Entities + Business Rules)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                    │
│  (Database + External APIs + AI Models + Repositories)  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18+ con TypeScript
- **Estilos:** Tailwind CSS
- **Mapas:** Leaflet (código abierto) + Google Maps API (opcional)
- **Estado:** React Context API / Redux Toolkit
- **Routing:** React Router v6
- **Base de Datos:** Supabase (PostgreSQL + Auth + Storage)
- **Cache Local:** IndexedDB (idb) para modo offline
- **Service Worker:** Soporte offline completo con sincronización automática

### Backend
- **Runtime:** Node.js 18+ con Express
- **Lenguaje:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Validación:** Zod
- **Autenticación:** JWT + OAuth2

### IA y Datos Geoespaciales
- **Procesamiento IA:** Python FastAPI (microservicio separado)
- **Visión Artificial:** TensorFlow / PyTorch
- **Datos Satelitales:** Google Earth Engine API
- **Análisis Geoespacial:** PostGIS

### Base de Datos
- **Principal:** Supabase (PostgreSQL 15+ con PostGIS)
- **Row Level Security:** Políticas de seguridad a nivel de fila
- **Cache Local:** IndexedDB para soporte offline
- **Sincronización:** Background sync automático
- **Storage:** Supabase Storage para imágenes y archivos

### DevOps
- **Containerización:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting Frontend:** Vercel (con CDN global)
- **Hosting Backend:** Supabase (managed PostgreSQL)
- **Infraestructura:** Serverless-first architecture

---

## 📁 Estructura del Proyecto

```
ecourbe-ai/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── common/          # Componentes genéricos
│   │   │   ├── maps/            # Componentes de mapas
│   │   │   └── layout/          # Layout y navegación
│   │   ├── pages/               # Páginas de la aplicación
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # Llamadas API
│   │   ├── store/               # Estado global
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utilidades
│   ├── public/
│   └── package.json
│
├── backend/                     # API Node.js + Express
│   ├── src/
│   │   ├── domain/              # Entidades y reglas de negocio
│   │   │   ├── entities/        # Modelos del dominio
│   │   │   └── interfaces/      # Contratos
│   │   ├── application/         # Casos de uso
│   │   │   └── use-cases/
│   │   ├── infrastructure/      # Implementaciones concretas
│   │   │   ├── database/        # Prisma + PostgreSQL
│   │   │   ├── repositories/    # Implementación de repos
│   │   │   ├── external-apis/   # Google Earth Engine, etc.
│   │   │   └── ai-service/      # Cliente del servicio IA
│   │   ├── presentation/        # Controladores y rutas
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── middlewares/
│   │   └── config/              # Configuración
│   └── package.json
│
├── ai-service/                  # Microservicio Python (IA)
│   ├── app/
│   │   ├── models/              # Modelos de ML
│   │   ├── services/            # Lógica de procesamiento
│   │   ├── api/                 # Endpoints FastAPI
│   │   └── utils/               # Utilidades
│   └── requirements.txt
│
├── database/                    # Esquemas y migraciones
│   ├── migrations/
│   └── seeds/
│
├── docs/                        # Documentación
│   ├── architecture/
│   ├── api/
│   └── deployment/
│
├── docker/                      # Dockerfiles
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── ai-service.Dockerfile
│
├── docker-compose.yml
├── .github/                     # CI/CD workflows
└── README.md
```

---

## 🗄️ Esquema de Base de Datos

Ver archivos completos en: `supabase/migrations/`

### Tablas Principales:
- **municipios**: Inventario de municipios españoles
- **especies**: Catálogo de especies vegetales para reforestación urbana
- **zonas_verdes**: Zonas identificadas para proyectos (azoteas, solares, etc.)
- **analisis**: Análisis de viabilidad de zonas verdes
- **proyectos**: Proyectos de implementación de zonas verdes
- **imagenes**: Imágenes satelitales y fotografías de zonas

### Seguridad
- **Row Level Security (RLS)** habilitado en todas las tablas
- Políticas de acceso configuradas por tipo de usuario
- Autenticación mediante JWT tokens
- Encriptación en tránsito y en reposo

---

## 📴 Modo Offline y Sincronización

EcoUrbe AI incluye soporte completo para modo offline con sincronización automática:

### Características
- ✅ **Cache Local**: IndexedDB para almacenamiento persistente
- ✅ **Service Worker**: Funcionamiento offline completo
- ✅ **Sincronización Automática**: Background sync cada 30 segundos
- ✅ **Cola de Operaciones**: Las acciones offline se sincronizan automáticamente
- ✅ **Detección de Conexión**: Respuesta automática a cambios de conectividad

### Cómo Funciona

```typescript
// 1. La aplicación intenta conectar con Supabase
// 2. Si no hay conexión, usa cache local (IndexedDB)
// 3. Las operaciones se guardan en cola de sincronización
// 4. Cuando vuelve la conexión, se sincronizan automáticamente
// 5. El usuario puede trabajar sin interrupciones

// Ejemplo de uso:
const zonas = await zonasVerdesApi.getAll();
// Devuelve datos de Supabase si hay conexión
// O datos del cache si está offline
```

### Service Worker
- Estrategia **Network First** para API calls
- Estrategia **Cache First** para assets estáticos
- Actualización automática en background
- Soporte para notificaciones de sincronización

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js ≥ 18.0.0
- Python ≥ 3.10 (para AI service)
- Cuenta en [Supabase](https://supabase.com) (ya configurada)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deploy)
- Docker y Docker Compose (opcional)

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
cd UrbanismoVerde

# 2. Configurar Supabase
# Ver guía detallada en: docs/SETUP_SUPABASE.md
# - Ejecutar migraciones desde SQL Editor en Supabase Dashboard
# - Cargar datos de prueba (seed.sql)

# 3. Configurar variables de entorno del frontend
cd frontend
cp .env.example .env
# Las credenciales de Supabase ya están incluidas en .env.example

# 4. Instalar dependencias del frontend
npm install

# 5. Iniciar frontend
npm run dev
# Frontend disponible en: http://localhost:3000

# 6. (Opcional) Instalar dependencias del backend
cd ../backend
npm install
npm run dev
# Backend disponible en: http://localhost:4000

# 7. (Opcional) Instalar dependencias del servicio IA
cd ../ai-service
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# AI Service disponible en: http://localhost:8000
```

### Instalación con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# La aplicación estará disponible en:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - AI Service: http://localhost:8000
# - PostgreSQL: localhost:5432
```

---

## 🚀 Despliegue en Producción

### Frontend en Vercel

Ver guía completa en: **[docs/DEPLOYMENT_VERCEL.md](./docs/DEPLOYMENT_VERCEL.md)**

```bash
# Opción 1: Desde Vercel Dashboard
# 1. Importar repositorio en vercel.com
# 2. Configurar Root Directory: . (raíz, o dejarlo vacío)
# 3. Agregar variables de entorno
# 4. Deploy

# Opción 2: Desde CLI
vercel
```

**Variables de entorno requeridas en Vercel**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (opcional)
- `VITE_AI_SERVICE_URL` (opcional)

### Base de Datos (Supabase)

Ver guía completa en: **[docs/SETUP_SUPABASE.md](./docs/SETUP_SUPABASE.md)**

1. Accede a [Supabase Dashboard](https://app.supabase.com)
2. El proyecto ya está creado con URL: `https://wxxztdpkwbyvggpwqdgx.supabase.co`
3. Ejecutar migraciones desde SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_enable_rls.sql`
4. Cargar datos de prueba: `supabase/seed.sql`

---

## 🔑 Configuración de APIs

### Supabase (Requerido)

Credenciales ya configuradas en `.env.example`:

```env
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Google Earth Engine (Opcional)

1. Crear cuenta en [Google Earth Engine](https://earthengine.google.com/)
2. Obtener credenciales de servicio
3. Configurar en backend `.env`:

```env
GOOGLE_EARTH_ENGINE_KEY_PATH=./config/earth-engine-key.json
```

### Google Maps API (Opcional)

La aplicación usa Leaflet por defecto (código abierto), pero puedes agregar Google Maps:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

---

## 📊 Casos de Uso Principales

1. **Detección Automática de Zonas**
   - El sistema analiza imágenes satelitales de una ciudad
   - Identifica azoteas, solares y espacios abandonados
   - Calcula área, exposición solar y viabilidad

2. **Análisis de Viabilidad con IA**
   - Procesa tipo de suelo mediante visión artificial
   - Calcula horas de sol disponibles
   - Recomienda especies vegetales óptimas
   - Estima costes de implementación

3. **Planificación de Proyectos**
   - Permite a municipios crear proyectos de reforestación
   - Gestiona presupuestos y recursos
   - Realiza seguimiento de la ejecución

4. **Visualización Geoespacial**
   - Mapa interactivo con capas de información
   - Filtros por tipo de zona, viabilidad, estado
   - Exportación de datos a GeoJSON/KML

---

## 🧪 Testing

```bash
# Tests unitarios - Backend
cd backend && npm test

# Tests unitarios - Frontend
cd frontend && npm test

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e
```

---

## 🚀 Despliegue en Vercel

El frontend de la aplicación está configurado para desplegarse fácilmente en Vercel.

### Despliegue Automático

1. **Conecta tu repositorio con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración

2. **Configuración del Proyecto:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (detectado automáticamente)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Variables de Entorno

Configura las siguientes variables en el dashboard de Vercel:

```
VITE_API_URL=https://tu-backend-url.com
VITE_AI_SERVICE_URL=https://tu-ai-service-url.com
```

### Verificación Post-Deploy

Después del despliegue, verifica que:

- ✅ La URL raíz muestra la aplicación correctamente
- ✅ No hay errores 404
- ✅ Los assets estáticos se cargan correctamente
- ✅ El mapa de Leaflet se renderiza
- ✅ La navegación entre rutas funciona sin errores

### Archivos de Configuración

El proyecto incluye los siguientes archivos de configuración para Vercel:

- **`frontend/vercel.json`**: Configuración de rewrites y headers
- **`.vercelignore`**: Archivos excluidos del despliegue

Para más información, consulta la [documentación de Vercel para Vite](https://vercel.com/docs/frameworks/vite).

---

## 📚 Documentación Completa

Para más información detallada, consulta:

### Guías de Usuario
- 📖 **[USAGE.md](USAGE.md)** - Guía de uso del mapa y funcionalidades
- 🚀 **[QUICKSTART.md](QUICKSTART.md)** - Instalación rápida en 3 pasos

### Guías Técnicas
- 📋 **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Resumen de implementación técnica
- 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)** - Cómo contribuir al proyecto
- 🌱 **[verde.md](verde.md)** - Roadmap, tareas programadas y propuestas

### Guías de Configuración y Despliegue
- 🔧 **[docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)** - Configuración de Supabase (DB + RLS + Migraciones)
- 🚀 **[docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md)** - Despliegue en Vercel (Frontend)
- 🚀 **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guía general de despliegue

### Seguridad
- 🔐 **[docs/SECURITY.md](docs/SECURITY.md)** - Guía de seguridad (RLS, Auth, Best Practices)

### Historial
- 📝 **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Historial de cambios

---

## 🔐 Seguridad

Ver guía completa en: **[docs/SECURITY.md](./docs/SECURITY.md)**

### Características de Seguridad

- ✅ **Row Level Security (RLS)** en todas las tablas
- ✅ **JWT Authentication** mediante Supabase Auth
- ✅ **HTTPS/TLS 1.3** en todas las conexiones
- ✅ **Encriptación** en tránsito y en reposo
- ✅ **Content Security Policy (CSP)** configurado
- ✅ **XSS & CSRF Protection** habilitado
- ✅ **Input Validation** en todos los endpoints
- ✅ **Rate Limiting** para prevenir abusos

### Políticas de Acceso

| Recurso | Lectura | Creación | Actualización | Eliminación |
|---------|---------|----------|---------------|-------------|
| Zonas Verdes | Todos | Autenticados | Propietario | Propietario |
| Análisis | Todos | Autenticados | Autenticados | Autenticados |
| Especies | Todos | Autenticados | Autenticados | - |
| Municipios | Todos | Autenticados | - | - |

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más información.

---

## 👥 Equipo

**Arquitecto de Software Senior**  
Especialista en Tecnologías Geoespaciales e IA

---

## 🌍 Roadmap

- [ ] **v1.0** - MVP con detección básica y visualización
- [ ] **v1.1** - Integración completa de Google Earth Engine
- [ ] **v1.2** - Modelos de IA personalizados para detección de suelo
- [ ] **v2.0** - Dashboard para gestión municipal
- [ ] **v2.1** - App móvil para ciudadanos
- [ ] **v3.0** - Marketplace de especies vegetales y proveedores

---

## 📧 Contacto

Para consultas gubernamentales o implementaciones a gran escala:  
**Email:** ecourbe-ai@example.com

---

**EcoUrbe AI** - Transformando ciudades grises en pulmones verdes 🌱
