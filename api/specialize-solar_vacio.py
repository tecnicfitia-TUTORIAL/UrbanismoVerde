"""
Specialized Empty Lot Analysis API Endpoint
Implements topography analysis, leveling needs, perimeter fencing, and basic infrastructure.

Architecture:
- Topography and slope analysis
- Leveling and earthwork requirements
- Perimeter fencing needs
- Access and basic infrastructure (water, electricity)
- Site preparation costs
"""

from http.server import BaseHTTPRequestHandler
import json
import math
from typing import Dict, Any, List


# =====================================================
# TOPOGRAPHY ANALYSIS CONSTANTS
# =====================================================

# Slope classifications and implications
SLOPE_CATEGORIES = {
    'plano': {
        'pendiente_max': 2,  # %
        'nivelacion_necesaria': False,
        'dificultad_construccion': 'baja',
        'factor_coste': 1.0
    },
    'ligero': {
        'pendiente_max': 8,
        'nivelacion_necesaria': True,
        'dificultad_construccion': 'media',
        'factor_coste': 1.2
    },
    'moderado': {
        'pendiente_max': 15,
        'nivelacion_necesaria': True,
        'dificultad_construccion': 'media-alta',
        'factor_coste': 1.5
    },
    'fuerte': {
        'pendiente_max': 100,
        'nivelacion_necesaria': True,
        'dificultad_construccion': 'alta',
        'factor_coste': 2.0
    }
}

# =====================================================
# INFRASTRUCTURE COSTS
# =====================================================

INFRASTRUCTURE_COSTS = {
    # Earthwork and leveling
    'excavacion_m3': 8.5,
    'relleno_m3': 12.0,
    'compactacion_m2': 4.0,
    'nivelacion_fina_m2': 3.5,
    'retencion_tierras_ml': 85.0,  # Retaining wall per linear meter
    
    # Fencing and access
    'vallado_simple_ml': 28.0,
    'vallado_reforzado_ml': 45.0,
    'puerta_acceso_vehiculos': 850.0,
    'puerta_peatonal': 320.0,
    'camino_acceso_ml': 35.0,
    
    # Basic infrastructure
    'acometida_agua_unidad': 1200.0,
    'acometida_electrica_unidad': 1800.0,
    'drenaje_pluvial_m2': 6.5,
    'arqueta_registro_unidad': 180.0,
    
    # Site preparation
    'desbroce_basico_m2': 1.5,
    'retirada_vegetacion_m2': 3.5,
    'limpieza_superficial_m2': 2.0,
    
    # Studies and permits
    'topografia_levantamiento': 800.0,
    'estudio_geotecnico_basico': 1500.0,
    'proyecto_basico': 1200.0,
    'licencias_permisos': 600.0,
}


# =====================================================
# TOPOGRAPHY ANALYSIS
# =====================================================

def analyze_topography(area_m2: float, coordinates: List = None) -> Dict[str, Any]:
    """
    Analyze topography and determine slope characteristics.
    
    In production, this would use:
    - DEM (Digital Elevation Model) data
    - Satellite altimetry
    - Cadastral topographic data
    
    For now, simulate based on area size and typical patterns.
    
    Args:
        area_m2: Lot area
        coordinates: Optional coordinates for elevation lookup
        
    Returns:
        Dict with topography analysis
    """
    # Simulate slope (in reality would come from elevation data)
    # Larger lots tend to have more variation
    import random
    random.seed(int(area_m2))  # Deterministic for same area
    
    pendiente_promedio_porcentaje = random.uniform(0.5, 12.0)
    desnivel_max_m = (area_m2 ** 0.5) * (pendiente_promedio_porcentaje / 100.0) * 0.5
    
    # Classify slope
    if pendiente_promedio_porcentaje <= 2:
        clasificacion = 'plano'
    elif pendiente_promedio_porcentaje <= 8:
        clasificacion = 'ligero'
    elif pendiente_promedio_porcentaje <= 15:
        clasificacion = 'moderado'
    else:
        clasificacion = 'fuerte'
    
    slope_data = SLOPE_CATEGORIES[clasificacion]
    
    return {
        'pendiente_promedio_porcentaje': round(pendiente_promedio_porcentaje, 2),
        'desnivel_maximo_m': round(desnivel_max_m, 2),
        'clasificacion_pendiente': clasificacion,
        'nivelacion_necesaria': slope_data['nivelacion_necesaria'],
        'dificultad_construccion': slope_data['dificultad_construccion'],
        'factor_coste_topografia': slope_data['factor_coste'],
    }


# =====================================================
# EARTHWORK CALCULATION
# =====================================================

def calculate_earthwork(
    area_m2: float,
    topography: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate earthwork volumes for leveling.
    
    Args:
        area_m2: Lot area
        topography: Topography analysis result
        
    Returns:
        Dict with earthwork volumes and costs
    """
    if not topography['nivelacion_necesaria']:
        return {
            'excavacion_m3': 0,
            'relleno_m3': 0,
            'compactacion_m2': area_m2,
            'volumen_neto_movimiento_m3': 0,
            'requiere_retencion': False,
            'longitud_retencion_ml': 0
        }
    
    desnivel = topography['desnivel_maximo_m']
    
    # Estimate earthwork volumes
    # Assume we're leveling to average grade
    volumen_corte_m3 = area_m2 * desnivel * 0.3  # 30% of area is cut
    volumen_relleno_m3 = area_m2 * desnivel * 0.3  # 30% is fill
    
    # Net movement (accounting for compaction loss ~20%)
    volumen_neto_m3 = abs(volumen_corte_m3 - volumen_relleno_m3 * 1.2)
    
    # Retaining wall needed if slope > 8%
    requiere_retencion = topography['pendiente_promedio_porcentaje'] > 8
    if requiere_retencion:
        # Estimate retaining wall length (typically 20-40% of perimeter)
        perimetro_estimado = 2 * math.sqrt(math.pi * area_m2)
        longitud_retencion_ml = perimetro_estimado * 0.25
    else:
        longitud_retencion_ml = 0
    
    return {
        'excavacion_m3': round(volumen_corte_m3, 2),
        'relleno_m3': round(volumen_relleno_m3, 2),
        'compactacion_m2': area_m2,
        'volumen_neto_movimiento_m3': round(volumen_neto_m3, 2),
        'requiere_retencion': requiere_retencion,
        'longitud_retencion_ml': round(longitud_retencion_ml, 2) if requiere_retencion else 0
    }


# =====================================================
# FENCING AND ACCESS ASSESSMENT
# =====================================================

def assess_fencing_and_access(
    area_m2: float,
    perimeter_m: float,
    urban_location: bool = True
) -> Dict[str, Any]:
    """
    Assess fencing and access requirements.
    
    Args:
        area_m2: Lot area
        perimeter_m: Perimeter length
        urban_location: Whether in urban area (affects security requirements)
        
    Returns:
        Dict with fencing and access assessment
    """
    # Determine fence type based on location
    if urban_location:
        tipo_vallado = 'reforzado'
        coste_ml = INFRASTRUCTURE_COSTS['vallado_reforzado_ml']
    else:
        tipo_vallado = 'simple'
        coste_ml = INFRASTRUCTURE_COSTS['vallado_simple_ml']
    
    # Access points
    num_accesos_vehiculos = 1 if area_m2 > 500 else 0
    num_accesos_peatonales = max(1, int(perimeter_m / 100))  # 1 per 100m perimeter
    
    # Access road length (typically from nearest road to center)
    longitud_camino_acceso_ml = math.sqrt(area_m2) * 0.3  # Rough estimate
    
    return {
        'tipo_vallado': tipo_vallado,
        'longitud_vallado_ml': perimeter_m,
        'coste_vallado_ml': coste_ml,
        'num_accesos_vehiculos': num_accesos_vehiculos,
        'num_accesos_peatonales': num_accesos_peatonales,
        'longitud_camino_acceso_ml': round(longitud_camino_acceso_ml, 2),
        'requiere_iluminacion': urban_location,
    }


# =====================================================
# BASIC INFRASTRUCTURE ASSESSMENT
# =====================================================

def assess_basic_infrastructure(
    area_m2: float,
    urban_location: bool = True
) -> Dict[str, Any]:
    """
    Assess basic infrastructure needs (water, electricity, drainage).
    
    Args:
        area_m2: Lot area
        urban_location: Whether in urban area
        
    Returns:
        Dict with infrastructure assessment
    """
    # Water connection
    requiere_agua = True
    distancia_red_agua_m = 15 if urban_location else 50  # Distance to water main
    
    # Electricity connection
    requiere_electricidad = area_m2 > 200  # Only for larger lots
    distancia_red_electrica_m = 20 if urban_location else 80
    
    # Drainage
    requiere_drenaje = area_m2 > 300
    num_arquetas = max(2, int(area_m2 / 500))
    
    return {
        'requiere_acometida_agua': requiere_agua,
        'distancia_red_agua_m': distancia_red_agua_m,
        'requiere_acometida_electrica': requiere_electricidad,
        'distancia_red_electrica_m': distancia_red_electrica_m,
        'requiere_drenaje_pluvial': requiere_drenaje,
        'area_drenaje_m2': area_m2 if requiere_drenaje else 0,
        'num_arquetas_registro': num_arquetas if requiere_drenaje else 0,
    }


# =====================================================
# SPECIFIC BUDGET CALCULATION
# =====================================================

def calculate_specific_budget(
    area_m2: float,
    perimeter_m: float,
    topography: Dict[str, Any],
    earthwork: Dict[str, Any],
    fencing: Dict[str, Any],
    infrastructure: Dict[str, Any],
    presupuesto_base_eur: float
) -> Dict[str, Any]:
    """
    Calculate specific budget for empty lot preparation.
    
    Returns:
        Dict with detailed budget breakdown
    """
    costes_adicionales = {}
    
    # 1. Studies and permits
    costes_adicionales['estudios_permisos_eur'] = (
        INFRASTRUCTURE_COSTS['topografia_levantamiento'] +
        INFRASTRUCTURE_COSTS['estudio_geotecnico_basico'] +
        INFRASTRUCTURE_COSTS['proyecto_basico'] +
        INFRASTRUCTURE_COSTS['licencias_permisos']
    )
    
    # 2. Site preparation
    costes_adicionales['preparacion_terreno_eur'] = (
        area_m2 * INFRASTRUCTURE_COSTS['desbroce_basico_m2'] +
        area_m2 * 0.3 * INFRASTRUCTURE_COSTS['retirada_vegetacion_m2'] +  # 30% has vegetation
        area_m2 * INFRASTRUCTURE_COSTS['limpieza_superficial_m2']
    )
    
    # 3. Earthwork and leveling
    costes_adicionales['movimiento_tierras_eur'] = (
        earthwork['excavacion_m3'] * INFRASTRUCTURE_COSTS['excavacion_m3'] +
        earthwork['relleno_m3'] * INFRASTRUCTURE_COSTS['relleno_m3'] +
        earthwork['compactacion_m2'] * INFRASTRUCTURE_COSTS['compactacion_m2'] +
        area_m2 * INFRASTRUCTURE_COSTS['nivelacion_fina_m2']
    )
    
    # 4. Retaining structures (if needed)
    if earthwork['requiere_retencion']:
        costes_adicionales['retencion_tierras_eur'] = (
            earthwork['longitud_retencion_ml'] * INFRASTRUCTURE_COSTS['retencion_tierras_ml']
        )
    else:
        costes_adicionales['retencion_tierras_eur'] = 0
    
    # 5. Fencing and access
    costes_adicionales['vallado_accesos_eur'] = (
        fencing['longitud_vallado_ml'] * fencing['coste_vallado_ml'] +
        fencing['num_accesos_vehiculos'] * INFRASTRUCTURE_COSTS['puerta_acceso_vehiculos'] +
        fencing['num_accesos_peatonales'] * INFRASTRUCTURE_COSTS['puerta_peatonal'] +
        fencing['longitud_camino_acceso_ml'] * INFRASTRUCTURE_COSTS['camino_acceso_ml']
    )
    
    # 6. Basic infrastructure
    coste_infra = 0
    if infrastructure['requiere_acometida_agua']:
        coste_infra += INFRASTRUCTURE_COSTS['acometida_agua_unidad']
    if infrastructure['requiere_acometida_electrica']:
        coste_infra += INFRASTRUCTURE_COSTS['acometida_electrica_unidad']
    if infrastructure['requiere_drenaje_pluvial']:
        coste_infra += (
            infrastructure['area_drenaje_m2'] * INFRASTRUCTURE_COSTS['drenaje_pluvial_m2'] +
            infrastructure['num_arquetas_registro'] * INFRASTRUCTURE_COSTS['arqueta_registro_unidad']
        )
    costes_adicionales['infraestructuras_basicas_eur'] = coste_infra
    
    # Apply topography cost factor
    total_construccion = (
        costes_adicionales['preparacion_terreno_eur'] +
        costes_adicionales['movimiento_tierras_eur'] +
        costes_adicionales['retencion_tierras_eur']
    )
    incremento_topografia = total_construccion * (topography['factor_coste_topografia'] - 1.0)
    costes_adicionales['incremento_topografia_eur'] = incremento_topografia
    
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
        'coste_por_m2_total_eur': round(presupuesto_total_eur / area_m2, 2) if area_m2 > 0 else 0,
    }


# =====================================================
# RECOMMENDATIONS AND WARNINGS
# =====================================================

def generate_recommendations_and_warnings(
    topography: Dict,
    earthwork: Dict,
    fencing: Dict,
    infrastructure: Dict,
    budget: Dict
) -> tuple:
    """
    Generate recommendations and warnings.
    
    Returns:
        Tuple of (recommendations, warnings)
    """
    recommendations = []
    warnings = []
    
    # Topography warnings
    if topography['clasificacion_pendiente'] == 'fuerte':
        warnings.append(
            f'⚠️ Pendiente pronunciada ({topography["pendiente_promedio_porcentaje"]:.1f}%). '
            'Requiere movimiento significativo de tierras y posibles muros de contención.'
        )
        recommendations.append(
            'Considerar diseño en terrazas o bancales para minimizar movimiento de tierras y mejorar estética.'
        )
    elif topography['clasificacion_pendiente'] == 'moderado':
        warnings.append(
            'Pendiente moderada requiere nivelación. Planificar drenaje adecuado para evitar erosión.'
        )
    
    # Retaining structures
    if earthwork['requiere_retencion']:
        warnings.append(
            f'Necesario muro de contención de aprox. {earthwork["longitud_retencion_ml"]:.0f} m. '
            'Requiere estudio geotécnico y cálculo estructural.'
        )
        recommendations.append(
            'El muro de contención debe ser calculado por ingeniero según CTE DB-SE-C (Cimientos).'
        )
    
    # Earthwork volume
    if earthwork['volumen_neto_movimiento_m3'] > 200:
        warnings.append(
            f'Gran volumen de movimiento de tierras ({earthwork["volumen_neto_movimiento_m3"]:.0f} m³). '
            'Planificar vertedero autorizado o reutilización en obra.'
        )
    
    # Budget impact
    if budget['incremento_vs_base_porcentaje'] > 100:
        warnings.append(
            f'Los costes de preparación del solar suponen un incremento del {budget["incremento_vs_base_porcentaje"]:.0f}% '
            'sobre el presupuesto base.'
        )
    
    # General recommendations
    recommendations.append(
        'Realizar levantamiento topográfico de precisión antes de iniciar movimiento de tierras.'
    )
    
    recommendations.append(
        'Solicitar licencia de obras menores al ayuntamiento para vallado y movimiento de tierras.'
    )
    
    if infrastructure['requiere_drenaje_pluvial']:
        recommendations.append(
            'Implementar sistema de drenaje sostenible (SuDS) para gestión de aguas pluviales: zanjas drenantes, jardines de lluvia.'
        )
    
    if topography['nivelacion_necesaria']:
        recommendations.append(
            'Conservar tierra vegetal excavada para reutilización posterior en revegetación (ahorro económico).'
        )
    
    recommendations.append(
        'Instalar vallado perimetral antes de iniciar trabajos para seguridad y delimitación.'
    )
    
    if fencing['requiere_iluminacion']:
        recommendations.append(
            'Considerar iluminación LED con sensor crepuscular para seguridad nocturna y ahorro energético.'
        )
    
    return recommendations, warnings


# =====================================================
# VIABILITY ASSESSMENT
# =====================================================

def assess_viability(
    topography: Dict,
    budget: Dict,
    area_m2: float
) -> Dict[str, str]:
    """
    Assess technical, economic, and regulatory viability.
    
    Returns:
        Dict with viability assessments
    """
    # Technical viability (based on topography)
    if topography['clasificacion_pendiente'] == 'fuerte':
        viabilidad_tecnica = 'media'
    elif topography['clasificacion_pendiente'] == 'moderado':
        viabilidad_tecnica = 'alta'
    else:
        viabilidad_tecnica = 'muy_alta'
    
    # Economic viability (based on cost per m²)
    coste_por_m2 = budget['coste_por_m2_total_eur']
    if coste_por_m2 < 60:
        viabilidad_economica = 'alta'
    elif coste_por_m2 < 90:
        viabilidad_economica = 'media'
    elif coste_por_m2 < 130:
        viabilidad_economica = 'baja'
    else:
        viabilidad_economica = 'muy_baja'
    
    # Regulatory viability (empty lots generally have lower regulatory burden)
    viabilidad_normativa = 'alta'
    
    # Overall viability
    viabilities = [viabilidad_tecnica, viabilidad_economica, viabilidad_normativa]
    viability_order = ['muy_alta', 'alta', 'media', 'baja', 'muy_baja']
    viabilidad_final = max(viabilities, key=lambda v: viability_order.index(v) if v in viability_order else 2)
    
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
    Serverless handler for specialized empty lot analysis.
    
    POST /api/specialize-solar_vacio
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
            urban_location = data.get('urban_location', True)
            
            # Validate
            if not analisis_id or area_base_m2 <= 0:
                raise ValueError('Missing or invalid required fields')
            
            # 1. Topography analysis
            topography = analyze_topography(area_base_m2, coordinates)
            
            # 2. Earthwork calculation
            earthwork = calculate_earthwork(area_base_m2, topography)
            
            # 3. Fencing and access
            fencing = assess_fencing_and_access(area_base_m2, perimetro_m, urban_location)
            
            # 4. Basic infrastructure
            infrastructure = assess_basic_infrastructure(area_base_m2, urban_location)
            
            # 5. Specific budget
            budget = calculate_specific_budget(
                area_base_m2,
                perimetro_m,
                topography,
                earthwork,
                fencing,
                infrastructure,
                presupuesto_base_eur
            )
            
            # 6. Recommendations and warnings
            recommendations, warnings = generate_recommendations_and_warnings(
                topography, earthwork, fencing, infrastructure, budget
            )
            
            # 7. Viability assessment
            viability = assess_viability(topography, budget, area_base_m2)
            
            # Build response
            response = {
                'success': True,
                'analisis_id': analisis_id,
                'tipo_especializacion': 'solar_vacio',
                
                # Inherited snapshot
                'area_base_m2': area_base_m2,
                'green_score_base': data.get('green_score_base', 0),
                'especies_base': data.get('especies_base', []),
                'presupuesto_base_eur': presupuesto_base_eur,
                
                # Specific characteristics
                'caracteristicas_especificas': {
                    'topografia': topography,
                    'movimiento_tierras': earthwork,
                    'vallado_accesos': fencing,
                    'infraestructuras': infrastructure,
                },
                
                # Additional analysis
                'analisis_adicional': {
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
                'notas': f'Análisis de solar vacío. Pendiente: {topography["clasificacion_pendiente"]}. '
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
                'message': 'Error en análisis especializado de solar vacío'
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
