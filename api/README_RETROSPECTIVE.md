# Retrospective Analysis API - Developer Guide

## Overview

The Retrospective Analysis API provides comprehensive comparison between current state (baseline) and projected state (with green roof) for urban rooftops. It calculates environmental benefits, economic returns, and ROI based on official Spanish standards.

## Quick Start

### Basic Usage

```python
from retrospective_analyze import (
    calculate_baseline,
    calculate_projection,
    calculate_comparison,
    calculate_roi,
    generate_timeline,
    calculate_ecosystem_value
)

# Define baseline (current state)
baseline_data = {
    'tipo_superficie': 'asfalto',
    'area_m2': 500,
    'temperatura_verano_c': 34.0
}

# Define projection (future state)
projection_data = {
    'tipo_cubierta': 'extensiva',
    'area_verde_m2': 500,
    'anos_horizonte': 25
}

# Calculate all metrics
baseline = calculate_baseline(baseline_data)
projection = calculate_projection(projection_data, baseline)
comparison = calculate_comparison(baseline, projection)
roi = calculate_roi(projection, comparison)
timeline = generate_timeline(projection, comparison, 25)
eco_value = calculate_ecosystem_value(projection, baseline)
```

### HTTP Endpoint

```bash
curl -X POST https://your-domain.vercel.app/api/retrospective_analyze \
  -H "Content-Type: application/json" \
  -d '{
    "baseline": {
      "tipo_superficie": "asfalto",
      "area_m2": 500
    },
    "projection": {
      "tipo_cubierta": "extensiva"
    }
  }'
```

## API Functions

### 1. calculate_baseline(data: dict) -> dict

Calculates current state metrics (BEFORE green roof).

**Input:**
```python
{
    'tipo_superficie': 'asfalto' | 'hormigon' | 'grava' | 'mixto',
    'area_m2': float,
    'temperatura_verano_c': float (optional, default: 34.0),
    'coste_ac_eur_anual': float (optional, calculated if not provided),
    'coste_calefaccion_eur_anual': float (optional),
    'coste_agua_eur_anual': float (optional),
    'coste_mantenimiento_eur_anual': float (optional)
}
```

**Output:**
```python
{
    'tipo_superficie': str,
    'area_m2': float,
    'temperatura_verano_c': float,
    'isla_calor_intensidad': int (0-10),
    'co2_captura_kg_anual': float (0 for baseline),
    'runoff_agua_pct': float (100 for baseline),
    'coste_total_eur_anual': float,
    # ... more fields
}
```

### 2. calculate_projection(data: dict, baseline: dict) -> dict

Calculates future state with green roof (AFTER).

**Input:**
```python
{
    'tipo_cubierta': 'extensiva' | 'intensiva' | 'semi-intensiva',
    'area_verde_m2': float (optional, defaults to baseline area),
    'anos_horizonte': 1 | 5 | 10 | 25 (optional, default: 25),
    'especies': list[str] (optional),
    'sustrato_espesor_cm': int (optional),
    'sistema_riego': 'goteo' | 'manual' | 'ninguno' (optional)
}
```

**Output:**
```python
{
    'tipo_cubierta': str,
    'area_verde_m2': float,
    'reduccion_temperatura_c': float,
    'retencion_agua_pct': float,
    'co2_adicional_kg_anual': float,
    'ahorro_total_anual': float,
    'coste_inicial_eur': float,
    'subvenciones_disponibles_eur': float,
    'coste_neto_inicial_eur': float,
    # ... more fields
}
```

### 3. calculate_comparison(baseline: dict, projection: dict) -> dict

Calculates deltas between baseline and projection.

**Output:**
```python
{
    'delta_temperatura_c': float (negative = cooling),
    'delta_co2_kg_anual': float (positive = more capture),
    'delta_agua_retenida_m3_anual': float,
    'delta_costes_eur_anual': float (negative = savings),
    'delta_biodiversidad_pct': float
}
```

### 4. calculate_roi(projection: dict, comparison: dict) -> dict

Calculates financial metrics.

**Output:**
```python
{
    'roi_porcentaje': float,
    'payback_anos': float,
    'vnp_25_anos_eur': float  # Net Present Value @ 3% discount
}
```

### 5. generate_timeline(projection: dict, comparison: dict, anos: int) -> list

Generates year-by-year evolution.

**Output:**
```python
[
    {
        'ano': 1,
        'beneficio_acumulado_eur': float,
        'co2_acumulado_kg': float,
        'agua_acumulada_m3': float
    },
    # ... up to 'anos' entries
]
```

### 6. calculate_ecosystem_value(projection: dict, baseline: dict) -> dict

Calculates ecosystem services monetary value.

**Output:**
```python
{
    'valor_ecosistemico_total_eur': float,
    'mejora_calidad_vida_indice': int (0-10),
    'desglose_ecosistemico': {
        'valor_co2_eur_anual': float,
        'valor_agua_eur_anual': float,
        'valor_aire_eur_anual': float
    }
}
```

## Standards Used

### IDAE (Instituto para la Diversificación y Ahorro de la Energía)
- Energy consumption: 50 kWh/m²/year (heating), 30 kWh/m²/year (cooling)
- Energy price: 0.25 €/kWh
- Reduction extensiva: 35% AC, 15% heating
- Reduction intensiva: 50% AC, 30% heating

### MITECO 2024 (Ministerio para la Transición Ecológica)
- CO₂ capture: 5 kg/m²/year (extensiva)
- Water retention: 60% average
- Madrid precipitation: 400 mm/year
- Temperature reduction: 1.2°C (extensiva), 1.8°C (intensiva)

### PECV Madrid 2025 (Plan Especial Cubiertas Verdes)
- Subsidies: 40-50% of initial investment
- Cost extensiva: 115 €/m² (average 80-150)
- Cost semi-intensiva: 175 €/m²
- Cost intensiva: 200 €/m² (average 150-250)

### EU TEEB (The Economics of Ecosystems and Biodiversity)
- CO₂ price: 80 €/ton (EU ETS)
- Water cost: 2 €/m³
- PM filtered value: 50 €/kg
- Ecosystem service value: 85 €/m²/year

## Configuration Constants

```python
# Madrid precipitation (mm/year)
PRECIPITACION_MADRID_MM = 400

# Water retention by green roof (%)
RETENCION_AGUA_PCT = 60

# Water cost (€/m³)
COSTE_AGUA_EUR_M3 = 2.0

# Discount rate for NPV
TASA_DESCUENTO = 0.03  # 3%

# Payback limit
INFINITE_PAYBACK_YEARS = 999  # Indicates non-viable investment

# Quality of life calculation
QUALITY_FACTORS_COUNT = 3  # Temperature, area, biodiversity
QUALITY_INDEX_SCALE = 10   # 0-10 scale
```

## Testing

### Run Unit Tests

```bash
cd api
python3 test_retrospective_analyze.py
```

Expected output: ✅ 7/7 tests passed

### Run Integration Tests

```bash
cd api
python3 integration_test_retrospective.py
```

Expected output: 3 real-world scenarios with detailed reports

## HTTP Endpoint

### Request

**POST** `/api/retrospective_analyze`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "zona_verde_id": "uuid",  // Optional
  "nombre": "string",       // Optional
  "baseline": {
    "tipo_superficie": "asfalto",
    "area_m2": 500,
    "temperatura_verano_c": 34  // Optional
  },
  "projection": {
    "tipo_cubierta": "extensiva",
    "area_verde_m2": 500,       // Optional
    "anos_horizonte": 25,        // Optional
    "especies": ["Lavanda", "Romero"]  // Optional
  }
}
```

### Response

```json
{
  "success": true,
  "baseline": { /* baseline metrics */ },
  "projection": { /* projection metrics */ },
  "comparison": { /* deltas */ },
  "roi": { /* financial metrics */ },
  "timeline": [ /* year-by-year data */ ],
  "valor_ecosistemico_total_eur": 104750.00,
  "mejora_calidad_vida_indice": 6,
  "metadata": {
    "version": "1.0",
    "metodologia": {
      "energia": "IDAE 2024",
      "ecosistema": "MITECO 2024",
      "normativa": "PECV Madrid 2025",
      "roi": "VNP con tasa descuento 3%"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Examples

### Small Residential (100m²)

```python
baseline = {'tipo_superficie': 'asfalto', 'area_m2': 100}
projection = {'tipo_cubierta': 'extensiva', 'anos_horizonte': 25}

# Results:
# - Investment: €6,325 (after subsidy)
# - Annual savings: €498
# - Payback: 41.3 years
# - CO₂ captured: 12,500 kg (25 years)
```

### Large Commercial (500m²)

```python
baseline = {'tipo_superficie': 'hormigon', 'area_m2': 500}
projection = {'tipo_cubierta': 'intensiva', 'anos_horizonte': 25}

# Results:
# - Investment: €55,000 (after subsidy)
# - Annual savings: €4,038
# - Payback: 13.6 years
# - Ecosystem value: €107,450 (25 years)
```

## Dependencies

- Python 3.7+
- Standard library only (json, math, time)
- standards/idae_formulas.py
- standards/miteco_2024.py
- standards/costs_2024.py

## License

See LICENSE file in repository root.

## Support

- Documentation: `/docs/ANALISIS_RETROSPECTIVO.md`
- Issues: GitHub Issues
- Email: soporte@urbanismoverde.es

---

**Version:** 1.0  
**Last Updated:** 2026-02-11  
**Maintained by:** UrbanismoVerde Team
