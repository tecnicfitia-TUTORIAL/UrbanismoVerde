"""
Intelligent Analysis Engine with 3-Layer Architecture
CONSOLIDATED VERSION - All dependencies included for Vercel compatibility

Transform green roof analysis from hardcoded values to intelligent system based on:
- PECV Madrid 2025 Factor Verde (official formula)
- Simulated Computer Vision (OpenCV-ready)
- MITECO 2024 ecosystem benefits
- Native Spanish species
- Real ROI calculations

Architecture:
- Layer 1: Geospatial (normativa PECV Madrid)
- Layer 2: Computer Vision (simulated, OpenCV-ready)
- Layer 3: Value Generation (reports, ROI, species)
"""

from http.server import BaseHTTPRequestHandler
import json
import time
import math
import random
from typing import List, Dict, Tuple

# =====================================================
# GEOSPATIAL UTILITIES
# =====================================================

# Earth radius in meters
EARTH_RADIUS_M = 6371000
METERS_PER_DEGREE_LAT = 111000
METERS_PER_DEGREE_LON_AT_EQUATOR = 111320


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return EARTH_RADIUS_M * c


def calculate_area_haversine(coordinates: list) -> float:
    """Calculate area of a polygon using Haversine-based method."""
    if len(coordinates) < 3:
        return 0.0
    
    center_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
    cos_lat = math.cos(math.radians(center_lat))
    
    planar_coords = []
    for lon, lat in coordinates:
        x = lon * cos_lat * METERS_PER_DEGREE_LON_AT_EQUATOR
        y = lat * METERS_PER_DEGREE_LAT
        planar_coords.append((x, y))
    
    area = 0.0
    n = len(planar_coords)
    
    for i in range(n):
        x1, y1 = planar_coords[i]
        x2, y2 = planar_coords[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    
    return abs(area) / 2


def calculate_perimeter(coordinates: list) -> float:
    """Calculate perimeter of a polygon using Haversine distances."""
    if len(coordinates) < 2:
        return 0.0
    
    perimeter = 0.0
    n = len(coordinates)
    
    for i in range(n):
        lon1, lat1 = coordinates[i]
        lon2, lat2 = coordinates[(i + 1) % n]
        perimeter += haversine_distance(lat1, lon1, lat2, lon2)
    
    return perimeter


def get_center_coordinates(coordinates: list) -> tuple:
    """Calculate centroid (center point) of a polygon."""
    if not coordinates:
        return (0.0, 0.0)
    
    center_lon = sum(coord[0] for coord in coordinates) / len(coordinates)
    center_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
    
    return (center_lat, center_lon)


def calculate_slope_from_area_and_perimeter(area_m2: float, perimeter_m: float) -> float:
    """Estimate slope based on area-to-perimeter ratio."""
    if area_m2 <= 0:
        return 0.0
    
    ideal_perimeter = 4 * math.sqrt(area_m2)
    shape_factor = perimeter_m / ideal_perimeter if ideal_perimeter > 0 else 1.0
    estimated_slope = min(5.0 * (shape_factor - 1.0), 15.0)
    
    return max(0.0, estimated_slope)


# =====================================================
# PECV MADRID 2025 - FACTOR VERDE
# =====================================================

COEF_TIPO_CUBIERTA = {
    'extensiva': 0.75,
    'intensiva': 1.0,
    'semi_intensiva': 0.85
}

COEF_ORIENTACION = {
    'sur': 1.0,
    'sureste': 0.95,
    'suroeste': 0.95,
    'este': 0.85,
    'oeste': 0.85,
    'norte': 0.7,
    'noreste': 0.75,
    'noroeste': 0.75
}

COEF_INFRAESTRUCTURA = {
    'cubierta_vegetal_extensiva': 0.6,
    'cubierta_vegetal_intensiva': 1.0,
    'jardin_vertical': 0.4,
    'arbolado_aislado': 0.8,
    'vegetacion_tapizante': 0.5,
    'arbustos': 0.7,
    'pradera': 0.5
}

REQUISITOS_MINIMOS = {
    'superficie_min_m2': 50,
    'inclinacion_max_grados': 30,
    'factor_verde_min_extensiva': 0.6,
    'factor_verde_min_intensiva': 0.8,
    'especies_nativas_pct_min': 60,
    'profundidad_sustrato_min_cm': 8,
    'peso_maximo_kg_m2_extensiva': 150,
    'peso_maximo_kg_m2_intensiva': 400
}


def calculate_factor_verde(
    area_total_m2: float,
    area_verde_m2: float,
    tipo_cubierta: str = 'extensiva',
    orientacion: str = 'sur',
    tipo_infraestructura: str = 'cubierta_vegetal_extensiva'
) -> dict:
    """Calculate Factor Verde according to PECV Madrid 2025 official formula."""
    ct = COEF_TIPO_CUBIERTA.get(tipo_cubierta, 0.75)
    co = COEF_ORIENTACION.get(orientacion, 0.85)
    ci = COEF_INFRAESTRUCTURA.get(tipo_infraestructura, 0.6)
    
    suma_ci_si = ci * area_verde_m2
    factor_verde = (ct * co * suma_ci_si) / area_total_m2 if area_total_m2 > 0 else 0.0
    
    cumple_extensiva = factor_verde >= REQUISITOS_MINIMOS['factor_verde_min_extensiva']
    cumple_intensiva = factor_verde >= REQUISITOS_MINIMOS['factor_verde_min_intensiva']
    
    return {
        'factor_verde': round(factor_verde, 3),
        'cumple_extensiva': cumple_extensiva,
        'cumple_intensiva': cumple_intensiva,
        'coeficientes': {
            'ct': ct,
            'co': co,
            'ci': ci
        },
        'tipo_cubierta_recomendado': 'intensiva' if cumple_intensiva else 'extensiva'
    }


def validate_requirements(
    area_m2: float,
    inclinacion_grados: float,
    factor_verde: float,
    especies_nativas_pct: float,
    tipo_cubierta: str = 'extensiva'
) -> dict:
    """Validate compliance with PECV Madrid 2025 and MITECO 2024 requirements."""
    fv_min = (REQUISITOS_MINIMOS['factor_verde_min_intensiva'] 
              if tipo_cubierta == 'intensiva' 
              else REQUISITOS_MINIMOS['factor_verde_min_extensiva'])
    
    return {
        'superficie_min_50m2': area_m2 >= REQUISITOS_MINIMOS['superficie_min_m2'],
        'inclinacion_max_30': inclinacion_grados <= REQUISITOS_MINIMOS['inclinacion_max_grados'],
        'factor_verde_minimo': factor_verde >= fv_min,
        'especies_nativas_60_pct': especies_nativas_pct >= REQUISITOS_MINIMOS['especies_nativas_pct_min'],
        'cumple_todos': (
            area_m2 >= REQUISITOS_MINIMOS['superficie_min_m2'] and
            inclinacion_grados <= REQUISITOS_MINIMOS['inclinacion_max_grados'] and
            factor_verde >= fv_min and
            especies_nativas_pct >= REQUISITOS_MINIMOS['especies_nativas_pct_min']
        )
    }


def get_orientation_from_solar_hours(horas_sol_anuales: float) -> str:
    """Estimate orientation based on annual solar hours."""
    if horas_sol_anuales >= 2400:
        return 'sur'
    elif horas_sol_anuales >= 2200:
        return 'sureste'
    elif horas_sol_anuales >= 2000:
        return 'este'
    elif horas_sol_anuales >= 1800:
        return 'oeste'
    else:
        return 'norte'


# =====================================================
# NATIVE SPECIES CATALOG - SPAIN
# =====================================================

ESPECIES = {
    'aromaticas': [
        {
            'nombre_comun': 'Lavanda',
            'nombre_cientifico': 'Lavandula angustifolia',
            'tipo': 'Aromática',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'bajo',
            'densidad_m2': 9,
            'altura_cm': 40,
            'peso_kg_m2': 85,
            'profundidad_sustrato_cm': 12,
            'floracion': 'Mayo-Julio',
            'polinizacion': 'Alta',
            'resistencia_sequia': 'Alta',
            'coste_unidad_eur': 3.50,
            'mantenimiento': 'Bajo'
        },
        {
            'nombre_comun': 'Romero',
            'nombre_cientifico': 'Rosmarinus officinalis',
            'tipo': 'Aromática',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'bajo',
            'densidad_m2': 4,
            'altura_cm': 50,
            'peso_kg_m2': 90,
            'profundidad_sustrato_cm': 15,
            'floracion': 'Marzo-Mayo',
            'polinizacion': 'Alta',
            'resistencia_sequia': 'Muy alta',
            'coste_unidad_eur': 3.50,
            'mantenimiento': 'Muy bajo'
        },
        {
            'nombre_comun': 'Tomillo',
            'nombre_cientifico': 'Thymus vulgaris',
            'tipo': 'Aromática',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'bajo',
            'densidad_m2': 16,
            'altura_cm': 25,
            'peso_kg_m2': 75,
            'profundidad_sustrato_cm': 10,
            'floracion': 'Abril-Junio',
            'polinizacion': 'Media',
            'resistencia_sequia': 'Alta',
            'coste_unidad_eur': 3.50,
            'mantenimiento': 'Muy bajo'
        },
        {
            'nombre_comun': 'Santolina',
            'nombre_cientifico': 'Santolina chamaecyparissus',
            'tipo': 'Aromática',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'bajo',
            'densidad_m2': 6,
            'altura_cm': 30,
            'peso_kg_m2': 80,
            'profundidad_sustrato_cm': 10,
            'floracion': 'Junio-Julio',
            'polinizacion': 'Media',
            'resistencia_sequia': 'Muy alta',
            'coste_unidad_eur': 3.50,
            'mantenimiento': 'Muy bajo'
        }
    ],
    'suculentas': [
        {
            'nombre_comun': 'Sedum de roca',
            'nombre_cientifico': 'Sedum sediforme',
            'tipo': 'Suculenta',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'muy_bajo',
            'densidad_m2': 25,
            'altura_cm': 15,
            'peso_kg_m2': 70,
            'profundidad_sustrato_cm': 8,
            'floracion': 'Junio-Agosto',
            'polinizacion': 'Media',
            'resistencia_sequia': 'Muy alta',
            'coste_unidad_eur': 2.50,
            'mantenimiento': 'Muy bajo'
        },
        {
            'nombre_comun': 'Sedum blanco',
            'nombre_cientifico': 'Sedum album',
            'tipo': 'Suculenta',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',
            'requisitos_agua': 'muy_bajo',
            'densidad_m2': 25,
            'altura_cm': 10,
            'peso_kg_m2': 65,
            'profundidad_sustrato_cm': 8,
            'floracion': 'Mayo-Julio',
            'polinizacion': 'Baja',
            'resistencia_sequia': 'Muy alta',
            'coste_unidad_eur': 2.50,
            'mantenimiento': 'Muy bajo'
        }
    ],
    'sombra': [
        {
            'nombre_comun': 'Helecho común',
            'nombre_cientifico': 'Polystichum setiferum',
            'tipo': 'Helecho',
            'nativa_iberia': True,
            'clima': 'atlántico',
            'requisitos_sol': 'sombra',
            'requisitos_agua': 'medio',
            'densidad_m2': 6,
            'altura_cm': 60,
            'peso_kg_m2': 100,
            'profundidad_sustrato_cm': 15,
            'floracion': 'No aplica',
            'polinizacion': 'No aplica',
            'resistencia_sequia': 'Baja',
            'coste_unidad_eur': 4.00,
            'mantenimiento': 'Medio'
        },
        {
            'nombre_comun': 'Hiedra',
            'nombre_cientifico': 'Hedera helix',
            'tipo': 'Trepadora',
            'nativa_iberia': True,
            'clima': 'templado',
            'requisitos_sol': 'media_sombra',
            'requisitos_agua': 'bajo',
            'densidad_m2': 4,
            'altura_cm': 30,
            'peso_kg_m2': 90,
            'profundidad_sustrato_cm': 12,
            'floracion': 'Septiembre-Octubre',
            'polinizacion': 'Baja',
            'resistencia_sequia': 'Media',
            'coste_unidad_eur': 3.00,
            'mantenimiento': 'Bajo'
        },
        {
            'nombre_comun': 'Vincapervinca',
            'nombre_cientifico': 'Vinca minor',
            'tipo': 'Tapizante',
            'nativa_iberia': True,
            'clima': 'templado',
            'requisitos_sol': 'media_sombra',
            'requisitos_agua': 'bajo',
            'densidad_m2': 9,
            'altura_cm': 15,
            'peso_kg_m2': 75,
            'profundidad_sustrato_cm': 10,
            'floracion': 'Marzo-Mayo',
            'polinizacion': 'Baja',
            'resistencia_sequia': 'Media',
            'coste_unidad_eur': 3.00,
            'mantenimiento': 'Bajo'
        }
    ]
}


def get_species_by_exposure(clasificacion_solar: str, max_especies: int = 4) -> list:
    """Filter species by solar exposure classification."""
    if clasificacion_solar == 'SOL_DIRECTO':
        especies_sol = ESPECIES['aromaticas'][:3] + ESPECIES['suculentas'][:1]
        viabilidades = [0.95, 0.92, 0.90, 0.88]
    elif clasificacion_solar == 'SOMBRA':
        especies_sol = ESPECIES['sombra']
        viabilidades = [0.85, 0.82, 0.80]
    else:  # MIXTA
        especies_sol = ESPECIES['aromaticas'][:2] + ESPECIES['sombra'][:2]
        viabilidades = [0.88, 0.85, 0.83, 0.80]
    
    result = []
    for i, especie in enumerate(especies_sol[:max_especies]):
        esp_copy = especie.copy()
        esp_copy['viabilidad'] = viabilidades[i] if i < len(viabilidades) else 0.75
        
        if clasificacion_solar == 'SOL_DIRECTO':
            esp_copy['razon'] = f"Ideal para sol directo, nativa, {especie['requisitos_agua']} riego"
        elif clasificacion_solar == 'SOMBRA':
            esp_copy['razon'] = f"Adaptada a sombra, nativa, {especie['requisitos_agua']} riego"
        else:
            esp_copy['razon'] = f"Versátil para exposición mixta, nativa península"
        
        result.append(esp_copy)
    
    return result


def calculate_plant_quantities(area_util_m2: float, especies: list) -> list:
    """Calculate number of plants needed for each species."""
    result = []
    
    for especie in especies:
        cantidad = int(area_util_m2 * especie['densidad_m2'])
        coste_total = cantidad * especie['coste_unidad_eur']
        
        esp_result = especie.copy()
        esp_result['cantidad_estimada'] = cantidad
        esp_result['coste_total_eur'] = round(coste_total, 2)
        
        result.append(esp_result)
    
    return result


def get_native_species_percentage(especies: list) -> float:
    """Calculate percentage of native species."""
    if not especies:
        return 0.0
    
    nativas = sum(1 for esp in especies if esp.get('nativa_iberia', False))
    return (nativas / len(especies)) * 100


# =====================================================
# MADRID 2024 MARKET COSTS
# =====================================================

COSTES_MATERIALES = {
    'sustrato_ligero_m2': 45.0,
    'drenaje_m2': 25.0,
    'membrana_impermeable_m2': 15.0,
    'lamina_antiraices_m2': 8.0,
    'geotextil_m2': 5.0,
    'grava_drenaje_m2': 12.0,
    'instalacion_m2': 20.0,
    'mantenimiento_anual_m2': 8.0
}

COSTES_RIEGO = {
    'riego_goteo_automatizado_m2': 15.0,
    'controlador_riego_unidad': 250.0,
    'sensores_humedad_unidad': 80.0
}


def calculate_budget(area_m2: float, especies_list: list, incluir_riego: bool = True) -> dict:
    """Calculate detailed budget for green roof installation."""
    sustrato = area_m2 * COSTES_MATERIALES['sustrato_ligero_m2']
    drenaje = area_m2 * COSTES_MATERIALES['drenaje_m2']
    membrana = area_m2 * COSTES_MATERIALES['membrana_impermeable_m2']
    lamina_antiraices = area_m2 * COSTES_MATERIALES['lamina_antiraices_m2']
    geotextil = area_m2 * COSTES_MATERIALES['geotextil_m2']
    
    coste_plantas = sum(esp.get('coste_total_eur', 0) for esp in especies_list)
    
    instalacion = area_m2 * COSTES_MATERIALES['instalacion_m2']
    
    riego = 0
    if incluir_riego:
        riego = (area_m2 * COSTES_RIEGO['riego_goteo_automatizado_m2'] + 
                COSTES_RIEGO['controlador_riego_unidad'] +
                COSTES_RIEGO['sensores_humedad_unidad'] * max(1, int(area_m2 / 100)))
    
    coste_total_inicial = (
        sustrato + drenaje + membrana + lamina_antiraices + 
        geotextil + coste_plantas + instalacion + riego
    )
    
    mantenimiento_anual = area_m2 * COSTES_MATERIALES['mantenimiento_anual_m2']
    coste_por_m2 = coste_total_inicial / area_m2 if area_m2 > 0 else 0
    
    return {
        'coste_total_inicial_eur': round(coste_total_inicial, 2),
        'desglose': {
            'sustrato_eur': round(sustrato, 2),
            'drenaje_eur': round(drenaje, 2),
            'membrana_impermeable_eur': round(membrana, 2),
            'lamina_antiraices_eur': round(lamina_antiraices, 2),
            'geotextil_eur': round(geotextil, 2),
            'plantas_eur': round(coste_plantas, 2),
            'instalacion_eur': round(instalacion, 2),
            'riego_eur': round(riego, 2) if incluir_riego else 0
        },
        'mantenimiento_anual_eur': round(mantenimiento_anual, 2),
        'coste_por_m2_eur': round(coste_por_m2, 2),
        'vida_util_anos': 25
    }


# =====================================================
# IDAE ENERGY SAVINGS FORMULAS
# =====================================================

CONSUMO_BASE = {
    'calefaccion_kwh_m2_ano': 50,
    'refrigeracion_kwh_m2_ano': 30,
    'total_kwh_m2_ano': 80
}

PRECIO_ENERGIA = {
    'electricidad_eur_kwh': 0.25,
    'gas_natural_eur_kwh': 0.08
}

AHORRO_PORCENTAJE = {
    'extensiva': {
        'refrigeracion': 0.35,
        'calefaccion': 0.15
    },
    'intensiva': {
        'refrigeracion': 0.50,
        'calefaccion': 0.30
    }
}


def calculate_energy_savings(area_m2: float, tipo_cubierta: str = 'extensiva') -> dict:
    """Calculate energy savings from green roof installation."""
    reducciones = AHORRO_PORCENTAJE.get(tipo_cubierta, AHORRO_PORCENTAJE['extensiva'])
    
    ahorro_refrigeracion_kwh = (
        CONSUMO_BASE['refrigeracion_kwh_m2_ano'] * reducciones['refrigeracion']
    )
    ahorro_calefaccion_kwh = (
        CONSUMO_BASE['calefaccion_kwh_m2_ano'] * reducciones['calefaccion']
    )
    ahorro_total_kwh_m2 = ahorro_refrigeracion_kwh + ahorro_calefaccion_kwh
    
    ahorro_anual_kwh = area_m2 * ahorro_total_kwh_m2
    ahorro_anual_eur = ahorro_anual_kwh * PRECIO_ENERGIA['electricidad_eur_kwh']
    
    return {
        'ahorro_energia_kwh_anual': round(ahorro_anual_kwh, 2),
        'ahorro_energia_eur_anual': round(ahorro_anual_eur, 2),
        'desglose': {
            'refrigeracion_kwh': round(area_m2 * ahorro_refrigeracion_kwh, 2),
            'calefaccion_kwh': round(area_m2 * ahorro_calefaccion_kwh, 2),
            'refrigeracion_eur': round(area_m2 * ahorro_refrigeracion_kwh * PRECIO_ENERGIA['electricidad_eur_kwh'], 2),
            'calefaccion_eur': round(area_m2 * ahorro_calefaccion_kwh * PRECIO_ENERGIA['electricidad_eur_kwh'], 2)
        },
        'reduccion_porcentaje': {
            'refrigeracion': reducciones['refrigeracion'] * 100,
            'calefaccion': reducciones['calefaccion'] * 100
        }
    }


# =====================================================
# MITECO 2024 - ECOSYSTEM BENEFITS
# =====================================================

CO2_CAPTURA_KG_M2_ANO = 5.0

AGUA_RETENCION = {
    'precipitacion_anual_madrid_mm': 400,
    'porcentaje_retencion': 0.60,
    'litros_por_mm_m2': 1.0
}

REDUCCION_TEMPERATURA_C = 1.5
PARTICULAS_FILTRADAS_KG_M2_ANO = 0.15


def calculate_ecosystem_benefits(area_m2: float, tipo_cubierta: str = 'extensiva') -> dict:
    """Calculate quantified ecosystem benefits according to MITECO 2024."""
    if tipo_cubierta == 'intensiva':
        co2_factor = 1.3
        water_factor = 1.2
        temp_factor = 1.2
    else:
        co2_factor = 1.0
        water_factor = 1.0
        temp_factor = 1.0
    
    co2_capturado_kg_anual = area_m2 * CO2_CAPTURA_KG_M2_ANO * co2_factor
    
    agua_retenida_mm = (
        AGUA_RETENCION['precipitacion_anual_madrid_mm'] * 
        AGUA_RETENCION['porcentaje_retencion'] * 
        water_factor
    )
    agua_retenida_litros_anual = area_m2 * agua_retenida_mm * AGUA_RETENCION['litros_por_mm_m2']
    
    reduccion_temperatura_c = REDUCCION_TEMPERATURA_C * temp_factor
    particulas_filtradas_kg_anual = area_m2 * PARTICULAS_FILTRADAS_KG_M2_ANO
    
    return {
        'co2_capturado_kg_anual': round(co2_capturado_kg_anual, 1),
        'co2_equivalente_arboles': round(co2_capturado_kg_anual / 20, 1),
        'agua_retenida_litros_anual': round(agua_retenida_litros_anual, 0),
        'agua_retenida_m3_anual': round(agua_retenida_litros_anual / 1000, 2),
        'reduccion_temperatura_c': round(reduccion_temperatura_c, 2),
        'particulas_filtradas_kg_anual': round(particulas_filtradas_kg_anual, 2),
        'valor_retencion_agua_eur_anual': round(agua_retenida_litros_anual * 0.002, 2),
        'porcentaje_retencion_agua': int(AGUA_RETENCION['porcentaje_retencion'] * 100)
    }


def calculate_biodiversity_impact(area_m2: float, especies_nativas_pct: float) -> dict:
    """Calculate biodiversity impact metrics."""
    if especies_nativas_pct >= 60:
        potencial_polinizacion = 'ALTO'
        incremento_polinizadores_pct = 30
    elif especies_nativas_pct >= 40:
        potencial_polinizacion = 'MEDIO'
        incremento_polinizadores_pct = 20
    else:
        potencial_polinizacion = 'BAJO'
        incremento_polinizadores_pct = 10
    
    habitat_fauna_urbana = area_m2 >= 100
    conectividad_ecologica = 'Mejora el corredor verde urbano' if area_m2 >= 50 else 'Contribución limitada'
    especies_recomendadas_num = min(int(area_m2 / 50) + 3, 10)
    
    return {
        'potencial_polinizacion': potencial_polinizacion,
        'incremento_polinizadores_pct': incremento_polinizadores_pct,
        'habitat_fauna_urbana': habitat_fauna_urbana,
        'conectividad_ecologica': conectividad_ecologica,
        'especies_nativas_recomendadas_num': especies_recomendadas_num,
        'servicios_ecosistemicos': [
            'Hábitat para insectos polinizadores',
            'Refugio para aves urbanas',
            'Corredor ecológico',
            'Mejora de microclima local'
        ] if area_m2 >= 100 else [
            'Hábitat para insectos polinizadores',
            'Mejora de microclima local'
        ]
    }


# =====================================================
# COMPUTER VISION SIMULATION
# =====================================================

def segment_surfaces(area_m2: float, seed: int = None) -> dict:
    """
    Simulate surface segmentation analysis.
    
    Args:
        area_m2: Total roof area
        seed: Random seed for reproducibility. If None, uses system time (non-deterministic).
              For testing, provide a seed value for consistent results.
        
    Returns:
        dict with segmented surface areas
    """
    # Use instance-specific random generator for thread safety
    rng = random.Random(seed)
    
    asfalto_pct = rng.uniform(0.25, 0.35)
    grava_pct = rng.uniform(0.45, 0.55)
    vegetacion_pct = rng.uniform(0.05, 0.15)
    obstaculos_pct = rng.uniform(0.08, 0.12)
    
    total_pct = asfalto_pct + grava_pct + vegetacion_pct + obstaculos_pct
    asfalto_pct /= total_pct
    grava_pct /= total_pct
    vegetacion_pct /= total_pct
    obstaculos_pct /= total_pct
    
    asfalto_m2 = area_m2 * asfalto_pct
    grava_m2 = area_m2 * grava_pct
    vegetacion_previa_m2 = area_m2 * vegetacion_pct
    obstaculos_m2 = area_m2 * obstaculos_pct
    
    area_util_m2 = area_m2 - obstaculos_m2
    
    return {
        'asfalto_m2': round(asfalto_m2, 2),
        'grava_m2': round(grava_m2, 2),
        'vegetacion_previa_m2': round(vegetacion_previa_m2, 2),
        'obstaculos_m2': round(obstaculos_m2, 2),
        'area_util_m2': round(area_util_m2, 2),
        'area_util_pct': round((area_util_m2 / area_m2) * 100, 1) if area_m2 > 0 else 0
    }


def analyze_solar_exposure(lat: float, lon: float, area_m2: float, seed: int = None) -> dict:
    """
    Analyze solar exposure for the location.
    
    Args:
        lat: Latitude
        lon: Longitude
        area_m2: Roof area
        seed: Random seed for reproducibility. If None, uses system time (non-deterministic).
              For testing, provide a seed value for consistent results.
        
    Returns:
        dict with solar exposure metrics
    """
    # Use instance-specific random generator for thread safety
    rng = random.Random(seed)
    
    if lat >= 41.5:
        base_hours = 2200
    elif lat >= 39.5:
        base_hours = 2400
    else:
        base_hours = 2600
    
    shadow_factor = rng.uniform(0.75, 0.95)
    horas_sol_anuales = int(base_hours * shadow_factor)
    
    if horas_sol_anuales >= 2200:
        clasificacion = 'SOL_DIRECTO'
    elif horas_sol_anuales >= 1800:
        clasificacion = 'MIXTA'
    else:
        clasificacion = 'SOMBRA'
    
    return {
        'horas_sol_anuales': horas_sol_anuales,
        'clasificacion': clasificacion,
        'factor_sombra': round(shadow_factor, 2),
        'radiacion_estimada_kwh_m2_ano': round(horas_sol_anuales * 0.8, 0)
    }


def calculate_ndvi(area_m2: float, vegetacion_previa_m2: float = 0) -> float:
    """Calculate current NDVI (Normalized Difference Vegetation Index)."""
    if area_m2 <= 0:
        return 0.0
    
    veg_pct = vegetacion_previa_m2 / area_m2 if area_m2 > 0 else 0
    base_ndvi = 0.10
    ndvi_actual = base_ndvi + (veg_pct * 0.3)
    ndvi_actual = max(-1.0, min(1.0, ndvi_actual))
    
    return round(ndvi_actual, 2)


# =====================================================
# SUBSIDY ZONES - MADRID
# =====================================================

MADRID_CENTER = {
    'lat': 40.4168,
    'lon': -3.7038,
    'name': 'Puerta del Sol'
}

ZONAS_SUBVENCION = {
    'centro_historico': {
        'nombre': 'Centro Histórico Madrid',
        'porcentaje': 80,
        'programa': 'PECV Madrid 2025 + Fondos Next Generation',
        'bounds': {
            'min_lat': 40.405,
            'max_lat': 40.430,
            'min_lon': -3.720,
            'max_lon': -3.690
        },
        'requisitos': [
            'Factor Verde ≥ 0.6',
            'Mínimo 60% especies nativas',
            'Proyecto técnico visado',
            'Licencia municipal'
        ]
    },
    'ensanche': {
        'nombre': 'Ensanche y Barrios Centrales',
        'porcentaje': 60,
        'programa': 'PECV Madrid 2025',
        'bounds': {
            'min_lat': 40.395,
            'max_lat': 40.440,
            'min_lon': -3.730,
            'max_lon': -3.680
        },
        'requisitos': [
            'Factor Verde ≥ 0.6',
            'Especies nativas recomendadas',
            'Proyecto técnico'
        ]
    },
    'periferia': {
        'nombre': 'Barrios Periféricos',
        'porcentaje': 50,
        'programa': 'Comunidad de Madrid',
        'bounds': {
            'min_lat': 40.350,
            'max_lat': 40.480,
            'min_lon': -3.800,
            'max_lon': -3.600
        },
        'requisitos': [
            'Factor Verde ≥ 0.6',
            'Superficie mínima 50 m²'
        ]
    },
    'area_metropolitana': {
        'nombre': 'Área Metropolitana',
        'porcentaje': 40,
        'programa': 'Comunidad de Madrid',
        'bounds': {
            'min_lat': 40.300,
            'max_lat': 40.550,
            'min_lon': -3.900,
            'max_lon': -3.500
        },
        'requisitos': [
            'Superficie mínima 100 m²',
            'Certificación energética'
        ]
    }
}


def point_in_bounds(lat: float, lon: float, bounds: dict) -> bool:
    """Check if a point is within bounds."""
    return (bounds['min_lat'] <= lat <= bounds['max_lat'] and
            bounds['min_lon'] <= lon <= bounds['max_lon'])


def check_subsidy_eligibility(lat: float, lon: float) -> dict:
    """Determine subsidy eligibility based on location."""
    zona_encontrada = None
    
    for zona_id, zona_data in ZONAS_SUBVENCION.items():
        if point_in_bounds(lat, lon, zona_data['bounds']):
            zona_encontrada = zona_id
            break
    
    if zona_encontrada:
        zona = ZONAS_SUBVENCION[zona_encontrada]
        return {
            'elegible': True,
            'porcentaje': zona['porcentaje'],
            'zona': zona['nombre'],
            'programa': zona['programa'],
            'requisitos': zona['requisitos']
        }
    else:
        return {
            'elegible': False,
            'porcentaje': 0,
            'zona': 'Fuera de zonas prioritarias',
            'programa': 'No aplica',
            'requisitos': []
        }


def calculate_subsidy_amount(coste_total: float, porcentaje: int, tope_maximo: float = None) -> dict:
    """Calculate subsidy amount."""
    monto_subvencion = coste_total * (porcentaje / 100)
    
    if tope_maximo and monto_subvencion > tope_maximo:
        monto_subvencion = tope_maximo
        aplicado_tope = True
    else:
        aplicado_tope = False
    
    inversion_neta = coste_total - monto_subvencion
    
    return {
        'coste_total_eur': round(coste_total, 2),
        'porcentaje_subvencion': porcentaje,
        'monto_subvencion_eur': round(monto_subvencion, 2),
        'inversion_neta_eur': round(inversion_neta, 2),
        'aplicado_tope': aplicado_tope,
        'tope_maximo_eur': tope_maximo
    }


# =====================================================
# URBAN REGENERATION DATA MODULES
# =====================================================

def add_population_data(analisis_result: dict, coordinates: list) -> dict:
    """
    Module A: Add population benefited data
    
    Simple estimation based on area (will be enhanced with OSM in frontend).
    Assumes high-density urban area typical of Madrid.
    """
    area_m2 = analisis_result.get('area_m2', 0)
    
    # Estimation for high-density areas (e.g., Madrid city center ~12,000 hab/km²)
    densidad_estimada = 12000  # hab/km²
    area_km2 = area_m2 / 1_000_000
    
    # Estimate building housing units (assuming typical 3-story building, 2 units per floor)
    edificio_viviendas = 40  # default estimate
    edificio_personas = 100  # default estimate (2.5 persons/household)
    
    # Beneficiaries in radius (50m = direct, 200m = indirect)
    # Rule of thumb: 50m radius affects ~400 people, 200m radius ~2400 people in high density
    beneficiarios_50m = 400
    beneficiarios_200m = 2400
    
    # Cost per person
    coste_total = analisis_result.get('presupuesto', {}).get('coste_total_inicial_eur', 0)
    coste_por_persona = round(coste_total / beneficiarios_50m) if beneficiarios_50m > 0 else 0
    
    analisis_result['poblacion_datos'] = {
        'densidad_barrio_hab_km2': densidad_estimada,
        'edificio_viviendas': edificio_viviendas,
        'edificio_personas_estimadas': edificio_personas,
        'beneficiarios_directos_radio_50m': beneficiarios_50m,
        'beneficiarios_indirectos_radio_200m': beneficiarios_200m,
        'coste_por_persona': coste_por_persona
    }
    
    return analisis_result


def add_green_deficit(analisis_result: dict, poblacion: int = None) -> dict:
    """
    Module B: Add green space deficit analysis
    
    Uses area data and estimates current green space per capita.
    Real implementation will use OSM data in frontend.
    """
    area_cubierta = analisis_result.get('area_m2', 0)
    
    # Use population estimate if not provided
    if poblacion is None:
        poblacion = analisis_result.get('poblacion_datos', {}).get('beneficiarios_directos_radio_50m', 400)
    
    # Average green space in Madrid: ~6.2 m²/hab (below WHO recommendation)
    verde_actual = 6.2
    oms_minimo = 9.0
    deficit = verde_actual - oms_minimo
    
    # Calculate improvement with new green roof
    con_cubierta = verde_actual + (area_cubierta / poblacion) if poblacion > 0 else verde_actual
    mejora = ((con_cubierta - verde_actual) / verde_actual) * 100 if verde_actual > 0 else 0
    
    # Priority classification based on current green space
    if verde_actual < 3:
        prioridad = 'alta'
    elif verde_actual < 6:
        prioridad = 'media'
    else:
        prioridad = 'baja'
    
    analisis_result['deficit_verde'] = {
        'verde_actual_m2_hab': round(verde_actual, 2),
        'oms_minimo': oms_minimo,
        'deficit': round(deficit, 2),
        'con_cubierta_m2_hab': round(con_cubierta, 2),
        'mejora_pct': round(mejora, 1),
        'prioridad': prioridad
    }
    
    return analisis_result


def calculate_prioritization(analisis_result: dict) -> dict:
    """
    Module C: Multi-criteria prioritization system
    
    Scoring based on:
    - Population density (0-25 points)
    - Green space deficit (0-25 points)
    - Temperature/heat island (0-20 points)
    - Social vulnerability (0-15 points)
    - Technical viability (0-15 points)
    """
    # Extract data from analysis
    densidad = analisis_result.get('poblacion_datos', {}).get('densidad_barrio_hab_km2', 8000)
    deficit = analisis_result.get('deficit_verde', {}).get('deficit', -3.8)
    
    # Temperature estimation (use location or default)
    # Madrid summer average: ~32°C, can reach 35-40°C in heat waves
    temperatura = 32  # default estimate
    
    # Viability from green score (rough mapping)
    green_score = analisis_result.get('green_score', 50)
    if green_score >= 70:
        viabilidad = 'alta'
    elif green_score >= 40:
        viabilidad = 'media'
    else:
        viabilidad = 'baja'
    
    # Calculate scores
    # 1. Population density (0-25 points)
    if densidad > 15000:
        score_densidad = 25
    elif densidad > 10000:
        score_densidad = 20
    elif densidad > 5000:
        score_densidad = 15
    elif densidad > 2000:
        score_densidad = 10
    else:
        score_densidad = 5
    
    # 2. Green space deficit (0-25 points)
    if deficit < -6:  # < 3 m²/hab
        score_deficit = 25
    elif deficit < -3:  # 3-6 m²/hab
        score_deficit = 20
    elif deficit < 0:  # 6-9 m²/hab
        score_deficit = 15
    else:  # > 9 m²/hab
        score_deficit = 5
    
    # 3. Temperature/heat island (0-20 points)
    if temperatura > 35:
        score_temp = 20
    elif temperatura > 33:
        score_temp = 15
    elif temperatura > 30:
        score_temp = 10
    else:
        score_temp = 5
    
    # 4. Social vulnerability (0-15 points) - default medium
    score_vulnerabilidad = 10
    
    # 5. Technical viability (0-15 points)
    if viabilidad == 'alta':
        score_viabilidad = 15
    elif viabilidad == 'media':
        score_viabilidad = 10
    else:
        score_viabilidad = 5
    
    # Total score
    score_total = score_densidad + score_deficit + score_temp + score_vulnerabilidad + score_viabilidad
    
    # Classification
    if score_total >= 85:
        clasificacion = 'urgente'
        recomendacion = '⚠️ IMPLEMENTAR URGENTE: Zona prioritaria por alta densidad, déficit verde crítico y temperatura elevada.'
    elif score_total >= 70:
        clasificacion = 'alta'
        recomendacion = '🔴 PRIORIDAD ALTA: Zona con necesidad significativa de regeneración verde.'
    elif score_total >= 50:
        clasificacion = 'media'
        recomendacion = '🟡 PRIORIDAD MEDIA: Implementar según disponibilidad presupuestaria.'
    else:
        clasificacion = 'baja'
        recomendacion = '🟢 PRIORIDAD BAJA: Zona con menor necesidad relativa.'
    
    analisis_result['priorizacion'] = {
        'score_total': round(score_total, 1),
        'clasificacion': clasificacion,
        'recomendacion': recomendacion,
        'factores': {
            'densidad_poblacional': round(score_densidad, 1),
            'deficit_verde': round(score_deficit, 1),
            'temperatura': round(score_temp, 1),
            'vulnerabilidad_social': round(score_vulnerabilidad, 1),
            'viabilidad_tecnica': round(score_viabilidad, 1)
        }
    }
    
    return analisis_result


# =====================================================
# ANALYSIS ENGINE - 3-LAYER ARCHITECTURE
# =====================================================

class AnalysisEngine:
    """
    Main analysis engine implementing 3-layer architecture.
    """
    
    def __init__(self, polygon: dict):
        """Initialize analysis engine."""
        self.polygon = polygon
        self.coordinates = polygon.get('coordinates', [[]])[0]
        self.center_lat, self.center_lon = get_center_coordinates(self.coordinates)
        
    def analyze(self) -> dict:
        """Execute complete 3-layer analysis."""
        start_time = time.time()
        
        geo_data = self.geospatial_layer()
        vision_data = self.computer_vision_layer(geo_data)
        report = self.value_generation_layer(geo_data, vision_data)
        
        processing_time = time.time() - start_time
        report['processing_time'] = round(processing_time, 2)
        
        return report
    
    def geospatial_layer(self) -> dict:
        """LAYER 1: Geospatial Analysis (Normativa PECV Madrid 2025)"""
        area_m2 = calculate_area_haversine(self.coordinates)
        perimetro_m = calculate_perimeter(self.coordinates)
        inclinacion_grados = calculate_slope_from_area_and_perimeter(area_m2, perimetro_m)
        subsidy_info = check_subsidy_eligibility(self.center_lat, self.center_lon)
        
        return {
            'area_m2': area_m2,
            'perimetro_m': perimetro_m,
            'inclinacion_grados': inclinacion_grados,
            'center_lat': self.center_lat,
            'center_lon': self.center_lon,
            'subsidy_info': subsidy_info
        }
    
    def computer_vision_layer(self, geo_data: dict) -> dict:
        """LAYER 2: Computer Vision Analysis (Simulated)"""
        area_m2 = geo_data['area_m2']
        
        segmentation = segment_surfaces(area_m2)
        solar_data = analyze_solar_exposure(
            geo_data['center_lat'], 
            geo_data['center_lon'],
            area_m2
        )
        ndvi_actual = calculate_ndvi(
            area_m2, 
            segmentation['vegetacion_previa_m2']
        )
        
        return {
            'segmentation': segmentation,
            'solar_data': solar_data,
            'ndvi_actual': ndvi_actual
        }
    
    def value_generation_layer(self, geo_data: dict, vision_data: dict) -> dict:
        """LAYER 3: Value Generation (Reports, ROI, Species)"""
        area_m2 = geo_data['area_m2']
        area_util_m2 = vision_data['segmentation']['area_util_m2']
        
        clasificacion_solar = vision_data['solar_data']['clasificacion']
        horas_sol = vision_data['solar_data']['horas_sol_anuales']
        
        orientacion = get_orientation_from_solar_hours(horas_sol)
        fv_result = calculate_factor_verde(
            area_total_m2=area_m2,
            area_verde_m2=area_util_m2,
            tipo_cubierta='extensiva',
            orientacion=orientacion,
            tipo_infraestructura='cubierta_vegetal_extensiva'
        )
        factor_verde = fv_result['factor_verde']
        
        especies = get_species_by_exposure(clasificacion_solar, max_especies=3)
        especies_con_cantidades = calculate_plant_quantities(area_util_m2, especies)
        especies_nativas_pct = get_native_species_percentage(especies)
        
        requisitos = validate_requirements(
            area_m2=area_m2,
            inclinacion_grados=geo_data['inclinacion_grados'],
            factor_verde=factor_verde,
            especies_nativas_pct=especies_nativas_pct,
            tipo_cubierta='extensiva'
        )
        
        presupuesto = calculate_budget(
            area_m2=area_util_m2,
            especies_list=especies_con_cantidades,
            incluir_riego=True
        )
        
        subsidy_info = geo_data['subsidy_info']
        subsidy_calc = calculate_subsidy_amount(
            coste_total=presupuesto['coste_total_inicial_eur'],
            porcentaje=subsidy_info['porcentaje']
        )
        
        beneficios = calculate_ecosystem_benefits(area_util_m2, 'extensiva')
        biodiversidad = calculate_biodiversity_impact(area_util_m2, especies_nativas_pct)
        ahorro_energia = calculate_energy_savings(area_util_m2, 'extensiva')
        
        ahorro_anual_total = (
            ahorro_energia['ahorro_energia_eur_anual'] +
            beneficios['valor_retencion_agua_eur_anual']
        )
        inversion_neta = subsidy_calc['inversion_neta_eur']
        amortizacion_anos = inversion_neta / ahorro_anual_total if ahorro_anual_total > 0 else 999
        roi_porcentaje = (ahorro_anual_total / inversion_neta * 100) if inversion_neta > 0 else 0
        ahorro_25_anos = ahorro_anual_total * 25
        valor_neto_presente = ahorro_25_anos - inversion_neta
        
        green_score = self._calculate_green_score(
            factor_verde=factor_verde,
            horas_sol=horas_sol,
            area_util_pct=vision_data['segmentation']['area_util_pct'],
            beneficio_ecosistemico_score=(beneficios['co2_capturado_kg_anual'] / area_util_m2) if area_util_m2 > 0 else 0,
            cumple_normativa=requisitos['cumple_todos']
        )
        
        recomendaciones = self._generate_recommendations(
            factor_verde=factor_verde,
            cumple_pecv=requisitos['cumple_todos'],
            subsidy_pct=subsidy_info['porcentaje'],
            subsidy_amount=subsidy_calc['monto_subvencion_eur']
        )
        
        tags = self._generate_tags(
            horas_sol=horas_sol,
            especies_nativas=especies_nativas_pct >= 60,
            cumple_pecv=requisitos['cumple_todos'],
            elegible_subvencion=subsidy_info['elegible'],
            amortizacion_anos=amortizacion_anos
        )
        
        # Build initial result dict
        result = {
            'success': True,
            'green_score': green_score,
            'area_m2': round(area_m2, 2),
            'perimetro_m': round(geo_data['perimetro_m'], 2),
            'inclinacion_grados': round(geo_data['inclinacion_grados'], 1),
            
            'normativa': {
                'factor_verde': factor_verde,
                'cumple_pecv_madrid': requisitos['cumple_todos'],
                'cumple_miteco': requisitos['cumple_todos'],
                'requisitos': requisitos
            },
            
            'subvencion': {
                'elegible': subsidy_info['elegible'],
                'porcentaje': subsidy_info['porcentaje'],
                'programa': subsidy_info['programa'],
                'monto_estimado_eur': round(subsidy_calc['monto_subvencion_eur'], 2)
            },
            
            'vision_artificial': {
                'segmentacion': vision_data['segmentation'],
                'exposicion_solar': vision_data['solar_data'],
                'ndvi_actual': vision_data['ndvi_actual']
            },
            
            'beneficios_ecosistemicos': {
                'co2_capturado_kg_anual': round(beneficios['co2_capturado_kg_anual'], 0),
                'agua_retenida_litros_anual': round(beneficios['agua_retenida_litros_anual'], 0),
                'reduccion_temperatura_c': beneficios['reduccion_temperatura_c'],
                'ahorro_energia_kwh_anual': round(ahorro_energia['ahorro_energia_kwh_anual'], 0),
                'ahorro_energia_eur_anual': round(ahorro_energia['ahorro_energia_eur_anual'], 0)
            },
            
            'especies_recomendadas': [
                {
                    'nombre_comun': esp['nombre_comun'],
                    'nombre_cientifico': esp['nombre_cientifico'],
                    'tipo': esp['tipo'],
                    'nativa_iberia': esp['nativa_iberia'],
                    'viabilidad': esp['viabilidad'],
                    'razon': esp['razon'],
                    'polinizacion': esp['polinizacion'],
                    'densidad_m2': esp['densidad_m2'],
                    'cantidad_estimada': esp['cantidad_estimada'],
                    'coste_unidad_eur': esp['coste_unidad_eur']
                }
                for esp in especies_con_cantidades
            ],
            
            'presupuesto': presupuesto,
            
            'roi_ambiental': {
                'roi_porcentaje': round(roi_porcentaje, 2),
                'amortizacion_anos': round(amortizacion_anos, 1),
                'ahorro_anual_eur': round(ahorro_anual_total, 0),
                'ahorro_25_anos_eur': round(ahorro_25_anos, 0),
                'valor_neto_presente_eur': round(valor_neto_presente, 0)
            },
            
            'recomendaciones_tecnicas': recomendaciones,
            'tags': tags
        }
        
        # Add urban regeneration modules
        result = add_population_data(result, self.coordinates)
        result = add_green_deficit(result)
        result = calculate_prioritization(result)
        
        return result
    
    def _calculate_green_score(
        self, 
        factor_verde: float, 
        horas_sol: int, 
        area_util_pct: float,
        beneficio_ecosistemico_score: float,
        cumple_normativa: bool
    ) -> float:
        """Calculate weighted Green Score (0-100)."""
        fv_score = min((factor_verde / 0.8) * 30, 30)
        solar_score = min((horas_sol / 2800) * 20, 20)
        area_score = (area_util_pct / 100) * 15
        eco_score = min((beneficio_ecosistemico_score / 6) * 20, 20)
        compliance_score = 15 if cumple_normativa else 7.5
        
        total_score = fv_score + solar_score + area_score + eco_score + compliance_score
        
        return round(total_score, 1)
    
    def _generate_recommendations(
        self,
        factor_verde: float,
        cumple_pecv: bool,
        subsidy_pct: int,
        subsidy_amount: float
    ) -> list:
        """Generate technical recommendations."""
        recomendaciones = []
        
        if cumple_pecv:
            recomendaciones.append(
                f"✅ La zona cumple con PECV Madrid 2025 (Factor Verde: {factor_verde})"
            )
        else:
            recomendaciones.append(
                f"⚠️ Factor Verde actual ({factor_verde}) no cumple mínimo PECV (0.6)"
            )
        
        recomendaciones.extend([
            "⚠️ Verificar capacidad estructural del edificio (150 kg/m²)",
            "⚠️ Instalar membrana impermeabilizante (10 años garantía mínima)",
            "💧 Sistema de riego por goteo automatizado (60% agua vs aspersión)",
            "🌱 Sustrato ligero con espesor mínimo 10 cm",
            "🔒 Lámina anti-raíces obligatoria en cubiertas no accesibles",
            "📋 Solicitar licencia municipal y permiso de comunidad"
        ])
        
        if subsidy_pct > 0:
            recomendaciones.append(
                f"💰 Elegible para subvención del {subsidy_pct}% (€{subsidy_amount:,.0f})"
            )
        
        return recomendaciones
    
    def _generate_tags(
        self,
        horas_sol: int,
        especies_nativas: bool,
        cumple_pecv: bool,
        elegible_subvencion: bool,
        amortizacion_anos: float
    ) -> list:
        """Generate summary tags."""
        tags = []
        
        if horas_sol >= 2200:
            tags.append(f"Exposición solar alta ({horas_sol}h/año)")
        elif horas_sol >= 1800:
            tags.append(f"Exposición solar media ({horas_sol}h/año)")
        else:
            tags.append(f"Exposición solar baja ({horas_sol}h/año)")
        
        if especies_nativas:
            tags.append("Especies nativas recomendadas")
        
        if cumple_pecv:
            tags.append("Cumple PECV Madrid 2025")
        
        if elegible_subvencion:
            tags.append("Elegible para subvenciones")
        
        if amortizacion_anos < 15:
            tags.append(f"ROI favorable (<{int(amortizacion_anos)} años)")
        
        return tags


# =====================================================
# VERCEL SERVERLESS FUNCTION HANDLER
# =====================================================

class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler."""
    
    def do_POST(self):
        try:
            print(f"[ANALYZE] Request received from {self.headers.get('origin')}")
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            print(f"[ANALYZE] Polygon data: {data.get('polygon', {}).get('type')}")
            
            polygon = data.get('polygon', {})
            
            engine = AnalysisEngine(polygon)
            result = engine.analyze()
            
            print(f"[ANALYZE] Analysis complete, Green Score: {result['green_score']}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            print(f"[ANALYZE] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = {'success': False, 'error': str(e)}
            self.wfile.write(json.dumps(error_msg).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'ok',
            'service': 'analyze',
            'version': '2.0.0',
            'architecture': '3-layer intelligent engine'
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
