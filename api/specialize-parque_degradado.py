"""
Specialized Degraded Park Analysis API Endpoint
Implements rehabilitation assessment for degraded public parks and green spaces.

Architecture:
- Assessment of existing furniture and equipment condition
- Pathway and pavement rehabilitation needs
- Lighting infrastructure evaluation
- Vegetation restoration requirements
- Budget for rehabilitation vs. new installation
"""

from http.server import BaseHTTPRequestHandler
import json
import math
from typing import Dict, Any, List


# =====================================================
# PARK CONDITION ASSESSMENT
# =====================================================

# Degradation levels and rehabilitation needs
DEGRADATION_LEVELS = {
    'leve': {
        'descripcion': 'Desgaste superficial, mantenimiento preventivo',
        'factor_coste': 0.3,  # 30% of new installation cost
        'urgencia': 'baja'
    },
    'moderado': {
        'descripcion': 'Deterioro visible, reparaciones necesarias',
        'factor_coste': 0.6,
        'urgencia': 'media'
    },
    'severo': {
        'descripcion': 'Daño importante, rehabilitación integral',
        'factor_coste': 0.85,
        'urgencia': 'alta'
    },
    'critico': {
        'descripcion': 'Estado ruinoso, reemplazo necesario',
        'factor_coste': 1.0,  # Same as new
        'urgencia': 'inmediata'
    }
}

# =====================================================
# REHABILITATION COSTS
# =====================================================

REHABILITATION_COSTS = {
    # Pathways and pavements
    'reparacion_pavimento_m2': 18.0,
    'reemplazo_pavimento_m2': 35.0,
    'sendero_nuevo_m2': 28.0,
    'bordillo_reparacion_ml': 8.0,
    'bordillo_nuevo_ml': 15.0,
    
    # Furniture
    'banco_reparacion': 80.0,
    'banco_nuevo': 320.0,
    'papelera_nueva': 85.0,
    'fuente_bebedero_reparacion': 180.0,
    'fuente_bebedero_nueva': 650.0,
    'juegos_infantiles_reparacion_m2': 45.0,
    'juegos_infantiles_nuevos_m2': 180.0,
    
    # Lighting
    'farola_reparacion': 150.0,
    'farola_led_nueva': 850.0,
    'cableado_renovacion_ml': 12.0,
    'cuadro_electrico_renovacion': 1200.0,
    
    # Vegetation restoration
    'poda_saneamiento_arbol': 45.0,
    'sustitucion_arbol_pequeno': 180.0,
    'sustitucion_arbol_grande': 450.0,
    'resembrado_cesped_m2': 3.5,
    'restauracion_setos_ml': 12.0,
    'plantacion_arbustiva_m2': 18.0,
    
    # Irrigation
    'reparacion_riego_m2': 4.5,
    'sistema_riego_nuevo_m2': 15.0,
    'programador_riego_nuevo': 450.0,
    
    # Accessibility
    'rampa_accesibilidad_unidad': 1200.0,
    'paso_peatonal_adaptado_unidad': 380.0,
    'señalizacion_accesible_unidad': 150.0,
    
    # Studies and design
    'inventario_arbolado': 800.0,
    'estudio_seguridad_estructuras': 650.0,
    'proyecto_rehabilitacion': 1500.0,
    'direccion_obra': 800.0,
}


# =====================================================
# FURNITURE CONDITION ASSESSMENT
# =====================================================

def assess_furniture_condition(area_m2: float, park_age_years: int = 20) -> Dict[str, Any]:
    """
    Assess condition of park furniture and equipment.
    
    Heuristics based on typical park age and size:
    - Benches: 1 per 200 m²
    - Bins: 1 per 150 m²
    - Drinking fountains: 1 per 1000 m² (if > 500 m²)
    - Playground: if area > 1000 m² (50 m² typical size)
    
    Degradation increases with age.
    
    Args:
        area_m2: Park area
        park_age_years: Years since last renovation (default: 20, typical Spanish park maintenance cycle)
        
    Returns:
        Dict with furniture condition assessment
    """
    # Estimate furniture quantity
    num_bancos = max(2, int(area_m2 / 200))
    num_papeleras = max(2, int(area_m2 / 150))
    num_fuentes = 1 if area_m2 > 500 else 0
    tiene_juegos = area_m2 > 1000
    area_juegos_m2 = 50 if tiene_juegos else 0
    
    # Determine degradation level based on age
    if park_age_years > 30:
        nivel_degradacion = 'critico'
        bancos_reparar_pct = 0.3
        bancos_reemplazar_pct = 0.7
    elif park_age_years > 20:
        nivel_degradacion = 'severo'
        bancos_reparar_pct = 0.5
        bancos_reemplazar_pct = 0.5
    elif park_age_years > 10:
        nivel_degradacion = 'moderado'
        bancos_reparar_pct = 0.7
        bancos_reemplazar_pct = 0.3
    else:
        nivel_degradacion = 'leve'
        bancos_reparar_pct = 0.8
        bancos_reemplazar_pct = 0.2
    
    return {
        'nivel_degradacion_mobiliario': nivel_degradacion,
        'bancos': {
            'total': num_bancos,
            'reparar': int(num_bancos * bancos_reparar_pct),
            'reemplazar': int(num_bancos * bancos_reemplazar_pct)
        },
        'papeleras': {
            'total': num_papeleras,
            'reemplazar': num_papeleras  # Usually full replacement
        },
        'fuentes_bebedero': {
            'total': num_fuentes,
            'reparar': num_fuentes if nivel_degradacion in ['leve', 'moderado'] else 0,
            'reemplazar': num_fuentes if nivel_degradacion in ['severo', 'critico'] else 0
        },
        'juegos_infantiles': {
            'existe': tiene_juegos,
            'area_m2': area_juegos_m2,
            'reparar': tiene_juegos and nivel_degradacion in ['leve', 'moderado'],
            'reemplazar': tiene_juegos and nivel_degradacion in ['severo', 'critico']
        }
    }


# =====================================================
# PATHWAY CONDITION ASSESSMENT
# =====================================================

def assess_pathway_condition(area_m2: float, park_age_years: int) -> Dict[str, Any]:
    """
    Assess condition of pathways and pavements.
    
    Args:
        area_m2: Park area
        park_age_years: Years since last renovation
        
    Returns:
        Dict with pathway condition assessment
    """
    # Estimate pathway network (typically 15-25% of park area)
    area_senderos_m2 = area_m2 * 0.18
    perimetro_senderos_ml = area_senderos_m2 * 0.3  # Rough estimate for borders
    
    # Determine condition based on age
    if park_age_years > 25:
        nivel_degradacion = 'severo'
        area_reparar_m2 = area_senderos_m2 * 0.4
        area_reemplazar_m2 = area_senderos_m2 * 0.6
    elif park_age_years > 15:
        nivel_degradacion = 'moderado'
        area_reparar_m2 = area_senderos_m2 * 0.7
        area_reemplazar_m2 = area_senderos_m2 * 0.3
    else:
        nivel_degradacion = 'leve'
        area_reparar_m2 = area_senderos_m2 * 0.9
        area_reemplazar_m2 = area_senderos_m2 * 0.1
    
    return {
        'nivel_degradacion_pavimento': nivel_degradacion,
        'area_total_senderos_m2': round(area_senderos_m2, 2),
        'area_reparar_m2': round(area_reparar_m2, 2),
        'area_reemplazar_m2': round(area_reemplazar_m2, 2),
        'perimetro_bordillos_ml': round(perimetro_senderos_ml, 2),
        'bordillos_reparar_pct': 60 if nivel_degradacion == 'leve' else 40,
        'bordillos_reemplazar_pct': 40 if nivel_degradacion == 'leve' else 60
    }


# =====================================================
# LIGHTING ASSESSMENT
# =====================================================

def assess_lighting(area_m2: float, park_age_years: int) -> Dict[str, Any]:
    """
    Assess lighting infrastructure condition.
    
    Args:
        area_m2: Park area
        park_age_years: Years since installation
        
    Returns:
        Dict with lighting assessment
    """
    # Estimate lighting points (1 per 250 m²)
    num_farolas = max(2, int(area_m2 / 250))
    
    # Lighting upgrade to LED recommended if > 15 years
    requiere_actualizacion_led = park_age_years > 15
    
    # Wiring condition
    if park_age_years > 30:
        estado_cableado = 'critico'
        cableado_renovar_pct = 1.0
    elif park_age_years > 20:
        estado_cableado = 'deteriorado'
        cableado_renovar_pct = 0.7
    else:
        estado_cableado = 'aceptable'
        cableado_renovar_pct = 0.3
    
    # Estimate wiring length (roughly perimeter + cross connections)
    perimetro_estimado = 2 * math.sqrt(math.pi * area_m2)
    longitud_cableado_ml = perimetro_estimado * 1.5
    
    return {
        'num_puntos_luz': num_farolas,
        'requiere_actualizacion_led': requiere_actualizacion_led,
        'estado_cableado': estado_cableado,
        'longitud_cableado_ml': round(longitud_cableado_ml, 2),
        'cableado_renovar_pct': int(cableado_renovar_pct * 100),
        'requiere_cuadro_nuevo': park_age_years > 25,
        'ahorro_energia_led_porcentaje': 65 if requiere_actualizacion_led else 0
    }


# =====================================================
# VEGETATION RESTORATION ASSESSMENT
# =====================================================

def assess_vegetation_restoration(area_m2: float, park_age_years: int) -> Dict[str, Any]:
    """
    Assess vegetation restoration needs.
    
    Args:
        area_m2: Park area
        park_age_years: Years of neglect
        
    Returns:
        Dict with vegetation restoration assessment
    """
    # Estimate vegetation distribution
    area_cesped_m2 = area_m2 * 0.40  # 40% lawn
    area_arbustiva_m2 = area_m2 * 0.20  # 20% shrubs
    num_arboles = max(5, int(area_m2 / 100))  # 1 tree per 100 m²
    longitud_setos_ml = math.sqrt(area_m2) * 2  # Rough estimate
    
    # Determine restoration needs based on neglect
    if park_age_years > 25:
        cesped_resembrar_pct = 0.8
        arboles_podar = num_arboles
        arboles_sustituir = int(num_arboles * 0.3)
        setos_restaurar_pct = 0.9
        arbustos_replantar_pct = 0.6
    elif park_age_years > 15:
        cesped_resembrar_pct = 0.5
        arboles_podar = num_arboles
        arboles_sustituir = int(num_arboles * 0.15)
        setos_restaurar_pct = 0.6
        arbustos_replantar_pct = 0.3
    else:
        cesped_resembrar_pct = 0.2
        arboles_podar = int(num_arboles * 0.8)
        arboles_sustituir = int(num_arboles * 0.05)
        setos_restaurar_pct = 0.3
        arbustos_replantar_pct = 0.1
    
    # Irrigation system
    requiere_riego_nuevo = park_age_years > 20
    area_riego_m2 = area_cesped_m2 + area_arbustiva_m2
    
    return {
        'area_cesped_m2': round(area_cesped_m2, 2),
        'area_cesped_resembrar_m2': round(area_cesped_m2 * cesped_resembrar_pct, 2),
        'num_arboles_total': num_arboles,
        'num_arboles_podar': arboles_podar,
        'num_arboles_sustituir': arboles_sustituir,
        'longitud_setos_ml': round(longitud_setos_ml, 2),
        'longitud_setos_restaurar_ml': round(longitud_setos_ml * setos_restaurar_pct, 2),
        'area_arbustiva_m2': round(area_arbustiva_m2, 2),
        'area_arbustiva_replantar_m2': round(area_arbustiva_m2 * arbustos_replantar_pct, 2),
        'riego': {
            'requiere_sistema_nuevo': requiere_riego_nuevo,
            'area_riego_m2': round(area_riego_m2, 2),
            'reparar_m2': 0 if requiere_riego_nuevo else round(area_riego_m2, 2)
        }
    }


# =====================================================
# SPECIFIC BUDGET CALCULATION
# =====================================================

def calculate_specific_budget(
    area_m2: float,
    furniture: Dict[str, Any],
    pathways: Dict[str, Any],
    lighting: Dict[str, Any],
    vegetation: Dict[str, Any],
    presupuesto_base_eur: float
) -> Dict[str, Any]:
    """
    Calculate specific budget for park rehabilitation.
    
    Returns:
        Dict with detailed budget breakdown
    """
    costes_adicionales = {}
    
    # 1. Studies and design
    costes_adicionales['estudios_proyecto_eur'] = (
        REHABILITATION_COSTS['inventario_arbolado'] +
        REHABILITATION_COSTS['estudio_seguridad_estructuras'] +
        REHABILITATION_COSTS['proyecto_rehabilitacion'] +
        REHABILITATION_COSTS['direccion_obra']
    )
    
    # 2. Furniture rehabilitation
    coste_mobiliario = (
        furniture['bancos']['reparar'] * REHABILITATION_COSTS['banco_reparacion'] +
        furniture['bancos']['reemplazar'] * REHABILITATION_COSTS['banco_nuevo'] +
        furniture['papeleras']['reemplazar'] * REHABILITATION_COSTS['papelera_nueva'] +
        furniture['fuentes_bebedero']['reparar'] * REHABILITATION_COSTS['fuente_bebedero_reparacion'] +
        furniture['fuentes_bebedero']['reemplazar'] * REHABILITATION_COSTS['fuente_bebedero_nueva']
    )
    
    # Playground
    if furniture['juegos_infantiles']['existe']:
        if furniture['juegos_infantiles']['reparar']:
            coste_mobiliario += (
                furniture['juegos_infantiles']['area_m2'] * 
                REHABILITATION_COSTS['juegos_infantiles_reparacion_m2']
            )
        elif furniture['juegos_infantiles']['reemplazar']:
            coste_mobiliario += (
                furniture['juegos_infantiles']['area_m2'] * 
                REHABILITATION_COSTS['juegos_infantiles_nuevos_m2']
            )
    
    costes_adicionales['rehabilitacion_mobiliario_eur'] = coste_mobiliario
    
    # 3. Pathway rehabilitation
    bordillos_reparar_ml = pathways['perimetro_bordillos_ml'] * pathways['bordillos_reparar_pct'] / 100
    bordillos_reemplazar_ml = pathways['perimetro_bordillos_ml'] * pathways['bordillos_reemplazar_pct'] / 100
    
    costes_adicionales['rehabilitacion_pavimento_eur'] = (
        pathways['area_reparar_m2'] * REHABILITATION_COSTS['reparacion_pavimento_m2'] +
        pathways['area_reemplazar_m2'] * REHABILITATION_COSTS['reemplazo_pavimento_m2'] +
        bordillos_reparar_ml * REHABILITATION_COSTS['bordillo_reparacion_ml'] +
        bordillos_reemplazar_ml * REHABILITATION_COSTS['bordillo_nuevo_ml']
    )
    
    # 4. Lighting upgrade
    cableado_renovar_ml = lighting['longitud_cableado_ml'] * lighting['cableado_renovar_pct'] / 100
    
    if lighting['requiere_actualizacion_led']:
        # Full LED upgrade
        costes_adicionales['actualizacion_iluminacion_eur'] = (
            lighting['num_puntos_luz'] * REHABILITATION_COSTS['farola_led_nueva'] +
            cableado_renovar_ml * REHABILITATION_COSTS['cableado_renovacion_ml'] +
            (REHABILITATION_COSTS['cuadro_electrico_renovacion'] if lighting['requiere_cuadro_nuevo'] else 0)
        )
    else:
        # Just repairs
        costes_adicionales['actualizacion_iluminacion_eur'] = (
            lighting['num_puntos_luz'] * REHABILITATION_COSTS['farola_reparacion'] * 0.5 +
            cableado_renovar_ml * REHABILITATION_COSTS['cableado_renovacion_ml']
        )
    
    # 5. Vegetation restoration
    costes_adicionales['restauracion_vegetacion_eur'] = (
        vegetation['area_cesped_resembrar_m2'] * REHABILITATION_COSTS['resembrado_cesped_m2'] +
        vegetation['num_arboles_podar'] * REHABILITATION_COSTS['poda_saneamiento_arbol'] +
        vegetation['num_arboles_sustituir'] * REHABILITATION_COSTS['sustitucion_arbol_pequeno'] +
        vegetation['longitud_setos_restaurar_ml'] * REHABILITATION_COSTS['restauracion_setos_ml'] +
        vegetation['area_arbustiva_replantar_m2'] * REHABILITATION_COSTS['plantacion_arbustiva_m2']
    )
    
    # 6. Irrigation system
    if vegetation['riego']['requiere_sistema_nuevo']:
        costes_adicionales['sistema_riego_eur'] = (
            vegetation['riego']['area_riego_m2'] * REHABILITATION_COSTS['sistema_riego_nuevo_m2'] +
            REHABILITATION_COSTS['programador_riego_nuevo']
        )
    else:
        costes_adicionales['sistema_riego_eur'] = (
            vegetation['riego']['reparar_m2'] * REHABILITATION_COSTS['reparacion_riego_m2']
        )
    
    # 7. Accessibility improvements (if area > 500 m²)
    if area_m2 > 500:
        num_rampas = 2
        num_pasos = 2
        costes_adicionales['mejoras_accesibilidad_eur'] = (
            num_rampas * REHABILITATION_COSTS['rampa_accesibilidad_unidad'] +
            num_pasos * REHABILITATION_COSTS['paso_peatonal_adaptado_unidad'] +
            4 * REHABILITATION_COSTS['señalizacion_accesible_unidad']
        )
    else:
        costes_adicionales['mejoras_accesibilidad_eur'] = 0
    
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
    furniture: Dict,
    pathways: Dict,
    lighting: Dict,
    vegetation: Dict,
    budget: Dict
) -> tuple:
    """Generate recommendations and warnings."""
    recommendations = []
    warnings = []
    
    # Critical furniture issues
    if furniture['nivel_degradacion_mobiliario'] == 'critico':
        warnings.append(
            '⚠️ CRÍTICO: Mobiliario en estado ruinoso. Riesgo de accidentes. '
            'Reemplazo urgente necesario.'
        )
    
    # Playground safety
    if furniture['juegos_infantiles']['existe'] and furniture['juegos_infantiles']['reemplazar']:
        warnings.append(
            '⚠️ Juegos infantiles requieren reemplazo. Inspección de seguridad según UNE-EN 1176 obligatoria.'
        )
        recommendations.append(
            'Contratar empresa certificada para inspección y sustitución de juegos infantiles.'
        )
    
    # Pathway safety
    if pathways['nivel_degradacion_pavimento'] in ['severo', 'moderado']:
        warnings.append(
            'Pavimentos degradados suponen riesgo de tropiezos. Señalizar zonas peligrosas hasta rehabilitación.'
        )
    
    # Lighting efficiency
    if lighting['requiere_actualizacion_led']:
        recommendations.append(
            f'Actualización a LED permitirá ahorro energético del {lighting["ahorro_energia_led_porcentaje"]}% '
            f'({lighting["num_puntos_luz"]} puntos de luz).'
        )
    
    # Tree health
    if vegetation['num_arboles_sustituir'] > 5:
        warnings.append(
            f'{vegetation["num_arboles_sustituir"]} árboles requieren sustitución por razones fitosanitarias o seguridad.'
        )
        recommendations.append(
            'Realizar inventario completo de arbolado con evaluación de riesgo según protocolo ISA.'
        )
    
    # Irrigation
    if vegetation['riego']['requiere_sistema_nuevo']:
        recommendations.append(
            'Sistema de riego obsoleto. Instalar riego inteligente con sensores de humedad para ahorro de agua.'
        )
    
    # Budget
    if budget['incremento_vs_base_porcentaje'] > 120:
        warnings.append(
            f'Costes de rehabilitación suponen incremento del {budget["incremento_vs_base_porcentaje"]:.0f}% '
            'sobre revegetación base. Considerar ejecución por fases.'
        )
    
    # General recommendations
    recommendations.append(
        'Establecer plan de mantenimiento preventivo para evitar futura degradación.'
    )
    
    recommendations.append(
        'Considerar certificación ISO 14001 de gestión ambiental para el parque rehabilitado.'
    )
    
    recommendations.append(
        'Instalar señalización interpretativa sobre flora y fauna para valor educativo.'
    )
    
    if budget['coste_por_m2_total_eur'] > 80:
        recommendations.append(
            'Buscar financiación en programas de fondos FEDER o Next Generation EU para espacios verdes urbanos.'
        )
    
    return recommendations, warnings


# =====================================================
# VIABILITY ASSESSMENT
# =====================================================

def assess_viability(
    furniture: Dict,
    budget: Dict,
    area_m2: float
) -> Dict[str, str]:
    """Assess viability."""
    # Technical viability
    if furniture['nivel_degradacion_mobiliario'] == 'critico':
        viabilidad_tecnica = 'media'  # Requires extensive work
    else:
        viabilidad_tecnica = 'alta'
    
    # Economic viability
    coste_por_m2 = budget['coste_por_m2_total_eur']
    if coste_por_m2 < 70:
        viabilidad_economica = 'alta'
    elif coste_por_m2 < 100:
        viabilidad_economica = 'media'
    else:
        viabilidad_economica = 'baja'
    
    # Regulatory viability (park rehabilitation generally well-supported)
    viabilidad_normativa = 'alta'
    
    # Overall viability
    viabilities = [viabilidad_tecnica, viabilidad_economica, viabilidad_normativa]
    viability_order = ['alta', 'media', 'baja']
    viabilidad_final = max(viabilities, key=lambda v: viability_order.index(v) if v in viability_order else 1)
    
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
    """Serverless handler for specialized degraded park analysis."""
    
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
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            analisis_id = data.get('analisis_id')
            area_base_m2 = float(data.get('area_base_m2', 0))
            presupuesto_base_eur = float(data.get('presupuesto_base_eur', 0))
            park_age_years = int(data.get('park_age_years', 20))
            
            if not analisis_id or area_base_m2 <= 0:
                raise ValueError('Missing or invalid required fields')
            
            # Assessments
            furniture = assess_furniture_condition(area_base_m2, park_age_years)
            pathways = assess_pathway_condition(area_base_m2, park_age_years)
            lighting = assess_lighting(area_base_m2, park_age_years)
            vegetation = assess_vegetation_restoration(area_base_m2, park_age_years)
            
            # Budget
            budget = calculate_specific_budget(
                area_base_m2, furniture, pathways, lighting, vegetation, presupuesto_base_eur
            )
            
            # Recommendations
            recommendations, warnings = generate_recommendations_and_warnings(
                furniture, pathways, lighting, vegetation, budget
            )
            
            # Viability
            viability = assess_viability(furniture, budget, area_base_m2)
            
            # Response
            response = {
                'success': True,
                'analisis_id': analisis_id,
                'tipo_especializacion': 'parque_degradado',
                'area_base_m2': area_base_m2,
                'green_score_base': data.get('green_score_base', 0),
                'especies_base': data.get('especies_base', []),
                'presupuesto_base_eur': presupuesto_base_eur,
                'caracteristicas_especificas': {
                    'anos_desde_renovacion': park_age_years,
                    'estado_mobiliario': furniture,
                    'estado_pavimento': pathways,
                    'estado_iluminacion': lighting,
                    'necesidades_vegetacion': vegetation,
                },
                'analisis_adicional': {
                    'recomendaciones': recommendations,
                    'advertencias': warnings,
                },
                'presupuesto_adicional': budget['costes_adicionales'],
                'presupuesto_total_eur': budget['presupuesto_total_eur'],
                'incremento_vs_base_eur': budget['incremento_vs_base_eur'],
                'incremento_vs_base_porcentaje': budget['incremento_vs_base_porcentaje'],
                'viabilidad_tecnica': viability['viabilidad_tecnica'],
                'viabilidad_economica': viability['viabilidad_economica'],
                'viabilidad_normativa': viability['viabilidad_normativa'],
                'viabilidad_final': viability['viabilidad_final'],
                'notas': f'Análisis de parque degradado ({park_age_years} años). '
                        f'Estado: {furniture["nivel_degradacion_mobiliario"]}. '
                        f'Viabilidad: {viability["viabilidad_final"]}.',
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e),
                'message': 'Error en análisis especializado de parque degradado'
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
