# 🤖 Sistema de Análisis de Zonas Verdes con IA

## 📋 Descripción General

El sistema de análisis con IA utiliza **OpenCV** y procesamiento de imágenes para evaluar zonas verdes dibujadas en el mapa, proporcionando recomendaciones automáticas de especies y estimaciones de viabilidad.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend React                        │
│  - useAnalysis hook                                     │
│  - AnalysisResults component                            │
│  - ai-analysis.ts service                               │
└────────────────┬────────────────────────────────────────┘
                 │ POST /api/analyze
                 │ { polygon: GeoJSON }
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel Serverless Function                 │
│                  (Python + OpenCV)                      │
│  - api/analyze.py                                       │
│  - Timeout: 10s                                         │
│  - Memory: 1024MB                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                 Procesamiento IA                        │
│  1. Cálculo de área (Haversine)                        │
│  2. Generación de imagen mock                          │
│  3. Análisis OpenCV (índice de verdor)                 │
│  4. Detección de características                       │
│  5. Recomendación de especies                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Componentes

### 1. Backend Python (`api/analyze.py`)

**Funciones principales:**

- `haversine_distance()` - Calcula distancias geográficas precisas
- `calculate_area_m2()` - Área en metros cuadrados
- `calculate_perimeter_m()` - Perímetro en metros
- `generate_mock_satellite_image()` - Imagen simulada para demo
- `calculate_green_score()` - Índice de verdor 0-100 con OpenCV
- `detect_characteristics()` - Detecta exposición solar, vegetación, etc.
- `recommend_species_detailed()` - Recomienda especies según análisis
- `analyze_zone()` - Función principal de análisis

**Respuesta JSON:**
```json
{
  "success": true,
  "green_score": 45,
  "area_m2": 1234.56,
  "perimetro_m": 156.78,
  "tags": ["Alta radiación solar", "Sin vegetación previa"],
  "especies_recomendadas": [
    {
      "nombre_comun": "Lavanda",
      "nombre_cientifico": "Lavandula angustifolia",
      "tipo": "Aromática",
      "viabilidad": 0.95,
      "razon": "Excelente para zonas soleadas"
    }
  ],
  "recomendaciones": [
    "Preparar sustrato con drenaje adecuado",
    "Sistema de riego por goteo recomendado"
  ],
  "processing_time": 3.45
}
```

### 2. Servicio Frontend (`services/ai-analysis.ts`)

**Características:**

- ✅ Timeout de 10 segundos con `AbortController`
- ✅ Fallback automático a análisis mock si falla
- ✅ Cache en `localStorage` (1 hora de vida)
- ✅ Conversión automática de coordenadas [lat,lng] → GeoJSON
- ✅ Manejo completo de errores

**Funciones exportadas:**

```typescript
// Analizar zona
analyzeZone(polygon: GeoJSONPolygon): Promise<AnalysisResponse>

// Convertir coordenadas a GeoJSON
coordinatesToGeoJSON(coords: [number, number][]): GeoJSONPolygon

// Limpiar cache
clearAnalysisCache(): void
```

### 3. Hook React (`hooks/useAnalysis.ts`)

**Estado gestionado:**

- `isAnalyzing` - Booleano indicando si está analizando
- `result` - Resultado del análisis o null
- `error` - Mensaje de error o null

**Funciones:**

```typescript
// Analizar polígono
analyze(polygon: GeoJSONPolygon | [number, number][]): Promise<AnalysisResponse | null>

// Resetear estado
reset(): void
```

**Ejemplo de uso:**

```tsx
const { analyze, isAnalyzing, result, error, reset } = useAnalysis();

const handleDrawComplete = async (coords: [number, number][]) => {
  const analysis = await analyze(coords);
  if (analysis) {
    console.log('Índice de verdor:', analysis.green_score);
  }
};
```

### 4. Componente UI (`components/analysis/AnalysisResults.tsx`)

**Props:**

- `analysis` - Resultado del análisis
- `onGenerateBudget` - Callback para generar presupuesto (opcional)
- `onClose` - Callback para cerrar (opcional)

**Características UI:**

- 🎨 Colores dinámicos según índice de verdor
  - Verde (70-100): Excelente
  - Amarillo (40-69): Bueno
  - Rojo (0-39): Necesita mejoras
- 📊 Visualización de área y perímetro
- 🏷️ Tags de características detectadas
- 🌱 Lista de especies recomendadas con viabilidad
- 🔧 Recomendaciones de mantenimiento
- ⏱️ Tiempo de procesamiento
- 💰 Botón para generar presupuesto

## 🚀 Flujo de Usuario Completo

```
1. Usuario dibuja polígono en el mapa
   └─→ MapContainer con DrawingHandler

2. Al completar el polígono
   └─→ onDrawComplete(coordinates)
   
3. Hook useAnalysis procesa
   └─→ analyze(coordinates)
   
4. Servicio convierte y envía
   └─→ coordinatesToGeoJSON()
   └─→ POST /api/analyze
   
5. Python/OpenCV procesa (3-8s)
   └─→ Análisis completo
   
6. Respuesta regresa al frontend
   └─→ setResult(analysis)
   
7. UI muestra AnalysisResults
   └─→ Green score, especies, recomendaciones
   
8. Usuario puede generar presupuesto
   └─→ onGenerateBudget()
```

## ⚙️ Configuración

### Variables de Entorno

No se requieren variables de entorno específicas para el análisis básico. El sistema funciona completamente serverless en Vercel.

### Configuración Vercel (`vercel.json`)

```json
{
  "functions": {
    "api/analyze.py": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Límites configurados:**

- Memoria: 1024 MB (suficiente para OpenCV)
- Timeout: 10 segundos (procesamiento típico: 3-8s)

## 🧪 Testing

### Test Manual Básico

```bash
# 1. Dibujar polígono en el mapa
# 2. Verificar console logs:
#    - "🔬 Iniciando análisis de zona..."
#    - "✅ Análisis completado: {...}"
# 3. Ver resultados en UI
# 4. Click "Generar Presupuesto"
```

### Test con cURL

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "polygon": {
      "type": "Polygon",
      "coordinates": [[
        [-3.7038, 40.4168],
        [-3.7030, 40.4170],
        [-3.7028, 40.4166],
        [-3.7036, 40.4164],
        [-3.7038, 40.4168]
      ]]
    }
  }'
```

## 🔍 Troubleshooting

### Error: "Module not found: opencv-python"

**Causa:** Dependencies no instaladas en Vercel

**Solución:** Verificar que `api/requirements.txt` existe y contiene:
```
opencv-python-headless==4.8.1.78
numpy==1.24.3
shapely==2.0.2
```

### Error: "CORS policy"

**Causa:** Headers CORS no configurados

**Solución:** Ya implementado en `api/analyze.py`:
```python
'Access-Control-Allow-Origin': '*'
```

### Error: "Timeout"

**Causa:** Análisis tarda más de 10 segundos

**Solución:** 
- Fallback automático a análisis mock
- Resultado local instantáneo
- Usuario puede reintentar

### Análisis no se dispara

**Causa:** Evento `onDrawComplete` no conectado

**Solución:** Verificar integración:
```tsx
<MapContainer onDrawComplete={handleDrawComplete}>
```

### Resultados no aparecen

**Posibles causas:**
1. Error en la API → Ver console
2. CORS bloqueado → Ver network tab
3. Timeout alcanzado → Usar fallback mock

## 🎯 Cómo Funciona OpenCV

### Cálculo del Índice de Verdor

1. **Conversión a HSV:**
   ```python
   hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
   ```

2. **Detección de verde:**
   ```python
   lower_green = np.array([35, 40, 40])
   upper_green = np.array([85, 255, 255])
   mask = cv2.inRange(hsv, lower_green, upper_green)
   ```

3. **Cálculo de porcentaje:**
   ```python
   green_pixels = np.count_nonzero(mask)
   total_pixels = image.shape[0] * image.shape[1]
   green_percentage = (green_pixels / total_pixels) * 100
   ```

### Detección de Características

- **Exposición solar:** Análisis de brillo promedio
- **Vegetación existente:** Porcentaje de píxeles verdes
- **Tipo de superficie:** Tamaño y textura

## 📈 Mejoras Futuras

### 1. Imágenes Satelitales Reales

**Opciones:**
- Google Maps Static API
- Mapbox Static Images
- Sentinel Hub

**Implementación:**
```python
def get_real_satellite_image(polygon):
    center_lat, center_lon = calculate_centroid(polygon)
    zoom = calculate_optimal_zoom(polygon)
    
    url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"
    url += f"{center_lon},{center_lat},{zoom}/600x600"
    url += f"?access_token={MAPBOX_TOKEN}"
    
    response = requests.get(url)
    image = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
    return image
```

### 2. NDVI Real (Normalized Difference Vegetation Index)

**Fórmula:**
```
NDVI = (NIR - Red) / (NIR + Red)
```

**Implementación con Sentinel:**
```python
import sentinelsat

def calculate_real_ndvi(polygon, date_range):
    # Obtener imágenes multiespectrales
    nir_band = get_sentinel_band(polygon, 'B8')  # Near Infrared
    red_band = get_sentinel_band(polygon, 'B4')  # Red
    
    # Calcular NDVI
    ndvi = (nir_band - red_band) / (nir_band + red_band + 1e-10)
    
    return ndvi.mean() * 100
```

### 3. Base de Datos de Especies Ampliada

**Integración con GBIF:**
```python
import pygbif

def get_species_for_region(lat, lon, climate_zone):
    occurrences = pygbif.occurrences.search(
        decimalLatitude=lat,
        decimalLongitude=lon,
        radius=5000,  # 5km
        hasCoordinate=True
    )
    
    return filter_suitable_species(occurrences, climate_zone)
```

### 4. Machine Learning

**Modelo de predicción:**
- Dataset: Histórico de proyectos exitosos
- Features: Área, exposición, vegetación previa, clima
- Output: Especies óptimas, coste real, tasa de éxito

## 📊 Métricas de Rendimiento

**Tiempos típicos:**
- Conversión GeoJSON: < 0.1s
- Análisis OpenCV: 2-5s
- Generación respuesta: 0.5s
- **Total promedio: 3-6s**

**Uso de recursos:**
- Memoria: ~200-400 MB
- CPU: Picos breves durante análisis
- Red: ~2-5 KB por request

## 🔒 Consideraciones de Seguridad

1. **Rate Limiting:** Implementar en producción
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def rate_limited_analysis(polygon_hash):
       return analyze_zone(polygon)
   ```

2. **Validación de Input:**
   - Tamaño máximo de polígono
   - Número de puntos razonable
   - Coordenadas dentro de rangos válidos

3. **CORS:** Restringir en producción
   ```python
   allowed_origins = ['https://tu-dominio.com']
   origin = event.get('headers', {}).get('origin')
   
   if origin in allowed_origins:
       return {
           'headers': {'Access-Control-Allow-Origin': origin}
       }
   ```

## 📚 Referencias

- [OpenCV Documentation](https://docs.opencv.org/)
- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Shapely Geometry](https://shapely.readthedocs.io/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

## 💡 FAQ

**Q: ¿Por qué usar imágenes mock?**  
A: Para demo y desarrollo. En producción se integrarían APIs de imágenes satelitales reales.

**Q: ¿Qué pasa si el análisis falla?**  
A: Fallback automático a análisis local con recomendaciones genéricas.

**Q: ¿Se puede offline?**  
A: Sí, con cache localStorage y análisis mock local.

**Q: ¿Cómo mejorar precisión?**  
A: Integrar imágenes reales + NDVI + base datos especies regional.

---

## 🎓 Conclusión

Este sistema proporciona una base sólida para análisis automático de zonas verdes con IA, con posibilidad de mejora continua mediante:

- Datos satelitales reales
- Machine Learning
- Bases de datos especializadas
- Análisis climático regional

El diseño modular permite estas mejoras sin reescribir el core del sistema.
