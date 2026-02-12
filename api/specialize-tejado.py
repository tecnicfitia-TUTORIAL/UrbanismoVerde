"""
Specialized Rooftop/Terrace Analysis API Endpoint
Implements automatic detection, CTE structural calculations, and specific budgets.

Architecture:
- Building detection through compactness analysis
- CTE DB-SE-AE structural load calculations
- Roof characteristic analysis (type, slope, material, waterproofing)
- Obstacle detection (chimneys, AC units, antennas)
- Specific budget with additional costs
- Technical, economic, and regulatory viability assessment
"""

from http.server import BaseHTTPRequestHandler
import json
import math
from typing import Dict, Any, List, Tuple


# =====================================================
# CTE STRUCTURAL CONSTANTS (DB-SE-AE)
# =====================================================

# CTE DB-SE-AE: Código Técnico de la Edificación - Seguridad Estructural - Acciones en la Edificación
# Green roof weight specifications according to CTE

GREEN_ROOF_WEIGHTS = {
    'extensiva': {
        'peso_saturado_kg_m2': 180,  # Typical extensive green roof saturated weight
        'peso_seco_kg_m2': 120,      # Dry weight
        'espesor_sustrato_cm': 8,    # Substrate depth
    },
    'intensiva': {
        'peso_saturado_kg_m2': 350,  # Intensive green roof saturated weight
        'peso_seco_kg_m2': 250,      # Dry weight
        'espesor_sustrato_cm': 30,   # Substrate depth
    },
    'semi_intensiva': {
        'peso_saturado_kg_m2': 250,  # Semi-intensive green roof
        'peso_seco_kg_m2': 180,      # Dry weight
        'espesor_sustrato_cm': 15,   # Substrate depth
    }
}

# Minimum structural load capacity for green roofs (CTE DB-SE-AE)
# Includes safety factors (γf = 1.5 for permanent loads)
MIN_LOAD_CAPACITY_KG_M2 = {
    'extensiva': 250,      # Minimum for extensive (180 kg/m² × 1.5 safety)
    'intensiva': 500,      # Minimum for intensive (350 kg/m² × 1.5 safety)
    'semi_intensiva': 350, # Minimum for semi-intensive (250 kg/m² × 1.5 safety)
}

# Typical structural capacity of existing roofs
TYPICAL_ROOF_CAPACITY = {
    'edificio_antiguo': 200,       # Pre-1980 buildings (may need reinforcement)
    'edificio_moderno': 300,       # Post-1980 buildings
    'edificio_reciente': 400,      # Post-2006 (CTE era)
    'industrial_ligera': 350,      # Light industrial
    'industrial_pesada': 600,      # Heavy industrial
}

# Roof slope classifications (degrees)
SLOPE_CLASSIFICATIONS = {
    'plana': (0, 5),           # 0-5° - Flat roof
    'inclinada_ligera': (5, 15), # 5-15° - Slight slope
    'inclinada_media': (15, 30), # 15-30° - Medium slope
    'inclinada_fuerte': (30, 45), # 30-45° - Steep slope
}

# =====================================================
# ADDITIONAL COSTS FOR ROOFTOP INSTALLATIONS
# =====================================================

ADDITIONAL_COSTS = {
    # Waterproofing
    'impermeabilizacion_reparacion_m2': 35.0,
    'impermeabilizacion_nueva_m2': 55.0,
    'test_estanqueidad_unidad': 450.0,
    
    # Drainage
    'drenaje_adicional_perimetral_ml': 25.0,  # per meter lineal
    'sumideros_adicionales_unidad': 180.0,
    'canalones_reforzados_ml': 35.0,
    
    # Root barrier (specific for roofs)
    'barrera_antiraices_premium_m2': 12.0,  # Higher quality for roofs
    
    # Automatic irrigation (rooftop specific)
    'riego_automatico_tejado_m2': 22.0,  # Higher than ground level
    'bomba_presion_unidad': 650.0,       # Pressure pump for height
    'deposito_agua_1000l': 850.0,        # Water storage tank
    
    # Transport and crane (vertical access)
    'grua_dia': 800.0,
    'transporte_material_vertical_m2': 8.0,  # Per m² of material
    'andamios_perimetro_ml': 15.0,
    
    # Structural reinforcement
    'refuerzo_estructural_m2': 85.0,
    'estudio_estructural_ingenieria': 1500.0,
    
    # Safety
    'linea_vida_seguridad_ml': 45.0,
    'barandilla_seguridad_ml': 120.0,
    'acceso_mantenimiento_unidad': 450.0,
}


# =====================================================
# BUILDING DETECTION
# =====================================================

def detect_building_type(area_m2: float, perimeter_m: float, coordinates: List) -> Dict[str, Any]:
    """
    Detect if the polygon represents a building based on compactness analysis.
    
    Compactness = 4π × Area / Perimeter²
    Buildings tend to have high compactness (rectangular/square shapes)
    
    Args:
        area_m2: Area in square meters
        perimeter_m: Perimeter in meters
        coordinates: List of [lon, lat] coordinates
        
    Returns:
        Dict with building detection results
    """
    # Calculate compactness (Polsby-Popper index)
    if perimeter_m == 0:
        compactness = 0
    else:
        compactness = (4 * math.pi * area_m2) / (perimeter_m ** 2)
    
    # Building classification thresholds
    # Circle = 1.0, Square ≈ 0.785, Rectangle ≈ 0.5-0.7, Irregular < 0.5
    is_building = compactness > 0.4
    
    # Additional heuristics
    lado_promedio = math.sqrt(area_m2)
    aspect_ratio_estimado = perimeter_m / (4 * lado_promedio) if lado_promedio > 0 else 1
    
    # Classify confidence
    if compactness > 0.6:
        confidence = 'alta'
        tipo_probable = 'edificio_rectangular'
    elif compactness > 0.4:
        confidence = 'media'
        tipo_probable = 'edificio_irregular'
    else:
        confidence = 'baja'
        tipo_probable = 'zona_abierta'
    
    return {
        'es_edificio': is_building,
        'compacidad': round(compactness, 3),
        'confianza': confidence,
        'tipo_probable': tipo_probable,
        'lado_promedio_m': round(lado_promedio, 2),
        'aspect_ratio': round(aspect_ratio_estimado, 2),
        'recomendacion': 'Análisis de tejado apropiado' if is_building else 'Considerar análisis de zona abierta'
    }


# =====================================================
# ROOF CHARACTERISTICS ANALYSIS
# =====================================================

def analyze_roof_characteristics(area_m2: float, building_age: str = 'edificio_moderno') -> Dict[str, Any]:
    """
    Analyze roof characteristics and determine type, capacity, and requirements.
    
    Args:
        area_m2: Roof area in m²
        building_age: 'edificio_antiguo', 'edificio_moderno', 'edificio_reciente'
        
    Returns:
        Dict with roof characteristics
    """
    # Estimate structural capacity based on building age
    capacidad_estructural_kg_m2 = TYPICAL_ROOF_CAPACITY.get(building_age, 300)
    
    # Determine recommended roof type based on capacity
    if capacidad_estructural_kg_m2 >= MIN_LOAD_CAPACITY_KG_M2['intensiva']:
        tipo_recomendado = 'intensiva'
    elif capacidad_estructural_kg_m2 >= MIN_LOAD_CAPACITY_KG_M2['semi_intensiva']:
        tipo_recomendado = 'semi_intensiva'
    elif capacidad_estructural_kg_m2 >= MIN_LOAD_CAPACITY_KG_M2['extensiva']:
        tipo_recomendado = 'extensiva'
    else:
        tipo_recomendado = 'refuerzo_necesario'
    
    # Determine slope (simulated - in reality would come from elevation data)
    # For this implementation, assume flat roof (most common in Spain)
    pendiente_grados = 2  # Typical flat roof with slight drainage slope
    clasificacion_pendiente = 'plana'
    
    # Waterproofing state (simulated based on building age)
    if building_age == 'edificio_reciente':
        estado_impermeabilizacion = 'bueno'
    elif building_age == 'edificio_moderno':
        estado_impermeabilizacion = 'aceptable'
    else:
        estado_impermeabilizacion = 'necesita_reparacion'
    
    # Material (typical in Spain)
    material_cubierta = 'hormigon'  # Most common
    
    return {
        'tipo_cubierta_actual': 'plana',
        'tipo_verde_recomendado': tipo_recomendado,
        'pendiente_grados': pendiente_grados,
        'clasificacion_pendiente': clasificacion_pendiente,
        'material_cubierta': material_cubierta,
        'capacidad_estructural_kg_m2': capacidad_estructural_kg_m2,
        'estado_impermeabilizacion': estado_impermeabilizacion,
        'accesibilidad': 'si' if area_m2 > 50 else 'limitada',
    }


# =====================================================
# CTE STRUCTURAL CALCULATIONS
# =====================================================

def calculate_structural_cte(
    area_m2: float,
    capacidad_estructural_kg_m2: float,
    tipo_verde: str
) -> Dict[str, Any]:
    """
    Perform CTE DB-SE-AE structural calculations.
    
    Args:
        area_m2: Roof area
        capacidad_estructural_kg_m2: Current structural capacity
        tipo_verde: 'extensiva', 'semi_intensiva', or 'intensiva'
        
    Returns:
        Dict with structural analysis
    """
    # Get green roof weight
    peso_cubierta_verde_kg_m2 = GREEN_ROOF_WEIGHTS[tipo_verde]['peso_saturado_kg_m2']
    peso_total_kg = area_m2 * peso_cubierta_verde_kg_m2
    
    # CTE safety factor (γf = 1.5 for permanent loads)
    factor_seguridad_cte = 1.5
    carga_admisible_con_seguridad = capacidad_estructural_kg_m2 / factor_seguridad_cte
    
    # Calculate margin
    margen_kg_m2 = carga_admisible_con_seguridad - peso_cubierta_verde_kg_m2
    margen_porcentaje = (margen_kg_m2 / peso_cubierta_verde_kg_m2) * 100 if peso_cubierta_verde_kg_m2 > 0 else 0
    
    # Determine if reinforcement is needed
    refuerzo_necesario = margen_kg_m2 < 0
    
    # Viability assessment
    if margen_porcentaje > 30:
        viabilidad_estructural = 'alta'
    elif margen_porcentaje > 10:
        viabilidad_estructural = 'media'
    elif margen_porcentaje > 0:
        viabilidad_estructural = 'baja'
    else:
        viabilidad_estructural = 'nula'
    
    return {
        'peso_cubierta_verde_kg_m2': peso_cubierta_verde_kg_m2,
        'peso_total_kg': round(peso_total_kg, 2),
        'capacidad_estructural_kg_m2': capacidad_estructural_kg_m2,
        'factor_seguridad_cte': factor_seguridad_cte,
        'carga_admisible_con_seguridad_kg_m2': round(carga_admisible_con_seguridad, 2),
        'margen_seguridad_kg_m2': round(margen_kg_m2, 2),
        'margen_seguridad_porcentaje': round(margen_porcentaje, 2),
        'refuerzo_estructural_necesario': refuerzo_necesario,
        'viabilidad_estructural': viabilidad_estructural,
        'cumple_cte': not refuerzo_necesario,
    }


# =====================================================
# OBSTACLE DETECTION
# =====================================================

def detect_obstacles(area_m2: float, tipo_edificio: str = 'residencial') -> Dict[str, Any]:
    """
    Detect typical obstacles on rooftops (simulated).
    
    In a real implementation, this would use computer vision on satellite imagery.
    For now, we estimate based on typical building characteristics.
    
    Args:
        area_m2: Roof area
        tipo_edificio: Building type
        
    Returns:
        Dict with obstacle detection results
    """
    # Estimate obstacles based on building type and size
    obstaculos = []
    area_ocupada_m2 = 0
    
    # Chimeneys (typical: 1 per 200 m²)
    num_chimeneas = max(1, int(area_m2 / 200))
    if num_chimeneas > 0:
        area_chimeneas = num_chimeneas * 1.0  # 1 m² per chimney
        obstaculos.append({
            'tipo': 'chimenea',
            'cantidad': num_chimeneas,
            'area_ocupada_m2': area_chimeneas
        })
        area_ocupada_m2 += area_chimeneas
    
    # AC units (typical: 1 per 100 m² in residential, more in office buildings)
    factor_ac = 1.5 if tipo_edificio == 'oficinas' else 1.0
    num_ac = max(1, int(area_m2 / 100 * factor_ac))
    if num_ac > 0:
        area_ac = num_ac * 2.0  # 2 m² per AC unit
        obstaculos.append({
            'tipo': 'aire_acondicionado',
            'cantidad': num_ac,
            'area_ocupada_m2': area_ac
        })
        area_ocupada_m2 += area_ac
    
    # Antennas (typical: 1-2 per building)
    num_antenas = 2 if area_m2 > 200 else 1
    area_antenas = num_antenas * 0.5  # 0.5 m² per antenna
    obstaculos.append({
        'tipo': 'antena',
        'cantidad': num_antenas,
        'area_ocupada_m2': area_antenas
    })
    area_ocupada_m2 += area_antenas
    
    # Access points (stairs, elevators)
    num_accesos = 1 if area_m2 < 200 else 2
    area_accesos = num_accesos * 4.0  # 4 m² per access point
    obstaculos.append({
        'tipo': 'acceso',
        'cantidad': num_accesos,
        'area_ocupada_m2': area_accesos
    })
    area_ocupada_m2 += area_accesos
    
    # Calculate usable area
    area_util_m2 = area_m2 - area_ocupada_m2
    porcentaje_util = (area_util_m2 / area_m2 * 100) if area_m2 > 0 else 0
    
    return {
        'obstaculos_detectados': obstaculos,
        'area_ocupada_obstaculos_m2': round(area_ocupada_m2, 2),
        'area_util_cubierta_verde_m2': round(area_util_m2, 2),
        'porcentaje_area_util': round(porcentaje_util, 2),
        'perimetro_libre_recomendado_m': 1.0,  # CTE recommended safety perimeter
    }


# =====================================================
# SPECIFIC BUDGET CALCULATION
# =====================================================

def calculate_specific_budget(
    area_m2: float,
    area_util_m2: float,
    perimeter_m: float,
    estado_impermeabilizacion: str,
    refuerzo_necesario: bool,
    tipo_verde: str,
    presupuesto_base_eur: float
) -> Dict[str, Any]:
    """
    Calculate specific budget for rooftop installation including additional costs.
    
    Args:
        area_m2: Total roof area
        area_util_m2: Usable area for green roof
        perimeter_m: Perimeter
        estado_impermeabilizacion: Waterproofing state
        refuerzo_necesario: Whether structural reinforcement is needed
        tipo_verde: Green roof type
        presupuesto_base_eur: Base budget from general analysis
        
    Returns:
        Dict with detailed budget breakdown
    """
    costes_adicionales = {}
    
    # 1. Waterproofing
    if estado_impermeabilizacion == 'necesita_reparacion':
        costes_adicionales['impermeabilizacion_eur'] = (
            area_m2 * ADDITIONAL_COSTS['impermeabilizacion_reparacion_m2'] +
            ADDITIONAL_COSTS['test_estanqueidad_unidad']
        )
    elif estado_impermeabilizacion == 'aceptable':
        costes_adicionales['impermeabilizacion_eur'] = (
            area_m2 * ADDITIONAL_COSTS['impermeabilizacion_nueva_m2'] +
            ADDITIONAL_COSTS['test_estanqueidad_unidad']
        )
    else:
        costes_adicionales['impermeabilizacion_eur'] = ADDITIONAL_COSTS['test_estanqueidad_unidad']
    
    # 2. Enhanced drainage
    costes_adicionales['drenaje_adicional_eur'] = (
        perimeter_m * ADDITIONAL_COSTS['drenaje_adicional_perimetral_ml'] +
        max(2, int(area_m2 / 100)) * ADDITIONAL_COSTS['sumideros_adicionales_unidad'] +
        perimeter_m * 0.5 * ADDITIONAL_COSTS['canalones_reforzados_ml']
    )
    
    # 3. Premium root barrier
    costes_adicionales['barrera_antiraices_premium_eur'] = (
        area_util_m2 * ADDITIONAL_COSTS['barrera_antiraices_premium_m2']
    )
    
    # 4. Automatic irrigation with pressure system
    costes_adicionales['riego_automatico_tejado_eur'] = (
        area_util_m2 * ADDITIONAL_COSTS['riego_automatico_tejado_m2'] +
        ADDITIONAL_COSTS['bomba_presion_unidad'] +
        (ADDITIONAL_COSTS['deposito_agua_1000l'] if area_m2 > 100 else 0)
    )
    
    # 5. Transport and crane
    dias_grua = max(1, int(area_m2 / 200))  # 1 day per 200 m²
    costes_adicionales['transporte_grua_eur'] = (
        dias_grua * ADDITIONAL_COSTS['grua_dia'] +
        area_m2 * ADDITIONAL_COSTS['transporte_material_vertical_m2'] +
        perimeter_m * ADDITIONAL_COSTS['andamios_perimetro_ml'] * 0.3
    )
    
    # 6. Structural reinforcement (if needed)
    if refuerzo_necesario:
        costes_adicionales['refuerzo_estructural_eur'] = (
            area_m2 * ADDITIONAL_COSTS['refuerzo_estructural_m2'] +
            ADDITIONAL_COSTS['estudio_estructural_ingenieria']
        )
    else:
        # Even if not needed, include engineering study
        costes_adicionales['refuerzo_estructural_eur'] = (
            ADDITIONAL_COSTS['estudio_estructural_ingenieria']
        )
    
    # 7. Safety installations
    costes_adicionales['seguridad_eur'] = (
        perimeter_m * ADDITIONAL_COSTS['linea_vida_seguridad_ml'] +
        perimeter_m * ADDITIONAL_COSTS['barandilla_seguridad_ml'] * 0.3 +
        ADDITIONAL_COSTS['acceso_mantenimiento_unidad']
    )
    
    # Calculate total additional costs
    total_adicional_eur = sum(costes_adicionales.values())
    
    # Calculate total budget
    presupuesto_total_eur = presupuesto_base_eur + total_adicional_eur
    incremento_vs_base_eur = total_adicional_eur
    incremento_vs_base_porcentaje = (
        (total_adicional_eur / presupuesto_base_eur * 100) if presupuesto_base_eur > 0 else 0
    )
    
    return {
        'presupuesto_base_eur': round(presupuesto_base_eur, 2),
        'costes_adicionales': {k: round(v, 2) for k, v in costes_adicionales.items()},
        'total_adicional_eur': round(total_adicional_eur, 2),
        'presupuesto_total_eur': round(presupuesto_total_eur, 2),
        'incremento_vs_base_eur': round(incremento_vs_base_eur, 2),
        'incremento_vs_base_porcentaje': round(incremento_vs_base_porcentaje, 2),
        'coste_por_m2_total_eur': round(presupuesto_total_eur / area_util_m2, 2) if area_util_m2 > 0 else 0,
    }


# =====================================================
# RECOMMENDATIONS AND WARNINGS
# =====================================================

def generate_recommendations_and_warnings(
    building_detection: Dict,
    roof_chars: Dict,
    structural: Dict,
    obstacles: Dict,
    budget: Dict
) -> Tuple[List[str], List[str]]:
    """
    Generate recommendations and warnings based on analysis.
    
    Returns:
        Tuple of (recommendations, warnings)
    """
    recommendations = []
    warnings = []
    
    # Building detection
    if building_detection['confianza'] == 'baja':
        warnings.append(
            'La geometría de la zona no parece corresponder a un edificio típico. '
            'Verificar manualmente que sea una azotea antes de proceder.'
        )
    
    # Structural
    if structural['refuerzo_estructural_necesario']:
        warnings.append(
            f'⚠️ CRÍTICO: La capacidad estructural actual ({structural["capacidad_estructural_kg_m2"]} kg/m²) '
            f'es insuficiente para una cubierta verde {roof_chars["tipo_verde_recomendado"]}. '
            'Se requiere refuerzo estructural obligatorio.'
        )
        recommendations.append(
            'Contratar un ingeniero estructural para diseñar el refuerzo necesario según CTE DB-SE-AE.'
        )
    elif structural['margen_seguridad_porcentaje'] < 20:
        warnings.append(
            f'El margen de seguridad estructural es ajustado ({structural["margen_seguridad_porcentaje"]:.1f}%). '
            'Se recomienda verificación estructural profesional.'
        )
    
    # Waterproofing
    if roof_chars['estado_impermeabilizacion'] == 'necesita_reparacion':
        warnings.append(
            'El estado de impermeabilización requiere reparación antes de instalar la cubierta verde.'
        )
        recommendations.append(
            'Realizar test de estanqueidad tras reparar la impermeabilización y antes de instalar la cubierta verde.'
        )
    
    # Slope
    if roof_chars['pendiente_grados'] > 15:
        warnings.append(
            f'La pendiente ({roof_chars["pendiente_grados"]}°) requiere sistemas anti-deslizamiento especiales.'
        )
        recommendations.append(
            'Instalar malla de retención y aumentar la altura de los bordes de seguridad.'
        )
    
    # Obstacles
    if obstacles['porcentaje_area_util'] < 60:
        warnings.append(
            f'Solo el {obstacles["porcentaje_area_util"]:.1f}% del área es utilizable debido a obstáculos. '
            'La rentabilidad puede verse afectada.'
        )
    
    # Budget
    if budget['incremento_vs_base_porcentaje'] > 100:
        warnings.append(
            f'Los costes adicionales para tejado suponen un incremento del {budget["incremento_vs_base_porcentaje"]:.0f}% '
            'sobre el presupuesto base.'
        )
    
    # General recommendations
    recommendations.append(
        f'Tipo de cubierta verde recomendado: {roof_chars["tipo_verde_recomendado"].upper()}. '
        f'Peso saturado: {structural["peso_cubierta_verde_kg_m2"]} kg/m².'
    )
    
    if roof_chars['accesibilidad'] == 'si':
        recommendations.append(
            'Instalar senderos de mantenimiento para facilitar el acceso sin dañar la vegetación.'
        )
    
    recommendations.append(
        'Instalar sistema de riego automático con sensores de humedad para optimizar el consumo de agua.'
    )
    
    recommendations.append(
        'Realizar inspecciones anuales del sistema de drenaje y la impermeabilización.'
    )
    
    return recommendations, warnings


# =====================================================
# VIABILITY ASSESSMENT
# =====================================================

def assess_viability(
    structural: Dict,
    roof_chars: Dict,
    budget: Dict,
    area_util_m2: float
) -> Dict[str, str]:
    """
    Assess technical, economic, and regulatory viability.
    
    Returns:
        Dict with viability assessments
    """
    # Technical viability
    viabilidad_tecnica = structural['viabilidad_estructural']
    
    # Economic viability (based on cost per m²)
    coste_por_m2 = budget['coste_por_m2_total_eur']
    if coste_por_m2 < 120:
        viabilidad_economica = 'alta'
    elif coste_por_m2 < 180:
        viabilidad_economica = 'media'
    elif coste_por_m2 < 250:
        viabilidad_economica = 'baja'
    else:
        viabilidad_economica = 'nula'
    
    # Regulatory viability (CTE compliance)
    if structural['cumple_cte'] and roof_chars['estado_impermeabilizacion'] != 'malo':
        viabilidad_normativa = 'alta'
    elif structural['cumple_cte'] or roof_chars['estado_impermeabilizacion'] != 'malo':
        viabilidad_normativa = 'media'
    else:
        viabilidad_normativa = 'baja'
    
    # Overall viability (worst of the three)
    viabilities = [viabilidad_tecnica, viabilidad_economica, viabilidad_normativa]
    viability_order = ['alta', 'media', 'baja', 'nula']
    viabilidad_final = max(viabilities, key=lambda v: viability_order.index(v))
    
    return {
        'viabilidad_tecnica': viabilidad_tecnica,
        'viabilidad_economica': viabilidad_economica,
        'viabilidad_normativa': viabilidad_normativa,
        'viabilidad_final': viabilidad_final,
    }


# =====================================================
# MAIN HANDLER
# =====================================================

class handler(BaseHTTPRequestHandler):
    """
    Serverless handler for specialized rooftop analysis.
    
    POST /api/specialize-tejado
    Body: {
        "analisis_id": "uuid",
        "tipo_especializacion": "tejado",
        "area_base_m2": 250.5,
        "perimetro_m": 65.2,
        "green_score_base": 75.5,
        "especies_base": [...],
        "presupuesto_base_eur": 37500,
        "coordinates": [[lon, lat], ...],
        "building_age": "edificio_moderno"  // optional
    }
    """
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST request"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Extract required fields
            analisis_id = data.get('analisis_id')
            area_base_m2 = float(data.get('area_base_m2', 0))
            perimetro_m = float(data.get('perimetro_m', 0))
            presupuesto_base_eur = float(data.get('presupuesto_base_eur', 0))
            coordinates = data.get('coordinates', [])
            building_age = data.get('building_age', 'edificio_moderno')
            
            # Validate
            if not analisis_id or area_base_m2 <= 0:
                raise ValueError('Missing or invalid required fields')
            
            # 1. Building detection
            building_detection = detect_building_type(area_base_m2, perimetro_m, coordinates)
            
            # 2. Roof characteristics
            roof_chars = analyze_roof_characteristics(area_base_m2, building_age)
            
            # 3. Structural calculations
            tipo_verde = roof_chars['tipo_verde_recomendado']
            if tipo_verde == 'refuerzo_necesario':
                tipo_verde = 'extensiva'  # Default to lightest option for calculation
            
            structural = calculate_structural_cte(
                area_base_m2,
                roof_chars['capacidad_estructural_kg_m2'],
                tipo_verde
            )
            
            # 4. Obstacle detection
            obstacles = detect_obstacles(area_base_m2)
            
            # 5. Specific budget
            budget = calculate_specific_budget(
                area_base_m2,
                obstacles['area_util_cubierta_verde_m2'],
                perimetro_m,
                roof_chars['estado_impermeabilizacion'],
                structural['refuerzo_estructural_necesario'],
                tipo_verde,
                presupuesto_base_eur
            )
            
            # 6. Recommendations and warnings
            recommendations, warnings = generate_recommendations_and_warnings(
                building_detection,
                roof_chars,
                structural,
                obstacles,
                budget
            )
            
            # 7. Viability assessment
            viability = assess_viability(
                structural,
                roof_chars,
                budget,
                obstacles['area_util_cubierta_verde_m2']
            )
            
            # Build response
            response = {
                'success': True,
                'analisis_id': analisis_id,
                'tipo_especializacion': 'tejado',
                
                # Inherited snapshot
                'area_base_m2': area_base_m2,
                'green_score_base': data.get('green_score_base', 0),
                'especies_base': data.get('especies_base', []),
                'presupuesto_base_eur': presupuesto_base_eur,
                
                # Specific characteristics
                'caracteristicas_especificas': {
                    'deteccion_edificio': building_detection,
                    'caracteristicas_tejado': roof_chars,
                    'analisis_obstaculos': obstacles,
                },
                
                # Additional analysis
                'analisis_adicional': {
                    'calculo_estructural_cte': structural,
                    'recomendaciones': recommendations,
                    'advertencias': warnings,
                },
                
                # Budget
                'presupuesto_adicional': budget['costes_adicionales'],
                'presupuesto_total_eur': budget['presupuesto_total_eur'],
                'incremento_vs_base_eur': budget['incremento_vs_base_eur'],
                'incremento_vs_base_porcentaje': budget['incremento_vs_base_porcentaje'],
                
                # Viability
                'viabilidad_tecnica': viability['viabilidad_tecnica'],
                'viabilidad_economica': viability['viabilidad_economica'],
                'viabilidad_normativa': viability['viabilidad_normativa'],
                'viabilidad_final': viability['viabilidad_final'],
                
                # Notes
                'notas': f'Análisis especializado de tejado generado. Tipo recomendado: {tipo_verde}. '
                        f'Viabilidad final: {viability["viabilidad_final"]}.',
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            # Error response
            error_response = {
                'success': False,
                'error': str(e),
                'message': 'Error en análisis especializado de tejado'
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
