# API Analysis V2 - Documentación Técnica

## Visión General

La **API Analysis V2** implementa un **motor de análisis inteligente con arquitectura de 3 capas** para evaluación de viabilidad de cubiertas verdes, basado en normativas oficiales españolas y europeas.

### Versión
- **V2.0.0** (2024)
- **Arquitectura**: 3 capas (Geospatial, Computer Vision, Value Generation)
- **Framework**: Python + Vercel Serverless Functions

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────┐
│          FRONTEND (React/TypeScript)            │
│  ┌──────────────────────────────────────────┐   │
│  │   POST /api/analyze                      │   │
│  │   { polygon: GeoJSON }                   │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│       VERCEL SERVERLESS FUNCTION (Python)       │
│  ┌──────────────────────────────────────────┐   │
│  │  AnalysisEngine (3 Layers)              │   │
│  │                                          │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │ Layer 1: GEOSPATIAL (Normativa)   │ │   │
│  │  │  - Haversine area calculation     │ │   │
│  │  │  - Factor Verde (PECV Madrid)     │ │   │
│  │  │  - Subsidy eligibility            │ │   │
│  │  └────────────────────────────────────┘ │   │
│  │                                          │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │ Layer 2: COMPUTER VISION (Sim.)   │ │   │
│  │  │  - Surface segmentation           │ │   │
│  │  │  - Solar exposure analysis        │ │   │
│  │  │  - NDVI calculation               │ │   │
│  │  └────────────────────────────────────┘ │   │
│  │                                          │   │
│  │  ┌────────────────────────────────────┐ │   │
│  │  │ Layer 3: VALUE GENERATION          │ │   │
│  │  │  - Native species recommendation  │ │   │
│  │  │  - Budget calculation             │ │   │
│  │  │  - Ecosystem benefits (MITECO)    │ │   │
│  │  │  - ROI calculation                │ │   │
│  │  │  - Green Score (weighted)         │ │   │
│  │  └────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              STANDARDS MODULES                  │
│  - pecv_madrid.py (Factor Verde)                │
│  - species_spain.py (Native catalog)            │
│  - costs_2024.py (Market prices)                │
│  - idae_formulas.py (Energy savings)            │
│  - miteco_2024.py (Ecosystem benefits)          │
└─────────────────────────────────────────────────┘
```

---

## Endpoint Principal

### POST /api/analyze

Analiza la viabilidad de una cubierta verde en una ubicación específica.

#### Request

```http
POST https://urbanismo-verde.vercel.app/api/analyze
Content-Type: application/json
```

**Body:**
```json
{
  "polygon": {
    "type": "Polygon",
    "coordinates": [
      [
        [-3.7038, 40.4168],
        [-3.7020, 40.4168],
        [-3.7020, 40.4150],
        [-3.7038, 40.4150],
        [-3.7038, 40.4168]
      ]
    ]
  }
}
```

**Formato GeoJSON:**
- `type`: Siempre "Polygon"
- `coordinates`: Array de arrays `[lon, lat]` (orden GeoJSON estándar)
- Primer y último punto deben ser idénticos (polígono cerrado)

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "green_score": 78.5,
  "area_m2": 30481.00,
  "perimetro_m": 705.07,
  "inclinacion_grados": 0.4,
  
  "normativa": {
    "factor_verde": 0.389,
    "cumple_pecv_madrid": false,
    "cumple_miteco": false,
    "requisitos": {
      "superficie_min_50m2": true,
      "inclinacion_max_30": true,
      "factor_verde_minimo": false,
      "especies_nativas_60_pct": true,
      "cumple_todos": false
    }
  },
  
  "subvencion": {
    "elegible": true,
    "porcentaje": 80,
    "programa": "PECV Madrid 2025 + Fondos Next Generation",
    "monto_estimado_eur": 5218119.98
  },
  
  "vision_artificial": {
    "segmentacion": {
      "asfalto_m2": 9124.61,
      "grava_m2": 15083.82,
      "vegetacion_previa_m2": 3200.98,
      "obstaculos_m2": 3071.59,
      "area_util_m2": 27719.59,
      "area_util_pct": 90.9
    },
    "exposicion_solar": {
      "horas_sol_anuales": 2234,
      "clasificacion": "SOL_DIRECTO",
      "factor_sombra": 0.93,
      "radiacion_estimada_kwh_m2_ano": 1787
    },
    "ndvi_actual": 0.14
  },
  
  "beneficios_ecosistemicos": {
    "co2_capturado_kg_anual": 138598,
    "agua_retenida_litros_anual": 6652702,
    "reduccion_temperatura_c": 1.5,
    "ahorro_energia_kwh_anual": 124738,
    "ahorro_energia_eur_anual": 31185
  },
  
  "especies_recomendadas": [
    {
      "nombre_comun": "Lavanda",
      "nombre_cientifico": "Lavandula angustifolia",
      "tipo": "Aromática",
      "nativa_iberia": true,
      "viabilidad": 0.95,
      "razon": "Ideal para sol directo, nativa, bajo riego",
      "polinizacion": "Alta",
      "densidad_m2": 9,
      "cantidad_estimada": 249476,
      "coste_unidad_eur": 3.50
    },
    {
      "nombre_comun": "Romero",
      "nombre_cientifico": "Rosmarinus officinalis",
      "tipo": "Aromática",
      "nativa_iberia": true,
      "viabilidad": 0.92,
      "razon": "Resistente sequía, nativa península",
      "polinizacion": "Alta",
      "densidad_m2": 4,
      "cantidad_estimada": 110878,
      "coste_unidad_eur": 3.50
    }
  ],
  
  "presupuesto": {
    "coste_total_inicial_eur": 6522649.97,
    "desglose": {
      "sustrato_eur": 1247381.55,
      "drenaje_eur": 692989.75,
      "membrana_impermeable_eur": 415793.85,
      "lamina_antiraices_eur": 221756.72,
      "geotextil_eur": 138598.00,
      "plantas_eur": 2811183.10,
      "instalacion_eur": 554391.80,
      "riego_eur": 440555.20
    },
    "mantenimiento_anual_eur": 221756.72,
    "coste_por_m2_eur": 235.29,
    "vida_util_anos": 25
  },
  
  "roi_ambiental": {
    "roi_porcentaje": 2.51,
    "amortizacion_anos": 9.5,
    "ahorro_anual_eur": 137826,
    "ahorro_25_anos_eur": 3445650,
    "valor_neto_presente_eur": 2141120
  },
  
  "recomendaciones_tecnicas": [
    "⚠️ Factor Verde actual (0.389) no cumple mínimo PECV (0.6)",
    "⚠️ Verificar capacidad estructural del edificio (150 kg/m²)",
    "⚠️ Instalar membrana impermeabilizante (10 años garantía mínima)",
    "💧 Sistema de riego por goteo automatizado (60% agua vs aspersión)",
    "🌱 Sustrato ligero con espesor mínimo 10 cm",
    "🔒 Lámina anti-raíces obligatoria en cubiertas no accesibles",
    "📋 Solicitar licencia municipal y permiso de comunidad",
    "💰 Elegible para subvención del 80% (€5,218,120)"
  ],
  
  "tags": [
    "Exposición solar alta (2234h/año)",
    "Especies nativas recomendadas",
    "Elegible para subvenciones",
    "ROI favorable (<9 años)"
  ],
  
  "processing_time": 0.15
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Módulos Estándar

### 1. standards/pecv_madrid.py

**Factor Verde según PECV Madrid 2025.**

```python
from standards.pecv_madrid import calculate_factor_verde

resultado = calculate_factor_verde(
    area_total_m2=1000,
    area_verde_m2=900,
    tipo_cubierta='extensiva',  # 'extensiva', 'intensiva', 'semi_intensiva'
    orientacion='sur',          # 'sur', 'norte', 'este', 'oeste'
    tipo_infraestructura='cubierta_vegetal_extensiva'
)
```

**Returns:**
```python
{
    'factor_verde': 0.405,
    'cumple_extensiva': False,
    'cumple_intensiva': False,
    'coeficientes': {'ct': 0.75, 'co': 1.0, 'ci': 0.6},
    'tipo_cubierta_recomendado': 'extensiva'
}
```

---

### 2. standards/species_spain.py

**Catálogo de especies nativas de la Península Ibérica.**

```python
from standards.species_spain import get_species_by_exposure

especies = get_species_by_exposure(
    clasificacion_solar='SOL_DIRECTO',  # 'SOL_DIRECTO', 'MIXTA', 'SOMBRA'
    max_especies=3
)
```

**Returns:**
```python
[
    {
        'nombre_comun': 'Lavanda',
        'nombre_cientifico': 'Lavandula angustifolia',
        'tipo': 'Aromática',
        'nativa_iberia': True,
        'viabilidad': 0.95,
        'razon': 'Ideal para sol directo...',
        'densidad_m2': 9,
        'coste_unidad_eur': 3.50,
        ...
    }
]
```

---

### 3. standards/costs_2024.py

**Precios de mercado Madrid 2024.**

```python
from standards.costs_2024 import calculate_budget

presupuesto = calculate_budget(
    area_m2=1000,
    especies_list=especies_con_cantidades,
    incluir_riego=True
)
```

**Returns:**
```python
{
    'coste_total_inicial_eur': 168000.00,
    'desglose': {
        'sustrato_eur': 45000,
        'drenaje_eur': 25000,
        'plantas_eur': 40000,
        ...
    },
    'mantenimiento_anual_eur': 8000,
    'coste_por_m2_eur': 168,
    'vida_util_anos': 25
}
```

---

### 4. standards/idae_formulas.py

**Fórmulas de ahorro energético IDAE.**

```python
from standards.idae_formulas import calculate_energy_savings

ahorro = calculate_energy_savings(
    area_m2=1000,
    tipo_cubierta='extensiva'  # 'extensiva' o 'intensiva'
)
```

**Returns:**
```python
{
    'ahorro_energia_kwh_anual': 18000,
    'ahorro_energia_eur_anual': 4500,
    'desglose': {
        'refrigeracion_kwh': 10500,
        'calefaccion_kwh': 7500,
        ...
    }
}
```

---

### 5. standards/miteco_2024.py

**Beneficios ecosistémicos MITECO 2024.**

```python
from standards.miteco_2024 import calculate_ecosystem_benefits

beneficios = calculate_ecosystem_benefits(
    area_m2=1000,
    tipo_cubierta='extensiva'
)
```

**Returns:**
```python
{
    'co2_capturado_kg_anual': 5000,
    'agua_retenida_litros_anual': 240000,
    'reduccion_temperatura_c': 1.5,
    'particulas_filtradas_kg_anual': 150,
    'valor_retencion_agua_eur_anual': 480
}
```

---

## Módulos de Utilidades

### utils/geospatial.py

**Cálculos geoespaciales precisos.**

```python
from utils.geospatial import calculate_area_haversine, calculate_perimeter

coordinates = [[-3.70, 40.42], [-3.69, 40.42], [-3.69, 40.41], [-3.70, 40.41], [-3.70, 40.42]]

area_m2 = calculate_area_haversine(coordinates)
perimetro_m = calculate_perimeter(coordinates)
```

### utils/computer_vision.py

**Análisis de visión artificial (simulado).**

```python
from utils.computer_vision import segment_surfaces, analyze_solar_exposure

segmentacion = segment_surfaces(area_m2=1000)
solar = analyze_solar_exposure(lat=40.42, lon=-3.70, area_m2=1000)
```

### utils/subsidy_zones.py

**Elegibilidad para subvenciones.**

```python
from utils.subsidy_zones import check_subsidy_eligibility

subsidy = check_subsidy_eligibility(lat=40.4168, lon=-3.7038)
# Centro Madrid: 80%
```

---

## Green Score (Ponderado)

El **Green Score** es un indicador compuesto (0-100) que evalúa la viabilidad global:

### Ponderación

| Factor | Peso | Descripción |
|--------|------|-------------|
| Factor Verde | 30% | PECV Madrid compliance |
| Exposición solar | 20% | Horas sol/año |
| Área útil | 15% | % área aprovechable |
| Beneficio ecosistémico | 20% | CO₂, agua, biodiversidad |
| Cumplimiento normativo | 15% | Requisitos PECV/MITECO |

### Interpretación

| Score | Calificación | Recomendación |
|-------|--------------|---------------|
| 0-40 | Baja viabilidad | No recomendado |
| 41-60 | Viabilidad media | Requiere optimización |
| 61-75 | Buena viabilidad | Recomendado |
| 76-90 | Muy buena viabilidad | Altamente recomendado |
| 91-100 | Excelente viabilidad | Proyecto ideal |

---

## Configuración Vercel

### vercel.json

```json
{
  "functions": {
    "api/analyze.py": {
      "runtime": "python3.9",
      "maxDuration": 10,
      "memory": 1024
    }
  }
}
```

### requirements.txt

```
# No external dependencies required
# Uses only Python standard library
```

---

## Límites y Restricciones

### Técnicos

- **Timeout**: 10 segundos (Vercel)
- **Memoria**: 1024 MB
- **Área mínima**: 50 m² (requisito PECV)
- **Área máxima recomendada**: 50,000 m²

### Simulaciones

La versión actual **simula** análisis de visión artificial. Para producción real:

1. **Integrar APIs satelitales**:
   - Google Earth Engine
   - Sentinel Hub
   - PVGIS (solar radiation)

2. **OpenCV real**:
   - Modelos segmentación entrenados
   - Procesamiento bandas NIR
   - Análisis multi-temporal sombras

---

## Testing

### Test Unitario

```bash
cd /home/runner/work/UrbanismoVerde/UrbanismoVerde/api
python3 test_analysis.py
```

### Test Endpoint (cURL)

```bash
# Centro Madrid (80% subsidy)
curl -X POST https://urbanismo-verde.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "polygon": {
      "type": "Polygon",
      "coordinates": [[
        [-3.7038, 40.4168],
        [-3.7020, 40.4168],
        [-3.7020, 40.4150],
        [-3.7038, 40.4150],
        [-3.7038, 40.4168]
      ]]
    }
  }'
```

---

## Changelog

### V2.0.0 (2024-02-11)

**Nueva arquitectura 3 capas:**
- ✅ Layer 1: Geospatial (Haversine, Factor Verde)
- ✅ Layer 2: Computer Vision (simulado, OpenCV-ready)
- ✅ Layer 3: Value Generation (ROI, especies, presupuesto)

**Estándares implementados:**
- ✅ PECV Madrid 2025 (Factor Verde oficial)
- ✅ MITECO 2024 (beneficios ecosistémicos)
- ✅ IDAE (ahorro energético)
- ✅ Especies nativas Península Ibérica
- ✅ Precios mercado Madrid 2024

**Mejoras:**
- ✅ Valores calculados (no hardcoded)
- ✅ Green Score ponderado
- ✅ ROI ambiental real
- ✅ Subvenciones por zona geográfica

### V1.0.0 (2024-02-10)

- Versión inicial con valores hardcoded
- Cálculo simple de área

---

## Referencias

1. **PECV Madrid 2025**: Ayuntamiento de Madrid
2. **MITECO 2024**: Ministerio para la Transición Ecológica
3. **IDAE**: Instituto para la Diversificación y Ahorro de la Energía
4. **Flora Ibérica**: Real Jardín Botánico (CSIC)
5. **CTE 2022**: Código Técnico de la Edificación

---

## Contacto y Soporte

- **Repositorio**: https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde
- **Documentación**: `/docs/`
- **Issues**: GitHub Issues

---

## Licencia

MIT License - Ver LICENSE file
