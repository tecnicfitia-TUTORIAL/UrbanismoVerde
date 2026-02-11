# Factor Verde PECV Madrid 2025

## Introducción

El **Factor Verde** es un indicador oficial establecido por el Plan Estratégico de Calidad del Verde y la Biodiversidad (PECV) del Ayuntamiento de Madrid para 2025. Este factor cuantifica la calidad y cantidad de infraestructura verde en cubiertas y espacios urbanos.

## Fórmula Oficial

```
FV = (Ct × Co × Σ(Ci × Si)) / Sp
```

### Componentes

- **FV**: Factor Verde (adimensional)
- **Ct**: Coeficiente por tipo de cubierta
- **Co**: Coeficiente por orientación solar
- **Ci**: Coeficiente por tipo de infraestructura verde
- **Si**: Superficie de cada elemento de infraestructura (m²)
- **Sp**: Superficie total de la parcela/cubierta (m²)

## Coeficientes

### Ct - Tipo de Cubierta

| Tipo | Ct | Descripción |
|------|----|----|
| Extensiva | 0.75 | Sustrato 8-15 cm, bajo mantenimiento |
| Semi-intensiva | 0.85 | Sustrato 15-25 cm, mantenimiento medio |
| Intensiva | 1.00 | Sustrato >25 cm, alto mantenimiento, accesible |

### Co - Orientación Solar

| Orientación | Co | Horas sol/año |
|------------|-------|---------------|
| Sur | 1.00 | >2400h |
| Sureste/Suroeste | 0.95 | 2200-2400h |
| Este/Oeste | 0.85 | 2000-2200h |
| Noreste/Noroeste | 0.75 | 1800-2000h |
| Norte | 0.70 | <1800h |

### Ci - Infraestructura Verde

| Tipo | Ci | Aplicación |
|------|-----|-----------|
| Cubierta vegetal intensiva | 1.00 | Jardines accesibles |
| Arbolado aislado | 0.80 | Árboles individuales |
| Arbustos | 0.70 | Vegetación media |
| Cubierta vegetal extensiva | 0.60 | Sedum, aromáticas |
| Vegetación tapizante | 0.50 | Cubiertas completas |
| Pradera | 0.50 | Césped extensivo |
| Jardín vertical | 0.40 | Fachadas verdes |

## Requisitos Mínimos

### PECV Madrid 2025

- **Superficie mínima**: 50 m²
- **Inclinación máxima**: 30°
- **Factor Verde mínimo (extensiva)**: 0.6
- **Factor Verde mínimo (intensiva)**: 0.8
- **Especies nativas**: ≥60%

### MITECO 2024

- **Profundidad sustrato mínima**: 8 cm (extensiva)
- **Peso máximo extensiva**: 150 kg/m²
- **Peso máximo intensiva**: 400 kg/m²
- **Sistema de drenaje**: Obligatorio
- **Membrana impermeable**: 10 años garantía

## Ejemplo de Cálculo

### Caso: Cubierta Extensiva en Madrid Centro

**Datos:**
- Superficie total (Sp): 1000 m²
- Superficie verde (Si): 900 m² (90%)
- Tipo: Extensiva (Ct = 0.75)
- Orientación: Sur (Co = 1.00)
- Infraestructura: Cubierta vegetal extensiva (Ci = 0.60)

**Cálculo:**
```
Σ(Ci × Si) = 0.60 × 900 = 540

FV = (0.75 × 1.00 × 540) / 1000
FV = 405 / 1000
FV = 0.405
```

**Resultado**: FV = 0.405 ❌ **No cumple** (mínimo 0.6)

### Optimización para Cumplimiento

Para alcanzar FV ≥ 0.6 con los mismos parámetros:

**Opción 1**: Aumentar superficie verde
```
Si_necesario = (0.6 × Sp) / (Ct × Co × Ci)
Si_necesario = (0.6 × 1000) / (0.75 × 1.00 × 0.60)
Si_necesario = 600 / 0.45 = 1333 m²
```
❌ No viable (excede Sp)

**Opción 2**: Cambiar a cubierta intensiva (Ci = 1.00)
```
FV = (0.75 × 1.00 × 1.00 × 900) / 1000 = 0.675
```
✅ **Cumple** (FV = 0.675 ≥ 0.6)

**Opción 3**: Usar orientación óptima + área máxima
```
FV = (0.75 × 1.00 × 0.60 × 950) / 1000 = 0.427
```
❌ Todavía no cumple

## Interpretación de Resultados

| Factor Verde | Calificación | Aplicación |
|-------------|--------------|------------|
| FV < 0.4 | Insuficiente | No apto para subvenciones |
| 0.4 ≤ FV < 0.6 | Bajo | Requiere optimización |
| 0.6 ≤ FV < 0.8 | Bueno | Cumple extensiva, apto subvenciones |
| 0.8 ≤ FV < 1.0 | Muy bueno | Cumple intensiva |
| FV ≥ 1.0 | Excelente | Máxima calificación |

## Beneficios del Cumplimiento

### Subvenciones Madrid

- **Centro histórico**: Hasta 80% del coste
- **Ensanche**: 60% del coste
- **Periferia**: 50% del coste
- **Área metropolitana**: 40% del coste

### Certificaciones

- ✅ Cumplimiento PECV Madrid 2025
- ✅ Cumplimiento MITECO 2024
- ✅ Certificación LEED/BREEAM (puntos adicionales)
- ✅ Certificación VERDE GBCe

## Referencias

1. **Ayuntamiento de Madrid** (2025). Plan Estratégico de Calidad del Verde y la Biodiversidad
2. **MITECO** (2024). Estrategia de Infraestructura Verde y Conectividad
3. **CTE** (2022). Código Técnico de la Edificación - DB-HS Salubridad
4. **UNE 41930** (2021). Cubiertas verdes. Características y prestaciones

## Implementación en el Sistema

El sistema calcula automáticamente el Factor Verde mediante la función:

```python
from standards.pecv_madrid import calculate_factor_verde

resultado = calculate_factor_verde(
    area_total_m2=1000,
    area_verde_m2=900,
    tipo_cubierta='extensiva',
    orientacion='sur',
    tipo_infraestructura='cubierta_vegetal_extensiva'
)

# Resultado:
# {
#   'factor_verde': 0.405,
#   'cumple_extensiva': False,
#   'cumple_intensiva': False,
#   'coeficientes': {'ct': 0.75, 'co': 1.0, 'ci': 0.6}
# }
```

## Preguntas Frecuentes

### ¿Qué pasa si no cumplo el FV mínimo?

No podrás optar a subvenciones municipales y el proyecto requerirá modificaciones para cumplir con la normativa PECV.

### ¿Puedo mezclar diferentes tipos de vegetación?

Sí. La fórmula permite calcular Σ(Ci × Si), sumando varios elementos con diferentes coeficientes Ci.

### ¿Cómo afecta la inclinación?

La inclinación >30° descalifica automáticamente el proyecto según PECV Madrid 2025.

### ¿Se revisa anualmente?

El Factor Verde debe mantenerse durante toda la vida útil de la cubierta. Inspecciones cada 5 años.
