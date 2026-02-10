# 📚 EcoUrbe AI - Guía de Uso

## Primeros Pasos

### 1. Iniciar el Proyecto

```bash
# Clonar el repositorio
git clone https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
cd UrbanismoVerde

# Copiar variables de entorno
cp .env.example .env

# Iniciar todos los servicios con Docker
docker compose up --build
```

### 2. Acceder a los Servicios

Una vez iniciados todos los servicios:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **AI Service Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

## 🗺️ Usar el Mapa Interactivo

### Dibujar una Nueva Zona Verde

1. **Iniciar Dibujo**
   - Haz clic en el botón "Dibujar Nueva Zona" en el panel izquierdo
   - El modo de dibujo se activará

2. **Dibujar Polígono**
   - Haz clic en el mapa para crear cada vértice del polígono
   - Necesitas al menos 3 puntos para crear un área válida
   - Los puntos se conectarán automáticamente

3. **Completar Dibujo**
   - Haz clic en "Completar Dibujo" cuando termines
   - Se abrirá un modal con un formulario

4. **Completar Información**
   - **Nombre**: Identificador de la zona (obligatorio)
   - **Tipo**: Selecciona el tipo de zona:
     - Solar Vacío
     - Azotea
     - Parque Degradado
     - Espacio Abandonado
     - Zona Industrial
     - Otro
   - **Notas**: Observaciones adicionales (opcional)

5. **Guardar**
   - Haz clic en "Guardar" para agregar la zona
   - El área se calculará automáticamente usando la fórmula de Haversine

### Visualizar Zonas

- Las zonas guardadas se muestran en el mapa con colores según su tipo
- Haz clic en cualquier zona para ver sus detalles en un popup
- Cada popup incluye:
  - Nombre
  - Tipo de zona
  - Área en m²
  - Notas (si existen)
  - Botón para eliminar

### Capas del Mapa

Usa el control de capas en la esquina superior derecha para cambiar entre:

1. **OpenStreetMap**: Vista de calles estándar
2. **ESRI Satellite**: Imágenes satelitales
3. **OpenTopoMap**: Vista topográfica

## 🤖 Análisis con IA

### Endpoint: POST /api/analyze-zone

Analiza una zona geográfica para determinar su viabilidad para reforestación.

**Request:**
```json
{
  "coordenadas": [
    {"lat": 40.4168, "lon": -3.7038},
    {"lat": 40.4170, "lon": -3.7040},
    {"lat": 40.4169, "lon": -3.7042}
  ],
  "municipio_id": "optional-uuid"
}
```

**Response:**
```json
{
  "tipo_suelo": "arcilloso",
  "horas_sol_promedio": 7.5,
  "nivel_viabilidad": "alta",
  "ndvi_promedio": 0.3,
  "confianza": 0.85
}
```

### Usar desde la Terminal

```bash
curl -X POST "http://localhost:8000/api/analyze-zone" \
  -H "Content-Type: application/json" \
  -d '{
    "coordenadas": [
      {"lat": 40.4168, "lon": -3.7038},
      {"lat": 40.4170, "lon": -3.7040},
      {"lat": 40.4169, "lon": -3.7042}
    ]
  }'
```

## 🗄️ Base de Datos

### Conectar a PostgreSQL

```bash
# Dentro del contenedor
docker compose exec postgres psql -U ecourbe_user -d ecourbe_db

# Desde tu máquina local
psql -h localhost -p 5432 -U ecourbe_user -d ecourbe_db
```

### Consultas Útiles

```sql
-- Ver todas las zonas verdes
SELECT id, nombre, tipo, area_m2, nivel_viabilidad 
FROM zonas_verdes 
ORDER BY created_at DESC;

-- Ver zonas con alta viabilidad
SELECT nombre, tipo, area_m2 
FROM zonas_verdes 
WHERE nivel_viabilidad = 'alta';

-- Ver especies disponibles
SELECT nombre_comun, nombre_cientifico, captacion_co2_kg_anio, coste_unitario_eur
FROM especies_vegetales
ORDER BY captacion_co2_kg_anio DESC;

-- Ver zonas dentro de un radio (ejemplo: 1km del centro de Madrid)
SELECT nombre, tipo, ST_Distance(
    centroide::geography,
    ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)::geography
) as distancia_metros
FROM zonas_verdes
WHERE ST_DWithin(
    centroide::geography,
    ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)::geography,
    1000
);
```

## 🔧 Desarrollo

### Agregar Nueva Funcionalidad

#### 1. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Crear nuevo componente:
```typescript
// frontend/src/components/NuevoComponente.tsx
import React from 'react';

const NuevoComponente: React.FC = () => {
  return (
    <div className="p-4">
      {/* Tu código aquí */}
    </div>
  );
};

export default NuevoComponente;
```

#### 2. Backend (Express)

```bash
cd backend
npm install
npm run dev
```

Crear nueva ruta:
```typescript
// backend/src/routes/nuevaRuta.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/nueva-ruta', (req: Request, res: Response) => {
  res.json({ message: 'Nueva ruta' });
});

export default router;
```

#### 3. AI Service (FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Agregar nuevo endpoint:
```python
@app.post("/api/nuevo-endpoint")
async def nuevo_endpoint(data: RequestModel):
    # Tu lógica aquí
    return {"resultado": "ok"}
```

### Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# AI Service
cd ai-service
pytest
```

### Linting

```bash
# TypeScript
cd frontend  # o backend
npm run lint

# Python
cd ai-service
flake8 app/
```

## 🐛 Solución de Problemas

### Puerto ya en uso

```bash
# Cambiar puerto en docker-compose.yml
# Ejemplo: cambiar frontend de 3000:3000 a 3001:3000
```

### Base de datos no se inicializa

```bash
# Eliminar volúmenes y reiniciar
docker compose down -v
docker compose up --build
```

### Frontend no se conecta al backend

Verifica las variables de entorno:
```bash
# frontend/.env
VITE_API_URL=http://localhost:4000
```

### Error en instalación de dependencias

```bash
# Limpiar caché y reinstalar
cd frontend  # o backend
rm -rf node_modules package-lock.json
npm install
```

### Python TensorFlow muy lento

TensorFlow puede ser lento en la primera ejecución. Para producción, considera:
- Usar GPU
- Cachear modelos pre-entrenados
- Usar versiones optimizadas

## 📊 Métricas y Monitoreo

### Health Checks

```bash
# Backend
curl http://localhost:4000/health

# AI Service
curl http://localhost:8000/health
```

### Logs

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f ai-service
```

## 🚀 Despliegue en Producción

### Variables de Entorno

Asegúrate de actualizar `.env` para producción:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-host:5432/db
JWT_SECRET=tu-secreto-muy-largo-y-seguro-aqui
```

### Build para Producción

```bash
# Frontend
cd frontend
npm run build
# Los archivos estarán en dist/

# Backend
cd backend
npm run build
# Los archivos estarán en dist/
```

### Docker en Producción

```bash
# Build con optimizaciones
docker compose -f docker-compose.prod.yml build

# Iniciar en modo detached
docker compose -f docker-compose.prod.yml up -d
```

## 📝 Próximos Pasos

1. **Integración Real de IA**
   - Entrenar modelos con imágenes reales
   - Integrar Google Earth Engine API
   - Implementar detección automática de zonas

2. **Autenticación y Autorización**
   - JWT tokens
   - Roles y permisos
   - OAuth2 integration

3. **Dashboard de Métricas**
   - Visualización de impacto CO2
   - Gráficos de proyectos
   - Estadísticas por municipio

4. **Mobile App**
   - React Native
   - Notificaciones push
   - Modo offline

5. **API Pública**
   - Documentación completa
   - Rate limiting
   - API keys

## 🆘 Soporte

¿Necesitas ayuda? 

- 📧 Email: support@ecourbe.ai
- 🐛 Issues: [GitHub Issues](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/issues)
- 📖 Docs: [GitHub Wiki](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/wiki)

---

Última actualización: 2026-02-10
