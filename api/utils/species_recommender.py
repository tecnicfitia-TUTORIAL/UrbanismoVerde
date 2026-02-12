"""
Species Recommender System
Intelligent species recommendation based on context and technical constraints.

Features:
- Context-based filtering (rooftop, vertical garden, ground level, etc.)
- Technical constraint validation (depth, weight, support requirements)
- Priority-based scoring (economy, biodiversity, edible, aesthetics)
- Native species preference (complies with EU Restoration Regulation)
"""

from typing import Dict, List, Any
import math


# =====================================================
# SPECIES DATABASE (In-memory for MVP)
# In production: Replace with Supabase query
# =====================================================

ESPECIES_DATABASE = [
    {
        'nombre_comun': 'Sedum blanco',
        'nombre_cientifico': 'Sedum album',
        'tipo': 'Suculenta tapizante',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'nulo',
        'riego_necesario': 'nulo',
        'supervivencia_sin_riego_meses': 12,
        'altura_max_m': 0.1,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': False,
        'melifera': True,
        'contextos_validos': {
            'tejado_extensivo': True,
            'tejado_intensivo': True,
            'jardin_vertical': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 3,
            'peso_max_kg_m2': 5,
            'requiere_tutor': False
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'superficial',
            'tolerancia_sequia': 'muy_alta',
            'crecimiento_anual_cm': 5
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 0.5,
            'retencion_agua_porcentaje': 40,
            'enfriamiento_c': 1.5,
            'biodiversidad_score': 7
        }
    },
    {
        'nombre_comun': 'Tomillo',
        'nombre_cientifico': 'Thymus vulgaris',
        'tipo': 'Aromática tapizante',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'muy_bajo',
        'riego_necesario': 'mínimo',
        'supervivencia_sin_riego_meses': 6,
        'altura_max_m': 0.2,
        'requerimientos_sol': 'pleno_sol',
        'comestible': True,
        'aromatica': True,
        'melifera': True,
        'contextos_validos': {
            'tejado_extensivo': True,
            'tejado_intensivo': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 10,
            'peso_max_kg_m2': 12
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'superficial',
            'tolerancia_sequia': 'alta',
            'crecimiento_anual_cm': 10
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 0.8,
            'retencion_agua_porcentaje': 30,
            'biodiversidad_score': 9
        }
    },
    {
        'nombre_comun': 'Siempreviva',
        'nombre_cientifico': 'Sempervivum tectorum',
        'tipo': 'Suculenta roseta',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'nulo',
        'riego_necesario': 'nulo',
        'supervivencia_sin_riego_meses': 18,
        'altura_max_m': 0.15,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': False,
        'melifera': False,
        'contextos_validos': {
            'tejado_extensivo': True,
            'tejado_intensivo': True,
            'jardin_vertical': True
        },
        'restricciones': {
            'profundidad_minima_cm': 5,
            'peso_max_kg_m2': 8
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'muy_superficial',
            'tolerancia_sequia': 'extrema'
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 0.4,
            'retencion_agua_porcentaje': 35,
            'biodiversidad_score': 6
        }
    },
    {
        'nombre_comun': 'Romero',
        'nombre_cientifico': 'Rosmarinus officinalis',
        'tipo': 'Aromática arbustiva',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'muy_bajo',
        'riego_necesario': 'nulo',
        'supervivencia_sin_riego_meses': 12,
        'altura_max_m': 1.5,
        'requerimientos_sol': 'pleno_sol',
        'comestible': True,
        'aromatica': True,
        'melifera': True,
        'contextos_validos': {
            'tejado_intensivo': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 30,
            'peso_max_kg_m2': 35
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'medio',
            'tolerancia_sequia': 'muy_alta'
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 2.5,
            'retencion_agua_porcentaje': 25,
            'biodiversidad_score': 9
        }
    },
    {
        'nombre_comun': 'Lavanda',
        'nombre_cientifico': 'Lavandula angustifolia',
        'tipo': 'Aromática arbustiva',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'muy_bajo',
        'riego_necesario': 'bajo',
        'supervivencia_sin_riego_meses': 4,
        'altura_max_m': 0.6,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': True,
        'melifera': True,
        'contextos_validos': {
            'tejado_intensivo': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 20,
            'peso_max_kg_m2': 25
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'medio',
            'tolerancia_sequia': 'alta',
            'crecimiento_anual_cm': 15
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 1.2,
            'retencion_agua_porcentaje': 28,
            'biodiversidad_score': 8
        }
    },
    {
        'nombre_comun': 'Hiedra',
        'nombre_cientifico': 'Hedera helix',
        'tipo': 'Trepadora perenne',
        'nativa_espana': True,
        'nivel_economia': 'alta',
        'mantenimiento_anual': 'bajo',
        'riego_necesario': 'medio',
        'supervivencia_sin_riego_meses': 3,
        'altura_max_m': 0.3,
        'requerimientos_sol': 'media_sombra',
        'comestible': False,
        'aromatica': False,
        'melifera': False,
        'contextos_validos': {
            'jardin_vertical': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 20,
            'peso_max_kg_m2': 22,
            'requiere_tutor': True
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'medio',
            'tolerancia_sequia': 'media',
            'crecimiento_anual_cm': 50
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 1.8,
            'retencion_agua_porcentaje': 35,
            'biodiversidad_score': 6
        }
    },
    {
        'nombre_comun': 'Encina',
        'nombre_cientifico': 'Quercus ilex',
        'tipo': 'Árbol perennifolio',
        'nativa_espana': True,
        'nivel_economia': 'alta',
        'mantenimiento_anual': 'nulo',
        'riego_necesario': 'solo_establecimiento',
        'supervivencia_sin_riego_meses': 999,
        'altura_max_m': 15.0,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': False,
        'melifera': True,
        'contextos_validos': {
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 200,
            'peso_max_kg_m2': 500
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'profundo',
            'vida_util_anos': 500
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 800,
            'biodiversidad_score': 10
        }
    },
    {
        'nombre_comun': 'Santolina',
        'nombre_cientifico': 'Santolina chamaecyparissus',
        'tipo': 'Aromática compacta',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'muy_bajo',
        'riego_necesario': 'bajo',
        'supervivencia_sin_riego_meses': 6,
        'altura_max_m': 0.4,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': True,
        'melifera': True,
        'contextos_validos': {
            'tejado_extensivo': True,
            'tejado_intensivo': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 15,
            'peso_max_kg_m2': 18
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'superficial',
            'tolerancia_sequia': 'muy_alta',
            'crecimiento_anual_cm': 12
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 1.0,
            'retencion_agua_porcentaje': 32,
            'biodiversidad_score': 7
        }
    },
    {
        'nombre_comun': 'Festuca glauca',
        'nombre_cientifico': 'Festuca glauca',
        'tipo': 'Gramínea ornamental',
        'nativa_espana': True,
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'muy_bajo',
        'riego_necesario': 'bajo',
        'supervivencia_sin_riego_meses': 8,
        'altura_max_m': 0.25,
        'requerimientos_sol': 'pleno_sol',
        'comestible': False,
        'aromatica': False,
        'melifera': False,
        'contextos_validos': {
            'tejado_extensivo': True,
            'tejado_intensivo': True,
            'suelo': True
        },
        'restricciones': {
            'profundidad_minima_cm': 10,
            'peso_max_kg_m2': 15
        },
        'caracteristicas_tecnicas': {
            'sistema_raices': 'superficial',
            'tolerancia_sequia': 'alta',
            'crecimiento_anual_cm': 8
        },
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 0.7,
            'retencion_agua_porcentaje': 25,
            'biodiversidad_score': 5
        }
    },
]


# =====================================================
# SCORING WEIGHTS BY PRIORITY
# =====================================================

PRIORITY_WEIGHTS = {
    'economia': {
        'nivel_economia': 0.40,
        'mantenimiento': 0.30,
        'riego': 0.20,
        'biodiversidad': 0.05,
        'beneficios': 0.05
    },
    'biodiversidad': {
        'biodiversidad': 0.40,
        'melifera': 0.25,
        'nativa': 0.20,
        'beneficios': 0.10,
        'economia': 0.05
    },
    'comestible': {
        'comestible': 0.40,
        'aromatica': 0.25,
        'nativa': 0.15,
        'mantenimiento': 0.10,
        'economia': 0.10
    },
    'estetica': {
        'biodiversidad': 0.30,
        'aromatica': 0.25,
        'melifera': 0.20,
        'beneficios': 0.15,
        'economia': 0.10
    }
}


# =====================================================
# HELPER FUNCTIONS
# =====================================================

def normalize_economy_level(nivel: str) -> float:
    """Convert economy level to 0-1 score (higher is more economical)"""
    mapping = {
        'muy_alta': 1.0,
        'alta': 0.75,
        'media': 0.5,
        'baja': 0.25
    }
    return mapping.get(nivel, 0.5)


def normalize_maintenance_level(nivel: str) -> float:
    """Convert maintenance level to 0-1 score (higher is less maintenance)"""
    mapping = {
        'nulo': 1.0,
        'muy_bajo': 0.9,
        'bajo': 0.7,
        'medio': 0.5,
        'alto': 0.3
    }
    return mapping.get(nivel, 0.5)


def normalize_irrigation_level(nivel: str) -> float:
    """Convert irrigation level to 0-1 score (higher is less irrigation)"""
    mapping = {
        'nulo': 1.0,
        'solo_establecimiento': 0.95,
        'mínimo': 0.85,
        'bajo': 0.7,
        'medio': 0.5,
        'alto': 0.3
    }
    return mapping.get(nivel, 0.5)


# =====================================================
# MAIN RECOMMENDATION FUNCTION
# =====================================================

def recommend_species_by_context(
    tipo_especializacion: str,
    caracteristicas: Dict[str, Any],
    prioridad: str = 'economia',
    max_especies: int = 10
) -> List[Dict[str, Any]]:
    """
    Recommend species based on context and constraints.
    
    Args:
        tipo_especializacion: Context type (tejado, jardin_vertical, solar_vacio, etc.)
        caracteristicas: Technical characteristics dict with:
            - profundidad_sustrato_cm: Available substrate depth
            - carga_admisible_kg_m2: Maximum admissible load (optional)
            - exposicion_solar: Solar exposure (pleno_sol, media_sombra, sombra)
            - riego_disponible: Irrigation availability (automatico, manual, ninguno)
            - mantenimiento_deseado: Desired maintenance level (bajo, medio, alto)
        prioridad: Priority for scoring (economia, biodiversidad, comestible, estetica)
        max_especies: Maximum number of species to return
        
    Returns:
        List of recommended species with suitability scores (0-100)
    """
    # Map specialization types to context keys
    context_mapping = {
        'tejado': 'tejado_extensivo',  # Will be refined based on characteristics
        'jardin_vertical': 'jardin_vertical',
        'solar_vacio': 'suelo',
        'zona_abandonada': 'suelo',
        'parque_degradado': 'suelo'
    }
    
    # Determine context key
    if tipo_especializacion == 'tejado':
        # Refine based on depth/load capacity
        profundidad = caracteristicas.get('profundidad_sustrato_cm', 15)
        if profundidad >= 30:
            context_key = 'tejado_intensivo'
        elif profundidad >= 15:
            context_key = 'semi_intensivo'  # Will match both
        else:
            context_key = 'tejado_extensivo'
    else:
        context_key = context_mapping.get(tipo_especializacion, 'suelo')
    
    especies_aptas = []
    
    for especie in ESPECIES_DATABASE:
        # Filter 1: Check if species is valid for this context
        if not especie['contextos_validos'].get(context_key, False):
            # For tejado, also check if it's valid for both types
            if context_key == 'semi_intensivo':
                if not (especie['contextos_validos'].get('tejado_extensivo', False) and
                        especie['contextos_validos'].get('tejado_intensivo', False)):
                    continue
            else:
                continue
        
        # Filter 2: Validate technical constraints
        restricciones = especie['restricciones']
        
        # Check substrate depth
        profundidad_disponible = caracteristicas.get('profundidad_sustrato_cm', 100)
        if profundidad_disponible < restricciones.get('profundidad_minima_cm', 0):
            continue
        
        # Check weight capacity (if specified)
        carga_admisible = caracteristicas.get('carga_admisible_kg_m2', 9999)
        if carga_admisible < restricciones.get('peso_max_kg_m2', 0):
            continue
        
        # Filter 3: Check solar exposure compatibility
        exposicion_solar = caracteristicas.get('exposicion_solar', 'pleno_sol')
        req_sol = especie['requerimientos_sol']
        
        # Simple compatibility check
        compatible_sol = True
        if exposicion_solar == 'sombra' and req_sol == 'pleno_sol':
            compatible_sol = False
        elif exposicion_solar == 'pleno_sol' and req_sol == 'sombra':
            compatible_sol = False
        
        if not compatible_sol:
            continue
        
        # Calculate suitability score
        score = calculate_suitability_score(especie, caracteristicas, prioridad)
        
        especies_aptas.append({
            **especie,
            'idoneidad_score': score
        })
    
    # Sort by score (descending) and return top N
    especies_aptas.sort(key=lambda x: x['idoneidad_score'], reverse=True)
    return especies_aptas[:max_especies]


def calculate_suitability_score(
    especie: Dict[str, Any],
    caracteristicas: Dict[str, Any],
    prioridad: str
) -> float:
    """
    Calculate suitability score (0-100) for a species based on priority.
    
    Args:
        especie: Species data dictionary
        caracteristicas: Site characteristics
        prioridad: Scoring priority
        
    Returns:
        Suitability score (0-100)
    """
    weights = PRIORITY_WEIGHTS.get(prioridad, PRIORITY_WEIGHTS['economia'])
    
    score = 0.0
    
    # Economy component
    if 'economia' in weights or 'nivel_economia' in weights:
        economy_score = normalize_economy_level(especie.get('nivel_economia', 'media'))
        score += economy_score * weights.get('nivel_economia', weights.get('economia', 0))
    
    # Maintenance component
    if 'mantenimiento' in weights:
        maintenance_score = normalize_maintenance_level(especie.get('mantenimiento_anual', 'medio'))
        score += maintenance_score * weights['mantenimiento']
    
    # Irrigation component
    if 'riego' in weights:
        irrigation_score = normalize_irrigation_level(especie.get('riego_necesario', 'medio'))
        score += irrigation_score * weights['riego']
    
    # Biodiversity component
    if 'biodiversidad' in weights:
        bio_score = especie.get('beneficios_ambientales', {}).get('biodiversidad_score', 5) / 10.0
        score += bio_score * weights['biodiversidad']
    
    # Pollinator-friendly (melifera)
    if 'melifera' in weights:
        melifera_score = 1.0 if especie.get('melifera', False) else 0.3
        score += melifera_score * weights['melifera']
    
    # Native species bonus
    if 'nativa' in weights:
        nativa_score = 1.0 if especie.get('nativa_espana', False) else 0.5
        score += nativa_score * weights['nativa']
    
    # Edible/aromatic
    if 'comestible' in weights:
        comestible_score = 1.0 if especie.get('comestible', False) else 0.0
        score += comestible_score * weights['comestible']
    
    if 'aromatica' in weights:
        aromatic_score = 1.0 if especie.get('aromatica', False) else 0.3
        score += aromatic_score * weights['aromatica']
    
    # Environmental benefits
    if 'beneficios' in weights:
        beneficios = especie.get('beneficios_ambientales', {})
        co2_score = min(beneficios.get('co2_kg_m2_anual', 0) / 5.0, 1.0)  # Normalize to max 5 kg
        retencion_score = beneficios.get('retencion_agua_porcentaje', 0) / 100.0
        benefits_score = (co2_score + retencion_score) / 2.0
        score += benefits_score * weights['beneficios']
    
    # Convert to 0-100 scale
    return round(score * 100, 2)


def get_predefined_mixes(tipo_especializacion: str) -> List[Dict[str, Any]]:
    """
    Get predefined species mixes optimized for specific contexts.
    
    Args:
        tipo_especializacion: Context type
        
    Returns:
        List of predefined mix configurations
    """
    mixes = {
        'tejado': [
            {
                'nombre': 'Mix Económico Extensivo',
                'descripcion': 'Especies de muy bajo coste y sin necesidad de riego',
                'especies': ['Sedum album', 'Sempervivum tectorum', 'Festuca glauca'],
                'caracteristicas': {
                    'profundidad_minima_cm': 8,
                    'peso_kg_m2': 80,
                    'coste_relativo': 'muy_bajo',
                    'mantenimiento': 'nulo',
                    'riego': 'ninguno'
                }
            },
            {
                'nombre': 'Mix Aromático Intensivo',
                'descripcion': 'Especies aromáticas y comestibles para tejado accesible',
                'especies': ['Thymus vulgaris', 'Rosmarinus officinalis', 'Lavandula angustifolia'],
                'caracteristicas': {
                    'profundidad_minima_cm': 25,
                    'peso_kg_m2': 180,
                    'coste_relativo': 'bajo',
                    'mantenimiento': 'muy_bajo',
                    'riego': 'mínimo'
                }
            }
        ],
        'jardin_vertical': [
            {
                'nombre': 'Mix Vertical Bajo Mantenimiento',
                'descripcion': 'Especies trepadoras resistentes',
                'especies': ['Hedera helix', 'Sedum album'],
                'caracteristicas': {
                    'profundidad_minima_cm': 15,
                    'requiere_estructura': True,
                    'coste_relativo': 'medio',
                    'mantenimiento': 'bajo'
                }
            }
        ],
        'suelo': [
            {
                'nombre': 'Mix Nativo Biodiversidad',
                'descripcion': 'Especies nativas de alto valor ecológico',
                'especies': ['Quercus ilex', 'Rosmarinus officinalis', 'Thymus vulgaris'],
                'caracteristicas': {
                    'biodiversidad_score': 9,
                    'coste_relativo': 'medio',
                    'mantenimiento': 'bajo',
                    'vida_util': 'larga'
                }
            }
        ]
    }
    
    # Return mixes for the specified context or empty list
    if tipo_especializacion == 'tejado':
        return mixes['tejado']
    elif tipo_especializacion == 'jardin_vertical':
        return mixes['jardin_vertical']
    else:
        return mixes['suelo']
