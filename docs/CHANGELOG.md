# 📝 Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-10

### ✨ Added

#### Base de Datos
- PostgreSQL 15 con extensión PostGIS para datos geoespaciales
- 10 tablas principales con triggers automáticos
- Índices GiST para consultas espaciales optimizadas
- Seed data con usuario admin y 3 especies mediterráneas
- Enums personalizados (6 tipos: roles, tipos de zona, estados, etc.)

#### Frontend
- Aplicación React 18 con TypeScript en modo estricto
- Mapa interactivo con Leaflet y 3 capas base:
  - OpenStreetMap (vista de calles)
  - ESRI Satellite (imágenes satelitales)
  - OpenTopoMap (vista topográfica)
- Herramienta de dibujo de polígonos con validación
- Cálculo automático de áreas usando fórmula de Haversine
- Modal form con validación de campos
- Popups informativos con botón de eliminación
- Colores diferenciados por tipo de zona
- Panel de control responsive con Tailwind CSS
- Soporte para 6 tipos de zonas verdes

#### Backend
- API REST con Node.js 18 + Express + TypeScript
- Estructura Clean Architecture (4 capas)
- Endpoints de salud y status
- Configuración con variables de entorno
- Dockerfile optimizado para producción
- CORS configurado para desarrollo

#### AI Service
- Microservicio FastAPI con Python 3.10
- Endpoint `/analyze` para análisis de viabilidad
- Procesamiento de coordenadas geográficas
- Cálculo de centroide y área
- Análisis de exposición solar
- Recomendación de especies vegetales
- Estimación de costos de implementación
- Documentación interactiva con Swagger UI
- Dockerfile con dependencias de OpenCV

#### DevOps
- Docker Compose con 5 servicios orquestados:
  - PostgreSQL + PostGIS
  - Redis
  - Backend
  - Frontend
  - AI Service
- GitHub Actions CI/CD pipeline con 4 jobs:
  - Backend build & test
  - Frontend build & test
  - AI Service build & test
  - Docker build test
- Health checks en todos los servicios
- Volúmenes persistentes para datos
- Red compartida entre contenedores

#### Documentación
- README.md completo con arquitectura y stack
- USAGE.md con guía paso a paso
- QUICKSTART.md para instalación rápida
- CONTRIBUTING.md con estándares de código
- IMPLEMENTATION.md con resumen técnico
- Configuración para despliegue en Vercel

### 🔧 Changed
- Migración de JavaScript a TypeScript (100%)
- Adopción de Tailwind CSS en lugar de CSS vanilla
- Cambio de Google Maps a Leaflet (open source)
- Estructura modular con separación de responsabilidades

### 🐛 Fixed
- Validación de polígonos con menos de 3 puntos
- Manejo de errores en cálculos geométricos
- Escape de caracteres especiales en nombres de zonas
- Conversión correcta de coordenadas [lat, lon] a PostGIS

### 🔐 Security
- JWT_SECRET configurado en variables de entorno
- Contraseñas hasheadas con bcrypt en seed data
- CORS configurado para orígenes específicos
- Validación de inputs en todos los endpoints
- SQL injection prevention con Prisma ORM

---

## [Unreleased]

### Próximas Funcionalidades
- Autenticación JWT completa
- CRUD de proyectos de reforestación
- Dashboard de administración
- Integración con Google Earth Engine
- Análisis batch de ciudades
- Sistema de roles y permisos
- API pública con rate limiting
- Mobile app (React Native)

---

## Notas de Versión

### v1.0.0 - MVP Completo
Primera versión funcional con todas las capacidades básicas:
- ✅ Dibujo y gestión de zonas verdes
- ✅ Análisis de viabilidad con IA
- ✅ Visualización geoespacial interactiva
- ✅ Base de datos espacial con PostGIS
- ✅ Arquitectura de microservicios
- ✅ CI/CD automatizado
- ✅ Dockerizado completamente
- ✅ Documentación completa

### Compatibilidad
- Node.js ≥ 18.0.0
- Python ≥ 3.10
- PostgreSQL ≥ 15
- Docker ≥ 20.10
- Docker Compose ≥ 2.0

### Requisitos Mínimos
- **RAM**: 4 GB
- **CPU**: 2 cores
- **Disco**: 10 GB
- **SO**: Linux, macOS, Windows 10+

---

## Contribuidores

- [@tecnicfitia-TUTORIAL](https://github.com/tecnicfitia-TUTORIAL) - Arquitecto Principal

---

**Formato de Changelog:**
- `✨ Added` - Nuevas funcionalidades
- `🔧 Changed` - Cambios en funcionalidades existentes
- `🐛 Fixed` - Correcciones de bugs
- `🔐 Security` - Parches de seguridad
- `🗑️ Deprecated` - Funcionalidades obsoletas
- `🚫 Removed` - Funcionalidades eliminadas
