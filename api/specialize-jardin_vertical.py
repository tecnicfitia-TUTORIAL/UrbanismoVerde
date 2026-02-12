"""
Specialized Vertical Garden Analysis API Endpoint
Implements vertical garden support structure, irrigation system, and species selection.

Architecture:
- Wall structural assessment and anchoring requirements
- Vertical support system design (modular panels, pockets, trellises)
- Vertical irrigation system (drip, capillary, hydroponic)
- Species selection for vertical growth
- Installation and maintenance costs specific to vertical gardens
"""

from http.server import BaseHTTPRequestHandler
import json
import math
from typing import Dict, Any, List


# =====================================================
# VERTICAL GARDEN TYPES AND SYSTEMS
# =====================================================

VERTICAL_SYSTEMS = {
    'modular_panel': {
        'descripcion': 'Paneles modulares con sustrato',
        'profundidad_sustrato_cm': 8,
        'peso_saturado_kg_m2': 60,
        'coste_estructura_m2': 85.0,
        'durabilidad_anos': 15,
        'mantenimiento': 'medio',
        'ideal_para': 'fachadas grandes, edificios'
    },
    'bolsillos_fieltro': {
        'descripcion': 'Bolsillos de fieltro geotextil',
        'profundidad_sustrato_cm': 5,
        'peso_saturado_kg_m2': 35,
        'coste_estructura_m2': 55.0,
        'durabilidad_anos': 8,
        'mantenimiento': 'bajo',
        'ideal_para': 'muros pequeños, interiores'
    },
    'celosia_trepadora': {
        'descripcion': 'Celosía con plantas trepadoras',
        'profundidad_sustrato_cm': 30,
        'peso_base_kg_m2': 25,
        'coste_estructura_m2': 45.0,
        'durabilidad_anos': 20,
        'mantenimiento': 'bajo',
        'ideal_para': 'patios, separación espacios'
    },
    'hidroponico': {
        'descripcion': 'Sistema hidropónico sin sustrato',
        'profundidad_sustrato_cm': 0,
        'peso_saturado_kg_m2': 40,
        'coste_estructura_m2': 120.0,
        'durabilidad_anos': 12,
        'mantenimiento': 'alto',
        'ideal_para': 'instalaciones tecnológicas'
    }
}

# =====================================================
# INSTALLATION COSTS
# =====================================================

INSTALLATION_COSTS = {
    # Support structure
    'anclajes_murales_unidad': 25.0,
    'railes_soporte_ml': 35.0,
    'estructura_metalica_m2': 45.0,
    'impermeabilizacion_mural_m2': 22.0,
    'lamina_antiraices_m2': 8.0,
    
    # Irrigation systems
    'riego_gota_vertical_m2': 28.0,
    'riego_capilar_m2': 35.0,
    'riego_hidroponico_m2': 65.0,
    'bomba_presion_vertical': 450.0,
    'programador_fertirrigacion': 650.0,
    'sensores_humedad_unidad': 85.0,
    'deposito_nutrientes_50l': 180.0,
    
    # Access and safety
    'andamio_fachada_m2_dia': 8.0,
    'proteccion_colectiva_ml': 15.0,
    'seguro_montaje_altura': 450.0,
    
    # Maintenance equipment
    'sistema_acceso_mantenimiento': 850.0,
    'plataforma_elevadora_dia': 250.0,
    
    # Studies
    'estudio_carga_mural': 800.0,
    'proyecto_tecnico_jardin_vertical': 1200.0,
    'certificado_estructural': 450.0,
}


# =====================================================
# WALL STRUCTURAL ASSESSMENT
# =====================================================

def assess_wall_structure(
    area_vertical_m2: float,
    wall_height_m: float = 3.0,
    wall_type: str = 'hormigon'
) -> Dict[str, Any]:
    """
    Assess wall structural capacity for vertical garden.
    
    Wall types and typical capacities:
    - hormigon (concrete): 200+ kg/m² capacity
    - ladrillo_macizo (solid brick): 150+ kg/m²
    - ladrillo_hueco (hollow brick): 80 kg/m²
    - tabique_ligero (light partition): 30 kg/m²
    
    Args:
        area_vertical_m2: Vertical garden area
        wall_height_m: Wall height
        wall_type: Type of wall construction
        
    Returns:
        Dict with structural assessment
    """
    # Wall capacity by type
    wall_capacities = {
        'hormigon': 250,
        'ladrillo_macizo': 180,
        'ladrillo_hueco': 90,
        'tabique_ligero': 40,
        'piedra': 200
    }
    
    capacidad_mural_kg_m2 = wall_capacities.get(wall_type, 150)
    
    # Calculate anchor points needed (typically 1 per m²)
    num_anclajes = int(area_vertical_m2 * 1.5)  # 1.5x for safety
    
    # Determine if wall reinforcement needed
    peso_sistema_max_kg_m2 = 60  # Maximum for modular system
    margen_seguridad = capacidad_mural_kg_m2 - peso_sistema_max_kg_m2
    
    if margen_seguridad < 30:
        refuerzo_necesario = True
        viabilidad_estructural = 'baja'
    elif margen_seguridad < 60:
        refuerzo_necesario = False
        viabilidad_estructural = 'media'
    else:
        refuerzo_necesario = False
        viabilidad_estructural = 'alta'
    
    return {
        'tipo_muro': wall_type,
        'capacidad_mural_kg_m2': capacidad_mural_kg_m2,
        'altura_muro_m': wall_height_m,
        'area_vertical_m2': area_vertical_m2,
        'num_anclajes_necesarios': num_anclajes,
        'refuerzo_estructural_necesario': refuerzo_necesario,
        'margen_seguridad_kg_m2': margen_seguridad,
        'viabilidad_estructural': viabilidad_estructural,
        'requiere_estudio_ingenieria': area_vertical_m2 > 20 or refuerzo_necesario
    }


# =====================================================
# SYSTEM RECOMMENDATION
# =====================================================

def recommend_vertical_system(
    area_m2: float,
    wall_structure: Dict[str, Any],
    location: str = 'exterior',
    budget_priority: str = 'medio'
) -> Dict[str, Any]:
    """
    Recommend vertical garden system based on constraints.
    
    Args:
        area_m2: Vertical area
        wall_structure: Wall structural assessment
        location: 'interior' or 'exterior'
        budget_priority: 'bajo', 'medio', 'alto'
        
    Returns:
        Dict with recommended system
    """
    capacidad = wall_structure['capacidad_mural_kg_m2']
    
    # Filter systems by structural capacity
    sistemas_aptos = []
    for nombre, sistema in VERTICAL_SYSTEMS.items():
        peso = sistema.get('peso_saturado_kg_m2', sistema.get('peso_base_kg_m2', 0))
        
        if peso <= capacidad - 30:  # 30 kg/m² safety margin
            # Score system
            score = 0
            
            # Budget consideration
            if budget_priority == 'bajo':
                score += (150 - sistema['coste_estructura_m2']) / 10
            elif budget_priority == 'alto':
                score += sistema['durabilidad_anos']
            else:
                score += (sistema['durabilidad_anos'] + (150 - sistema['coste_estructura_m2']) / 10) / 2
            
            # Size consideration
            if area_m2 > 30 and nombre == 'modular_panel':
                score += 20
            elif area_m2 < 10 and nombre == 'bolsillos_fieltro':
                score += 15
            
            # Location consideration
            if location == 'interior' and nombre in ['bolsillos_fieltro', 'hidroponico']:
                score += 10
            elif location == 'exterior' and nombre in ['modular_panel', 'celosia_trepadora']:
                score += 10
            
            sistemas_aptos.append({
                'nombre': nombre,
                'score': score,
                **sistema
            })
    
    # Sort by score
    sistemas_aptos.sort(key=lambda x: x['score'], reverse=True)
    
    sistema_recomendado = sistemas_aptos[0] if sistemas_aptos else None
    
    return {
        'sistema_recomendado': sistema_recomendado['nombre'] if sistema_recomendado else 'ninguno',
        'descripcion': sistema_recomendado['descripcion'] if sistema_recomendado else 'No hay sistema viable',
        'caracteristicas': sistema_recomendado if sistema_recomendado else {},
        'alternativas': [s['nombre'] for s in sistemas_aptos[1:3]] if len(sistemas_aptos) > 1 else []
    }


# =====================================================
# IRRIGATION SYSTEM DESIGN
# =====================================================

def design_irrigation_system(
    area_m2: float,
    system_type: str,
    wall_height_m: float
) -> Dict[str, Any]:
    """
    Design vertical irrigation system.
    
    Args:
        area_m2: Vertical garden area
        system_type: Type of vertical system
        wall_height_m: Wall height
        
    Returns:
        Dict with irrigation system design
    """
    # Determine irrigation type based on system
    if system_type == 'hidroponico':
        tipo_riego = 'hidroponico'
        coste_m2 = INSTALLATION_COSTS['riego_hidroponico_m2']
        requiere_fertirrigacion = True
        consumo_agua_l_m2_dia = 3.0
    elif system_type == 'bolsillos_fieltro':
        tipo_riego = 'capilar'
        coste_m2 = INSTALLATION_COSTS['riego_capilar_m2']
        requiere_fertirrigacion = False
        consumo_agua_l_m2_dia = 2.5
    else:
        tipo_riego = 'gota_vertical'
        coste_m2 = INSTALLATION_COSTS['riego_gota_vertical_m2']
        requiere_fertirrigacion = False
        consumo_agua_l_m2_dia = 2.0
    
    # Calculate components
    requiere_bomba = wall_height_m > 2.5
    num_sensores = max(2, int(area_m2 / 15))  # 1 sensor per 15 m²
    
    # Water consumption
    consumo_anual_m3 = (area_m2 * consumo_agua_l_m2_dia * 365) / 1000
    
    return {
        'tipo_riego': tipo_riego,
        'coste_instalacion_m2': coste_m2,
        'requiere_bomba_presion': requiere_bomba,
        'requiere_fertirrigacion': requiere_fertirrigacion,
        'num_sensores_humedad': num_sensores,
        'consumo_agua_l_m2_dia': consumo_agua_l_m2_dia,
        'consumo_agua_anual_m3': round(consumo_anual_m3, 2),
        'requiere_programador': True,
        'automatizacion_recomendada': area_m2 > 10
    }


# =====================================================
# SPECIES SELECTION FOR VERTICAL GARDENS
# =====================================================

def select_vertical_species(
    system_type: str,
    location: str,
    profundidad_sustrato_cm: float
) -> List[Dict[str, Any]]:
    """
    Select appropriate species for vertical garden.
    
    Returns:
        List of recommended species
    """
    especies_verticales = [
        {
            'nombre': 'Hedera helix (Hiedra)',
            'tipo': 'Trepadora',
            'profundidad_min_cm': 15,
            'sistemas': ['celosia_trepadora', 'modular_panel'],
            'ubicacion': ['exterior', 'interior_luminoso'],
            'riego': 'medio',
            'crecimiento_anual_cm': 50
        },
        {
            'nombre': 'Sedum album (Sedum blanco)',
            'tipo': 'Suculenta',
            'profundidad_min_cm': 5,
            'sistemas': ['modular_panel', 'bolsillos_fieltro'],
            'ubicacion': ['exterior'],
            'riego': 'muy_bajo',
            'crecimiento_anual_cm': 5
        },
        {
            'nombre': 'Epipremnum aureum (Potos)',
            'tipo': 'Colgante',
            'profundidad_min_cm': 10,
            'sistemas': ['bolsillos_fieltro', 'hidroponico'],
            'ubicacion': ['interior'],
            'riego': 'medio',
            'crecimiento_anual_cm': 30
        },
        {
            'nombre': 'Asplenium (Helecho)',
            'tipo': 'Helecho',
            'profundidad_min_cm': 12,
            'sistemas': ['modular_panel', 'bolsillos_fieltro'],
            'ubicacion': ['interior', 'exterior_sombra'],
            'riego': 'alto',
            'crecimiento_anual_cm': 15
        },
        {
            'nombre': 'Trachelospermum jasminoides (Jazmín)',
            'tipo': 'Trepadora aromática',
            'profundidad_min_cm': 20,
            'sistemas': ['celosia_trepadora', 'modular_panel'],
            'ubicacion': ['exterior'],
            'riego': 'medio',
            'crecimiento_anual_cm': 40
        },
        {
            'nombre': 'Ficus pumila (Ficus trepador)',
            'tipo': 'Trepadora',
            'profundidad_min_cm': 15,
            'sistemas': ['modular_panel', 'celosia_trepadora'],
            'ubicacion': ['interior', 'exterior_templado'],
            'riego': 'medio',
            'crecimiento_anual_cm': 35
        }
    ]
    
    # Filter by constraints
    especies_aptas = []
    for especie in especies_verticales:
        if profundidad_sustrato_cm >= especie['profundidad_min_cm']:
            if system_type in especie['sistemas']:
                if location in especie['ubicacion'] or location == 'exterior' and 'exterior' in str(especie['ubicacion']):
                    especies_aptas.append(especie)
    
    return especies_aptas[:5]  # Return top 5


# =====================================================
# SPECIFIC BUDGET CALCULATION
# =====================================================

def calculate_specific_budget(
    area_m2: float,
    wall_height_m: float,
    perimeter_ml: float,
    wall_structure: Dict[str, Any],
    system: Dict[str, Any],
    irrigation: Dict[str, Any],
    presupuesto_base_eur: float
) -> Dict[str, Any]:
    """
    Calculate specific budget for vertical garden.
    
    Returns:
        Dict with detailed budget breakdown
    """
    costes_adicionales = {}
    
    # 1. Studies and certifications
    if wall_structure['requiere_estudio_ingenieria']:
        costes_adicionales['estudios_certificaciones_eur'] = (
            INSTALLATION_COSTS['estudio_carga_mural'] +
            INSTALLATION_COSTS['proyecto_tecnico_jardin_vertical'] +
            INSTALLATION_COSTS['certificado_estructural']
        )
    else:
        costes_adicionales['estudios_certificaciones_eur'] = (
            INSTALLATION_COSTS['proyecto_tecnico_jardin_vertical']
        )
    
    # 2. Wall preparation
    costes_adicionales['preparacion_muro_eur'] = (
        area_m2 * INSTALLATION_COSTS['impermeabilizacion_mural_m2'] +
        area_m2 * INSTALLATION_COSTS['lamina_antiraices_m2']
    )
    
    # 3. Support structure
    sistema_elegido = VERTICAL_SYSTEMS.get(system['sistema_recomendado'], VERTICAL_SYSTEMS['modular_panel'])
    costes_adicionales['estructura_soporte_eur'] = (
        wall_structure['num_anclajes_necesarios'] * INSTALLATION_COSTS['anclajes_murales_unidad'] +
        perimeter_ml * INSTALLATION_COSTS['railes_soporte_ml'] +
        area_m2 * INSTALLATION_COSTS['estructura_metalica_m2'] +
        area_m2 * sistema_elegido['coste_estructura_m2']
    )
    
    # 4. Irrigation system
    coste_riego = area_m2 * irrigation['coste_instalacion_m2']
    if irrigation['requiere_bomba_presion']:
        coste_riego += INSTALLATION_COSTS['bomba_presion_vertical']
    if irrigation['requiere_fertirrigacion']:
        coste_riego += (
            INSTALLATION_COSTS['programador_fertirrigacion'] +
            INSTALLATION_COSTS['deposito_nutrientes_50l']
        )
    coste_riego += irrigation['num_sensores_humedad'] * INSTALLATION_COSTS['sensores_humedad_unidad']
    
    costes_adicionales['sistema_riego_eur'] = coste_riego
    
    # 5. Installation (access and safety)
    dias_instalacion = max(3, int(area_m2 / 10))  # 1 day per 10 m²
    costes_adicionales['instalacion_seguridad_eur'] = (
        area_m2 * INSTALLATION_COSTS['andamio_fachada_m2_dia'] * dias_instalacion +
        perimeter_ml * INSTALLATION_COSTS['proteccion_colectiva_ml'] +
        INSTALLATION_COSTS['seguro_montaje_altura']
    )
    
    # 6. Maintenance access system
    if area_m2 > 15:
        costes_adicionales['acceso_mantenimiento_eur'] = (
            INSTALLATION_COSTS['sistema_acceso_mantenimiento']
        )
    else:
        costes_adicionales['acceso_mantenimiento_eur'] = 0
    
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
    wall_structure: Dict,
    system: Dict,
    irrigation: Dict,
    budget: Dict
) -> tuple:
    """Generate recommendations and warnings."""
    recommendations = []
    warnings = []
    
    # Structural warnings
    if wall_structure['refuerzo_estructural_necesario']:
        warnings.append(
            '⚠️ CRÍTICO: Muro requiere refuerzo estructural. '
            'Consultar ingeniero estructural antes de proceder.'
        )
    
    if wall_structure['requiere_estudio_ingenieria']:
        warnings.append(
            'Instalación requiere estudio de cargas y certificado estructural obligatorio.'
        )
    
    # System recommendations
    if system['alternativas']:
        recommendations.append(
            f'Sistemas alternativos viables: {", ".join(system["alternativas"])}. '
            'Considerar según presupuesto y mantenimiento disponible.'
        )
    
    # Irrigation
    if irrigation['tipo_riego'] == 'hidroponico':
        warnings.append(
            'Sistema hidropónico requiere mantenimiento especializado y control semanal de nutrientes.'
        )
        recommendations.append(
            'Contratar servicio de mantenimiento profesional para sistema hidropónico.'
        )
    
    if irrigation['consumo_agua_anual_m3'] > 10:
        recommendations.append(
            f'Consumo anual estimado: {irrigation["consumo_agua_anual_m3"]:.1f} m³. '
            'Considerar sistema de recogida de agua de lluvia para reutilización.'
        )
    
    # Installation
    warnings.append(
        'Trabajos en altura requieren empresa con certificación de trabajos verticales.'
    )
    
    # Maintenance
    recommendations.append(
        'Establecer contrato de mantenimiento preventivo: riego, poda, fertilización.'
    )
    
    recommendations.append(
        'Inspección estructural anual de anclajes y soportes obligatoria para seguridad.'
    )
    
    # Budget
    if budget['coste_por_m2_total_eur'] > 200:
        warnings.append(
            f'Coste elevado por m² ({budget["coste_por_m2_total_eur"]:.0f} €/m²). '
            'Jardín vertical es inversión significativa.'
        )
    
    # General
    recommendations.append(
        'Jardín vertical aporta aislamiento térmico (ahorro energético) y mejora calidad del aire.'
    )
    
    if irrigation['automatizacion_recomendada']:
        recommendations.append(
            'Automatización del riego con sensores optimiza consumo de agua y reduce mantenimiento.'
        )
    
    return recommendations, warnings


# =====================================================
# VIABILITY ASSESSMENT
# =====================================================

def assess_viability(
    wall_structure: Dict,
    budget: Dict,
    area_m2: float
) -> Dict[str, str]:
    """Assess viability."""
    # Technical viability
    viabilidad_tecnica = wall_structure['viabilidad_estructural']
    
    # Economic viability
    coste_por_m2 = budget['coste_por_m2_total_eur']
    if coste_por_m2 < 150:
        viabilidad_economica = 'alta'
    elif coste_por_m2 < 220:
        viabilidad_economica = 'media'
    else:
        viabilidad_economica = 'baja'
    
    # Regulatory viability
    if wall_structure['requiere_estudio_ingenieria']:
        viabilidad_normativa = 'media'
    else:
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
    """Serverless handler for specialized vertical garden analysis."""
    
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
            wall_height_m = float(data.get('wall_height_m', 3.0))
            wall_type = data.get('wall_type', 'hormigon')
            location = data.get('location', 'exterior')
            budget_priority = data.get('budget_priority', 'medio')
            
            if not analisis_id or area_base_m2 <= 0:
                raise ValueError('Missing or invalid required fields')
            
            # Calculate perimeter (rough estimate for vertical)
            perimeter_ml = 2 * (math.sqrt(area_base_m2) + wall_height_m)
            
            # Assessments
            wall_structure = assess_wall_structure(area_base_m2, wall_height_m, wall_type)
            system = recommend_vertical_system(area_base_m2, wall_structure, location, budget_priority)
            irrigation = design_irrigation_system(area_base_m2, system['sistema_recomendado'], wall_height_m)
            species = select_vertical_species(
                system['sistema_recomendado'],
                location,
                system['caracteristicas'].get('profundidad_sustrato_cm', 10)
            )
            
            # Budget
            budget = calculate_specific_budget(
                area_base_m2, wall_height_m, perimeter_ml,
                wall_structure, system, irrigation, presupuesto_base_eur
            )
            
            # Recommendations
            recommendations, warnings = generate_recommendations_and_warnings(
                wall_structure, system, irrigation, budget
            )
            
            # Viability
            viability = assess_viability(wall_structure, budget, area_base_m2)
            
            # Response
            response = {
                'success': True,
                'analisis_id': analisis_id,
                'tipo_especializacion': 'jardin_vertical',
                'area_base_m2': area_base_m2,
                'green_score_base': data.get('green_score_base', 0),
                'especies_base': data.get('especies_base', []),
                'presupuesto_base_eur': presupuesto_base_eur,
                'caracteristicas_especificas': {
                    'evaluacion_muro': wall_structure,
                    'sistema_recomendado': system,
                    'sistema_riego': irrigation,
                    'especies_recomendadas_vertical': species,
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
                'notas': f'Análisis de jardín vertical. Sistema: {system["sistema_recomendado"]}. '
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
                'message': 'Error en análisis especializado de jardín vertical'
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
