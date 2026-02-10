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
- **Principal:** PostgreSQL 15+ con extensión PostGIS
- **Cache:** Redis
- **Storage:** AWS S3 / MinIO (imágenes y reportes)

### DevOps
- **Containerización:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Infraestructura:** Terraform (opcional)

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

Ver archivo completo en: `database/schema.sql`

### Tablas Principales:
- **usuarios**: Gestión de usuarios y roles
- **municipios**: Inventario de municipios
- **zonas_verdes**: Zonas detectadas (azoteas, solares, etc.)
- **analisis_ia**: Resultados de análisis con IA
- **especies_vegetales**: Catálogo de plantas recomendables
- **proyectos_verde**: Proyectos de reforestación
- **seguimiento_proyectos**: Bitácora de actividades

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js ≥ 18.0.0
- Python ≥ 3.10
- PostgreSQL ≥ 15 con PostGIS
- Docker y Docker Compose (opcional)
- Cuenta de Google Cloud (para Earth Engine API)

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
cd UrbanismoVerde

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Instalar dependencias del frontend
cd frontend
npm install

# 4. Instalar dependencias del backend
cd ../backend
npm install

# 5. Configurar base de datos
npx prisma migrate dev --name init
npx prisma db seed

# 6. Instalar dependencias del servicio IA (Python)
cd ../ai-service
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# 7. Iniciar servicios
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - AI Service
cd ai-service && uvicorn app.main:app --reload
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

## 🔑 Configuración de APIs

### Google Earth Engine

1. Crear cuenta en [Google Earth Engine](https://earthengine.google.com/)
2. Obtener credenciales de servicio
3. Descargar el archivo JSON de credenciales
4. Configurar en `.env`:

```env
GOOGLE_EARTH_ENGINE_KEY_PATH=./config/earth-engine-key.json
```

### Google Maps API (opcional)

```env
REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
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

## 📚 Documentación

- [Guía de Arquitectura](./docs/architecture/README.md)
- [API Documentation](./docs/api/README.md) (Swagger/OpenAPI)
- [Guía de Despliegue](./docs/deployment/README.md)
- [Contribución](./CONTRIBUTING.md)

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