# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a EcoUrbe AI! Este documento te guiará a través del proceso de contribución.

## 📋 Código de Conducta

Este proyecto sigue un código de conducta. Al participar, te comprometes a mantener un ambiente respetuoso y constructivo.

## 🚀 Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/UrbanismoVerde.git
cd UrbanismoVerde

# Agrega el repositorio original como remote
git remote add upstream https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
```

### 2. Crear una Rama

```bash
# Actualiza tu rama main
git checkout main
git pull upstream main

# Crea una nueva rama para tu feature
git checkout -b feature/nombre-descriptivo

# O para un bugfix
git checkout -b fix/descripcion-del-bug
```

### 3. Hacer Cambios

Sigue estas guías:

#### TypeScript (Frontend & Backend)
- Usa TypeScript estricto (no `any`)
- Documenta funciones públicas
- Sigue las convenciones de nomenclatura:
  - `camelCase` para variables y funciones
  - `PascalCase` para clases y componentes
  - `UPPER_CASE` para constantes

#### Python (AI Service)
- Sigue PEP 8
- Usa type hints
- Documenta funciones con docstrings
- Máximo 88 caracteres por línea (Black formatter)

#### Commits
```bash
# Formato de commits (Conventional Commits)
git commit -m "tipo: descripción breve"

# Tipos válidos:
# feat: Nueva funcionalidad
# fix: Corrección de bug
# docs: Cambios en documentación
# style: Formato, sin cambios de código
# refactor: Refactorización de código
# test: Agregar o modificar tests
# chore: Tareas de mantenimiento
```

Ejemplos:
```bash
git commit -m "feat: add species filtering by climate"
git commit -m "fix: correct area calculation in Haversine formula"
git commit -m "docs: update API endpoints documentation"
```

### 4. Testing

Asegúrate de que todos los tests pasen:

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test

# AI Service
cd ai-service
pytest
```

### 5. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Ve a GitHub y crea un Pull Request
```

## 📝 Pull Request Guidelines

### Título
- Usa el formato: `[Tipo] Descripción breve`
- Ejemplo: `[Feature] Add climate-based species recommendation`

### Descripción
Incluye:
1. **¿Qué?** - Qué cambios hiciste
2. **¿Por qué?** - Por qué son necesarios
3. **¿Cómo?** - Cómo se implementaron
4. **Tests** - Qué tests agregaste/modificaste
5. **Screenshots** - Si hay cambios visuales

Ejemplo:
```markdown
## Descripción
Agrega filtrado de especies por clima para mejorar recomendaciones.

## Motivación
Las especies deben ser apropiadas para el clima local para mayor tasa de supervivencia.

## Cambios
- Nuevo campo `clima` en tabla `especies_vegetales`
- Endpoint `/api/especies?clima=mediterraneo`
- Componente de filtro en UI

## Tests
- Unit tests para función de filtrado
- Integration test para nuevo endpoint

## Screenshots
![Species Filter](screenshot.png)
```

## 🏗️ Arquitectura

### Clean Architecture

El proyecto sigue Clean Architecture con 4 capas:

```
Presentation Layer (UI)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Business Logic)
    ↓
Infrastructure Layer (DB, APIs)
```

### Principios
1. **Dependencias hacia adentro**: Las capas externas dependen de las internas
2. **Domain puro**: El dominio no conoce infrastructure
3. **Interfaces**: Usa interfaces para abstraer dependencias
4. **Testing**: Cada capa debe ser testeable independientemente

## 🎨 Guías de Estilo

### Frontend (React + TypeScript)

```typescript
// ✅ Bueno: Componente funcional con tipos
interface UserProps {
  name: string;
  age: number;
}

const UserCard: React.FC<UserProps> = ({ name, age }) => {
  return (
    <div className="p-4 rounded-lg bg-white shadow">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-gray-600">Edad: {age}</p>
    </div>
  );
};

// ❌ Malo: Sin tipos
const UserCard = ({ name, age }) => {
  return <div>{name}</div>;
};
```

### Backend (Express + TypeScript)

```typescript
// ✅ Bueno: Tipos claros, manejo de errores
import { Request, Response, NextFunction } from 'express';

interface ZonaVerdeRequest extends Request {
  body: {
    nombre: string;
    tipo: TipoZona;
  };
}

export const crearZona = async (
  req: ZonaVerdeRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const zona = await zonaService.crear(req.body);
    res.status(201).json(zona);
  } catch (error) {
    next(error);
  }
};

// ❌ Malo: Sin tipos, sin manejo de errores
export const crearZona = async (req, res) => {
  const zona = await zonaService.crear(req.body);
  res.json(zona);
};
```

### AI Service (FastAPI)

```python
# ✅ Bueno: Type hints, docstrings, validación
from pydantic import BaseModel, Field
from typing import List

class ZonaAnalisisRequest(BaseModel):
    """Request model para análisis de zona."""
    coordenadas: List[Coordenada] = Field(..., min_items=3)
    municipio_id: str | None = None

@app.post("/api/analyze")
async def analyze_zone(request: ZonaAnalisisRequest) -> AnalisisResponse:
    """
    Analiza una zona geográfica para viabilidad.
    
    Args:
        request: Datos de la zona a analizar
        
    Returns:
        Análisis con tipo de suelo y viabilidad
    """
    resultado = await analyzer.analyze(request)
    return resultado

# ❌ Malo: Sin tipos, sin validación
@app.post("/api/analyze")
async def analyze_zone(request):
    return {"result": "ok"}
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// frontend/src/utils/__tests__/area.test.ts
import { calcularArea } from '../area';

describe('calcularArea', () => {
  it('calcula correctamente área de triángulo', () => {
    const coords: [number, number][] = [
      [40.0, -3.0],
      [40.1, -3.0],
      [40.0, -3.1]
    ];
    const area = calcularArea(coords);
    expect(area).toBeGreaterThan(0);
  });

  it('retorna 0 para menos de 3 puntos', () => {
    const coords: [number, number][] = [[40.0, -3.0]];
    expect(calcularArea(coords)).toBe(0);
  });
});
```

### Integration Tests

```typescript
// backend/src/__tests__/zonas.integration.test.ts
import request from 'supertest';
import app from '../app';

describe('POST /api/zonas', () => {
  it('crea nueva zona con datos válidos', async () => {
    const response = await request(app)
      .post('/api/zonas')
      .send({
        nombre: 'Test Zone',
        tipo: 'solar_vacio',
        coordenadas: [[40.0, -3.0], [40.1, -3.0], [40.0, -3.1]]
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

## 🐛 Reportar Bugs

Usa el template de GitHub Issues:

```markdown
## Descripción del Bug
Descripción clara del problema.

## Pasos para Reproducir
1. Ve a '...'
2. Haz click en '....'
3. Observa el error

## Comportamiento Esperado
Qué debería suceder.

## Comportamiento Actual
Qué sucede realmente.

## Screenshots
Si aplica, agrega screenshots.

## Entorno
- OS: [macOS 13, Ubuntu 22.04, Windows 11]
- Browser: [Chrome 120, Firefox 121]
- Docker: [20.10.21]
- Node: [18.17.0]
- Python: [3.10.12]

## Contexto Adicional
Cualquier otra información relevante.
```

## 💡 Solicitar Features

Para nuevas funcionalidades:

1. Revisa issues existentes para evitar duplicados
2. Crea un issue con template "Feature Request"
3. Describe el problema que resuelve
4. Propón una solución
5. Menciona alternativas consideradas

## 📦 Versionado

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Correcciones de bugs

## 🎯 Áreas de Contribución

### Alta Prioridad
- 🤖 Integración de modelos de ML reales
- 🔐 Sistema de autenticación
- 📊 Dashboard de métricas
- 🧪 Aumentar cobertura de tests

### Media Prioridad
- 📱 Versión mobile
- 🌍 Internacionalización (i18n)
- 📈 Analytics y monitoring
- 🔔 Sistema de notificaciones

### Baja Prioridad
- 🎨 Temas personalizables
- 📧 Integración con email
- 📄 Generación de reportes PDF
- 🗺️ Más capas de mapas

## 📚 Recursos

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL + PostGIS](https://postgis.net/)

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el README.

## ❓ Preguntas

¿Tienes preguntas? 

- 💬 [Discussions](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/discussions)
- 📧 Email: dev@ecourbe.ai

---

¡Gracias por contribuir a EcoUrbe AI! 💚🌱
