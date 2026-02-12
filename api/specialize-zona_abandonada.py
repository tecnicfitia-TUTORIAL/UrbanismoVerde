"""
Specialized Abandoned Zone Analysis API Endpoint
Implements contamination detection, debris volume estimation, and cleanup costs.

Architecture:
- Contamination level detection (simulated based on area characteristics)
- Debris/waste volume estimation
- Soil remediation requirements
- Cleanup and preparation costs
- Safety and access considerations
"""

from http.server import BaseHTTPRequestHandler
import json
import math
from typing import Dict, Any, List


# =====================================================
# CONTAMINATION ANALYSIS CONSTANTS
# =====================================================

# Contamination probability factors (simulated - in production would use historical data)
CONTAMINATION_FACTORS = {
    'area_industrial': 0.7,      # High probability in industrial areas
    'area_residencial': 0.3,     # Medium-low in residential
    'area_natural': 0.1,         # Low in natural areas
}

# Contamination types and remediation costs
CONTAMINATION_TYPES = {
    'metales_pesados': {
        'probabilidad': 0.4,
        'coste_remediacion_m2': 45.0,
        'tiempo_dias': 30
    },
    'hidrocarburos': {
        'probabilidad': 0.3,
        'coste_remediacion_m2': 55.0,
        'tiempo_dias': 45
    },
    'amianto': {
        'probabilidad': 0.15,
        'coste_remediacion_m2': 120.0,
        'tiempo_dias': 60
    },
    'residuos_organicos': {
        'probabilidad': 0.6,
        'coste_remediacion_m2': 15.0,
        'tiempo_dias': 7
    }
}

# =====================================================
# CLEANUP COSTS
# =====================================================

CLEANUP_COSTS = {
    # Debris removal
    'retirada_escombros_m3': 35.0,
    'retirada_residuos_m3': 45.0,
    'retirada_residuos_peligrosos_m3': 180.0,
    
    # Site clearance
    'desbroce_vegetacion_m2': 2.5,
    'tala_arbolado_unidad': 120.0,
    'arrancado_raices_m2': 8.0,
    
    # Ground preparation
    'nivelacion_terreno_m2': 6.5,
    'compactacion_m2': 4.0,
    'aporte_tierra_vegetal_m3': 28.0,
    
    # Infrastructure
    'vallado_perimetral_ml': 35.0,
    'acceso_temporal_unidad': 850.0,
    'señalizacion_seguridad_unidad': 120.0,
    
    # Safety and studies
    'estudio_contaminacion_basico': 1200.0,
    'estudio_contaminacion_completo': 3500.0,
    'plan_seguridad_salud': 800.0,
    'seguro_rc_obra': 650.0,
}


# =====================================================
# CONTAMINATION DETECTION
# =====================================================

def detect_contamination_risk(area_m2: float, zone_type: str = 'area_residencial') -> Dict[str, Any]:
    """
    Estimate contamination risk based on area characteristics.
    
    In production, this would integrate with:
    - Historical land use databases
    - Environmental agency records
    - Soil testing results
    
    Args:
        area_m2: Zone area
        zone_type: Type of zone (area_industrial, area_residencial, area_natural)
        
    Returns:
        Dict with contamination risk assessment
    """
    base_probability = CONTAMINATION_FACTORS.get(zone_type, 0.3)
    
    # Adjust probability based on size (larger abandoned areas more likely contaminated)
    size_factor = min(1.0, area_m2 / 5000.0)  # Plateaus at 5000 m²
    adjusted_probability = base_probability + (size_factor * 0.2)
    adjusted_probability = min(adjusted_probability, 0.95)
    
    # Determine contamination level
    if adjusted_probability > 0.6:
        nivel_riesgo = 'alto'
        requiere_estudio_completo = True
    elif adjusted_probability > 0.35:
        nivel_riesgo = 'medio'
        requiere_estudio_completo = True
    else:
        nivel_riesgo = 'bajo'
        requiere_estudio_completo = False
    
    # Identify potential contaminants
    contaminantes_probables = []
    for contaminante, data in CONTAMINATION_TYPES.items():
        if base_probability * data['probabilidad'] > 0.2:
            contaminantes_probables.append({
                'tipo': contaminante,
                'probabilidad': round(base_probability * data['probabilidad'], 2),
                'coste_remediacion_estimado_eur': round(area_m2 * data['coste_remediacion_m2'], 2)
            })
    
    return {
        'nivel_riesgo': nivel_riesgo,
        'probabilidad_contaminacion': round(adjusted_probability, 2),
        'requiere_estudio_completo': requiere_estudio_completo,
        'contaminantes_probables': contaminantes_probables,
        'recomendacion': 'Estudio completo de suelo obligatorio' if requiere_estudio_completo else 'Análisis básico recomendado'
    }


# =====================================================
# DEBRIS VOLUME ESTIMATION
# =====================================================

def estimate_debris_volume(area_m2: float, abandonment_years: int = 10) -> Dict[str, Any]:
    """
    Estimate volume of debris and waste accumulated.
    
    Heuristics:
    - Base accumulation: 0.15 m³ per m² per decade
    - Increases with time (vegetation overgrowth, dumping)
    - Includes construction debris, vegetation, general waste
    
    Args:
        area_m2: Zone area
        abandonment_years: Years of abandonment
        
    Returns:
        Dict with debris volume estimates
    """
    # Base accumulation rate
    base_rate_m3_per_m2 = 0.015 * (abandonment_years / 10.0)
    
    # Volume estimates
    escombros_m3 = area_m2 * base_rate_m3_per_m2 * 0.4  # 40% construction debris
    residuos_m3 = area_m2 * base_rate_m3_per_m2 * 0.3   # 30% general waste
    vegetacion_m3 = area_m2 * base_rate_m3_per_m2 * 0.3 # 30% overgrown vegetation
    
    # Hazardous waste probability (increases with age)
    prob_residuos_peligrosos = min(0.3, abandonment_years * 0.02)
    residuos_peligrosos_m3 = residuos_m3 * prob_residuos_peligrosos
    
    total_m3 = escombros_m3 + residuos_m3 + vegetacion_m3 + residuos_peligrosos_m3
    
    return {
        'escombros_construccion_m3': round(escombros_m3, 2),
        'residuos_generales_m3': round(residuos_m3, 2),
        'vegetacion_invasora_m3': round(vegetacion_m3, 2),
        'residuos_peligrosos_estimados_m3': round(residuos_peligrosos_m3, 2),
        'volumen_total_m3': round(total_m3, 2),
        'peso_estimado_toneladas': round(total_m3 * 1.2, 2),  # Average density 1.2 ton/m³
    }


# =====================================================
# SOIL REMEDIATION ASSESSMENT
# =====================================================

def assess_soil_remediation(
    area_m2: float,
    contamination_risk: Dict[str, Any],
    debris: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Assess soil remediation needs and costs.
    
    Args:
        area_m2: Zone area
        contamination_risk: Contamination risk assessment
        debris: Debris volume estimates
        
    Returns:
        Dict with remediation assessment
    """
    remediation_needed = contamination_risk['nivel_riesgo'] != 'bajo'
    
    # Soil removal depth (if contaminated)
    if contamination_risk['nivel_riesgo'] == 'alto':
        profundidad_remover_cm = 50
    elif contamination_risk['nivel_riesgo'] == 'medio':
        profundidad_remover_cm = 30
    else:
        profundidad_remover_cm = 0
    
    volumen_tierra_contaminada_m3 = (area_m2 * profundidad_remover_cm / 100.0) if remediation_needed else 0
    volumen_tierra_vegetal_necesaria_m3 = area_m2 * 0.30  # 30 cm of topsoil
    
    # Estimate costs
    coste_remediacion_eur = 0
    if contamination_risk['contaminantes_probables']:
        for contaminante in contamination_risk['contaminantes_probables']:
            if contaminante['probabilidad'] > 0.25:
                coste_remediacion_eur += contaminante['coste_remediacion_estimado_eur'] * 0.5
    
    return {
        'remediacion_necesaria': remediation_needed,
        'profundidad_remover_cm': profundidad_remover_cm,
        'volumen_tierra_contaminada_m3': round(volumen_tierra_contaminada_m3, 2),
        'volumen_tierra_vegetal_nueva_m3': round(volumen_tierra_vegetal_necesaria_m3, 2),
        'coste_remediacion_estimado_eur': round(coste_remediacion_eur, 2),
        'tiempo_estimado_dias': 30 if remediation_needed else 0
    }


# =====================================================
# SPECIFIC BUDGET CALCULATION
# =====================================================

def calculate_specific_budget(
    area_m2: float,
    perimeter_m: float,
    contamination_risk: Dict[str, Any],
    debris: Dict[str, Any],
    remediation: Dict[str, Any],
    presupuesto_base_eur: float
) -> Dict[str, Any]:
    """
    Calculate specific budget for abandoned zone cleanup and preparation.
    
    Args:
        area_m2: Zone area
        perimeter_m: Perimeter
        contamination_risk: Contamination assessment
        debris: Debris estimates
        remediation: Remediation assessment
        presupuesto_base_eur: Base budget from general analysis
        
    Returns:
        Dict with detailed budget breakdown
    """
    costes_adicionales = {}
    
    # 1. Studies and documentation
    if contamination_risk['requiere_estudio_completo']:
        costes_adicionales['estudios_eur'] = (
            CLEANUP_COSTS['estudio_contaminacion_completo'] +
            CLEANUP_COSTS['plan_seguridad_salud']
        )
    else:
        costes_adicionales['estudios_eur'] = (
            CLEANUP_COSTS['estudio_contaminacion_basico'] +
            CLEANUP_COSTS['plan_seguridad_salud']
        )
    
    # 2. Debris removal
    costes_adicionales['retirada_escombros_eur'] = (
        debris['escombros_construccion_m3'] * CLEANUP_COSTS['retirada_escombros_m3'] +
        debris['residuos_generales_m3'] * CLEANUP_COSTS['retirada_residuos_m3'] +
        debris['residuos_peligrosos_estimados_m3'] * CLEANUP_COSTS['retirada_residuos_peligrosos_m3']
    )
    
    # 3. Vegetation clearance
    num_arboles_estimar = int(area_m2 / 100)  # Estimate 1 tree per 100 m²
    costes_adicionales['limpieza_vegetacion_eur'] = (
        area_m2 * CLEANUP_COSTS['desbroce_vegetacion_m2'] +
        num_arboles_estimar * CLEANUP_COSTS['tala_arbolado_unidad'] +
        area_m2 * 0.3 * CLEANUP_COSTS['arrancado_raices_m2']  # 30% of area has roots
    )
    
    # 4. Soil remediation
    if remediation['remediacion_necesaria']:
        costes_adicionales['remediacion_suelo_eur'] = (
            remediation['coste_remediacion_estimado_eur'] +
            remediation['volumen_tierra_vegetal_nueva_m3'] * CLEANUP_COSTS['aporte_tierra_vegetal_m3']
        )
    else:
        # Just topsoil addition
        costes_adicionales['remediacion_suelo_eur'] = (
            remediation['volumen_tierra_vegetal_nueva_m3'] * CLEANUP_COSTS['aporte_tierra_vegetal_m3']
        )
    
    # 5. Ground preparation
    costes_adicionales['preparacion_terreno_eur'] = (
        area_m2 * CLEANUP_COSTS['nivelacion_terreno_m2'] +
        area_m2 * CLEANUP_COSTS['compactacion_m2']
    )
    
    # 6. Security infrastructure
    costes_adicionales['seguridad_infraestructura_eur'] = (
        perimeter_m * CLEANUP_COSTS['vallado_perimetral_ml'] +
        CLEANUP_COSTS['acceso_temporal_unidad'] +
        max(2, int(perimeter_m / 50)) * CLEANUP_COSTS['señalizacion_seguridad_unidad'] +
        CLEANUP_COSTS['seguro_rc_obra']
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
        'coste_por_m2_total_eur': round(presupuesto_total_eur / area_m2, 2) if area_m2 > 0 else 0,
    }


# =====================================================
# RECOMMENDATIONS AND WARNINGS
# =====================================================

def generate_recommendations_and_warnings(
    contamination: Dict,
    debris: Dict,
    remediation: Dict,
    budget: Dict
) -> tuple:
    """
    Generate recommendations and warnings for abandoned zone recovery.
    
    Returns:
        Tuple of (recommendations, warnings)
    """
    recommendations = []
    warnings = []
    
    # Contamination warnings
    if contamination['nivel_riesgo'] == 'alto':
        warnings.append(
            '⚠️ CRÍTICO: Alto riesgo de contaminación detectado. '
            'Estudio completo de suelo y posible remediación obligatorios antes de iniciar trabajos.'
        )
        recommendations.append(
            'Contratar laboratorio acreditado para análisis de suelo según Real Decreto 9/2005.'
        )
    elif contamination['nivel_riesgo'] == 'medio':
        warnings.append(
            'Riesgo medio de contaminación. Se requiere estudio de suelo antes de proceder.'
        )
    
    # Hazardous materials
    if debris['residuos_peligrosos_estimados_m3'] > 0.5:
        warnings.append(
            f'Posible presencia de residuos peligrosos ({debris["residuos_peligrosos_estimados_m3"]:.1f} m³ estimados). '
            'Requiere gestor autorizado de residuos peligrosos.'
        )
        recommendations.append(
            'Obtener autorización previa de retirada de residuos peligrosos de la autoridad ambiental.'
        )
    
    # Debris volume
    if debris['volumen_total_m3'] > 100:
        warnings.append(
            f'Gran volumen de residuos a retirar ({debris["volumen_total_m3"]:.0f} m³). '
            'Planificar logística de transporte y vertedero autorizado.'
        )
    
    # Budget impact
    if budget['incremento_vs_base_porcentaje'] > 150:
        warnings.append(
            f'Los costes de limpieza y preparación suponen un incremento del {budget["incremento_vs_base_porcentaje"]:.0f}% '
            'sobre el presupuesto base de revegetación.'
        )
    
    # General recommendations
    recommendations.append(
        'Realizar levantamiento topográfico detallado para identificar zonas de acumulación de residuos.'
    )
    
    recommendations.append(
        'Establecer plan de gestión de residuos según Ley 7/2022 de residuos y suelos contaminados.'
    )
    
    if contamination['contaminantes_probables']:
        recommendations.append(
            'Implementar medidas de seguridad para trabajadores: EPIs adecuados, señalización, ventilación.'
        )
    
    recommendations.append(
        'Vallado perimetral obligatorio durante obras para evitar acceso de personas ajenas.'
    )
    
    recommendations.append(
        'Considerar reutilización in situ de escombros limpios para nivelación y ahorro de transporte.'
    )
    
    return recommendations, warnings


# =====================================================
# VIABILITY ASSESSMENT
# =====================================================

def assess_viability(
    contamination: Dict,
    budget: Dict,
    area_m2: float
) -> Dict[str, str]:
    """
    Assess technical, economic, and regulatory viability.
    
    Returns:
        Dict with viability assessments
    """
    # Technical viability (based on contamination level)
    if contamination['nivel_riesgo'] == 'alto':
        viabilidad_tecnica = 'media'  # Possible but requires remediation
    else:
        viabilidad_tecnica = 'alta'
    
    # Economic viability (based on cost per m²)
    coste_por_m2 = budget['coste_por_m2_total_eur']
    if coste_por_m2 < 80:
        viabilidad_economica = 'alta'
    elif coste_por_m2 < 120:
        viabilidad_economica = 'media'
    elif coste_por_m2 < 180:
        viabilidad_economica = 'baja'
    else:
        viabilidad_economica = 'muy_baja'
    
    # Regulatory viability (contamination determines regulatory complexity)
    if contamination['nivel_riesgo'] == 'bajo':
        viabilidad_normativa = 'alta'
    elif contamination['nivel_riesgo'] == 'medio':
        viabilidad_normativa = 'media'
    else:
        viabilidad_normativa = 'baja'  # High regulatory burden
    
    # Overall viability (worst of the three)
    viabilities = [viabilidad_tecnica, viabilidad_economica, viabilidad_normativa]
    viability_order = ['alta', 'media', 'baja', 'muy_baja']
    viabilidad_final = max(viabilities, key=lambda v: viability_order.index(v) if v in viability_order else 0)
    
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
    Serverless handler for specialized abandoned zone analysis.
    
    POST /api/specialize-zona_abandonada
    Body: {
        "analisis_id": "uuid",
        "tipo_especializacion": "zona_abandonada",
        "area_base_m2": 1500.0,
        "perimetro_m": 180.0,
        "presupuesto_base_eur": 75000,
        "zone_type": "area_residencial",  // optional
        "abandonment_years": 15  // optional
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
            zone_type = data.get('zone_type', 'area_residencial')
            abandonment_years = int(data.get('abandonment_years', 10))
            
            # Validate
            if not analisis_id or area_base_m2 <= 0:
                raise ValueError('Missing or invalid required fields')
            
            # 1. Contamination risk detection
            contamination_risk = detect_contamination_risk(area_base_m2, zone_type)
            
            # 2. Debris volume estimation
            debris = estimate_debris_volume(area_base_m2, abandonment_years)
            
            # 3. Soil remediation assessment
            remediation = assess_soil_remediation(area_base_m2, contamination_risk, debris)
            
            # 4. Specific budget
            budget = calculate_specific_budget(
                area_base_m2,
                perimetro_m,
                contamination_risk,
                debris,
                remediation,
                presupuesto_base_eur
            )
            
            # 5. Recommendations and warnings
            recommendations, warnings = generate_recommendations_and_warnings(
                contamination_risk,
                debris,
                remediation,
                budget
            )
            
            # 6. Viability assessment
            viability = assess_viability(contamination_risk, budget, area_base_m2)
            
            # Build response
            response = {
                'success': True,
                'analisis_id': analisis_id,
                'tipo_especializacion': 'zona_abandonada',
                
                # Inherited snapshot
                'area_base_m2': area_base_m2,
                'green_score_base': data.get('green_score_base', 0),
                'especies_base': data.get('especies_base', []),
                'presupuesto_base_eur': presupuesto_base_eur,
                
                # Specific characteristics
                'caracteristicas_especificas': {
                    'anos_abandono': abandonment_years,
                    'tipo_zona': zone_type,
                    'riesgo_contaminacion': contamination_risk,
                    'volumenes_residuos': debris,
                },
                
                # Additional analysis
                'analisis_adicional': {
                    'remediacion_suelo': remediation,
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
                'notas': f'Análisis de zona abandonada. Riesgo contaminación: {contamination_risk["nivel_riesgo"]}. '
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
                'message': 'Error en análisis especializado de zona abandonada'
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
