# 🌱 EcoUrbe AI - Regeneración Urbana Inteligente

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-development-yellow)

Plataforma de inteligencia artificial para identificar zonas urbanas grises o abandonadas y proponer planes de reforestación sostenible y de bajo coste.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)
- [Contribuir](#contribuir)

## ✨ Características

- 🗺️ **Mapa Interactivo**: Interfaz basada en Leaflet para dibujar y visualizar zonas
- 🤖 **Análisis con IA**: Detección automática de zonas candidatas usando TensorFlow
- 🌍 **Datos Geoespaciales**: Integración con PostGIS para análisis espacial
- 📊 **Métricas de Impacto**: Cálculo de CO2 capturado, biodiversidad y beneficios sociales
- 🌿 **Catálogo de Especies**: Base de datos de especies nativas para cada tipo de suelo
- 📱 **Responsive Design**: Interfaz adaptable a todos los dispositivos

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** con 4 capas:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (React)          │
├─────────────────────────────────────────┤
│     Application Layer (Use Cases)       │
├─────────────────────────────────────────┤
│     Domain Layer (Entities & Rules)     │
├─────────────────────────────────────────┤
│     Infrastructure (DB, APIs, AI)       │
└─────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
- **React 18+** con TypeScript
- **Tailwind CSS** para estilos
- **Leaflet** para mapas interactivos
- **Vite** como build tool

### Backend
- **Node.js 18+** con Express
- **TypeScript** para type safety
- **Prisma ORM** para acceso a datos
- **PostgreSQL 15+** con PostGIS

### AI Service
- **Python 3.10+** con FastAPI
- **TensorFlow** para modelos de ML
- **OpenCV** para procesamiento de imágenes
- **Google Earth Engine API** (integración futura)

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** para CI/CD
- **Redis** para caché

## 📦 Requisitos Previos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (para desarrollo local)
- Python 3.10+ (para desarrollo local)

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
cd UrbanismoVerde
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env según tu entorno
```

### 3. Iniciar con Docker Compose

```bash
docker-compose up --build
```

Esto iniciará todos los servicios:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Verificar Instalación

```bash
# Backend health check
curl http://localhost:4000/health

# AI Service health check
curl http://localhost:8000/health
```

## 💻 Uso

### Desarrollo Local

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Usar el Mapa

1. Abre http://localhost:3000
2. Haz clic en "Dibujar Nueva Zona"
3. Dibuja un polígono en el mapa
4. Completa el formulario con datos de la zona
5. Guarda para agregar el área a la base de datos

## 📁 Estructura del Proyecto

```
UrbanismoVerde/
├── frontend/                # React + TypeScript + Leaflet
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   └── maps/       # Componentes de mapas
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── domain/         # Entidades y reglas de dominio
│   │   │   └── entities/
│   │   ├── application/    # Casos de uso
│   │   ├── infrastructure/ # Repositorios, DB
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/             # Python + FastAPI + TensorFlow
│   ├── app/
│   │   ├── main.py        # API FastAPI
│   │   └── models/        # Modelos de ML
│   ├── Dockerfile
│   └── requirements.txt
│
├── database/               # PostgreSQL + PostGIS
│   └── schema.sql         # Schema completo con triggers
│
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
│
├── docker-compose.yml     # Orquestación de servicios
├── .env.example          # Variables de entorno
└── README.md             # Este archivo
```

## 📚 API Documentation

### Backend API

- **GET** `/health` - Health check
- **GET** `/api/zonas` - Listar zonas verdes
- **POST** `/api/zonas` - Crear nueva zona
- **GET** `/api/zonas/:id` - Obtener zona específica
- **DELETE** `/api/zonas/:id` - Eliminar zona

### AI Service API

- **GET** `/health` - Health check
- **POST** `/api/analyze-zone` - Analizar zona con IA

Documentación interactiva disponible en: http://localhost:8000/docs

## 🗄️ Base de Datos

El proyecto incluye un schema completo de PostgreSQL con PostGIS:

- **10+ Tablas** con relaciones bien definidas
- **Triggers automáticos** para cálculo de centroides y áreas
- **Índices espaciales GiST** para consultas geoespaciales optimizadas
- **Tipos enumerados** para garantizar consistencia de datos
- **Datos semilla** con especies vegetales mediterráneas

### Tablas Principales:

1. `usuarios` - Gestión de usuarios y roles
2. `municipios` - Límites administrativos
3. `zonas_verdes` - Zonas para reforestación
4. `analisis_ia` - Resultados de análisis de IA
5. `especies_vegetales` - Catálogo de plantas
6. `proyectos_verde` - Proyectos de reforestación
7. `proyecto_especies` - Relación proyectos-especies
8. `seguimiento_proyectos` - Tracking de actividades
9. `metricas_impacto` - Impacto ambiental y social
10. `auditoria` - Registro de auditoría

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI Service tests
cd ai-service
pytest
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **EcoUrbe Team** - [tecnicfitia-TUTORIAL](https://github.com/tecnicfitia-TUTORIAL)

## 🙏 Agradecimientos

- OpenStreetMap por los datos de mapas
- ESRI por imágenes satelitales
- Comunidad de código abierto

---

Hecho con 💚 para un futuro más verde