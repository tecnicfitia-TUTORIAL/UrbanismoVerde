"""
Native Species Catalog - Spain (Península Ibérica)

Catalog of native plant species suitable for green roofs in Spain.
Complies with EU Restoration Regulation requirements for native species.

Data based on:
- Real Jardín Botánico (CSIC)
- Flora Ibérica
- MITECO native species database
"""

# =====================================================
# SPECIES CATALOG
# =====================================================

ESPECIES = {
    'aromaticas': [
        {
            'nombre_comun': 'Lavanda',
            'nombre_cientifico': 'Lavandula angustifolia',
            'tipo': 'Aromática',
            'nativa_iberia': True,
            'clima': 'mediterráneo',
            'requisitos_sol': 'pleno',  # pleno, media_sombra, sombra
            'requisitos_agua': 'bajo',   # bajo, medio, alto
            'densidad_m2': 9,            # plantas por m²
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


# Species selection constants
MAX_AROMATICAS_SOL_DIRECTO = 3
MAX_SUCULENTAS_SOL_DIRECTO = 1
MAX_AROMATICAS_MIXTA = 2
MAX_SOMBRA_MIXTA = 2


def get_species_by_exposure(clasificacion_solar: str, max_especies: int = 4) -> list:
    """
    Filter species by solar exposure classification.
    
    Args:
        clasificacion_solar: 'SOL_DIRECTO', 'MIXTA', or 'SOMBRA'
        max_especies: Maximum number of species to return
        
    Returns:
        List of recommended species sorted by viability
    """
    if clasificacion_solar == 'SOL_DIRECTO':
        # High sun: aromatics and succulents
        especies_sol = (ESPECIES['aromaticas'][:MAX_AROMATICAS_SOL_DIRECTO] + 
                       ESPECIES['suculentas'][:MAX_SUCULENTAS_SOL_DIRECTO])
        viabilidades = [0.95, 0.92, 0.90, 0.88]
    elif clasificacion_solar == 'SOMBRA':
        # Shade: shade-tolerant species
        especies_sol = ESPECIES['sombra']
        viabilidades = [0.85, 0.82, 0.80]
    else:  # MIXTA
        # Mixed: combination
        especies_sol = (ESPECIES['aromaticas'][:MAX_AROMATICAS_MIXTA] + 
                       ESPECIES['sombra'][:MAX_SOMBRA_MIXTA])
        viabilidades = [0.88, 0.85, 0.83, 0.80]
    
    # Add viability and reason
    result = []
    for i, especie in enumerate(especies_sol[:max_especies]):
        esp_copy = especie.copy()
        esp_copy['viabilidad'] = viabilidades[i] if i < len(viabilidades) else 0.75
        
        # Add recommendation reason
        if clasificacion_solar == 'SOL_DIRECTO':
            esp_copy['razon'] = f"Ideal para sol directo, nativa, {especie['requisitos_agua']} riego"
        elif clasificacion_solar == 'SOMBRA':
            esp_copy['razon'] = f"Adaptada a sombra, nativa, {especie['requisitos_agua']} riego"
        else:
            esp_copy['razon'] = f"Versátil para exposición mixta, nativa península"
        
        result.append(esp_copy)
    
    return result


def calculate_plant_quantities(area_util_m2: float, especies: list) -> list:
    """
    Calculate number of plants needed for each species.
    
    Args:
        area_util_m2: Usable area in m²
        especies: List of species dictionaries
        
    Returns:
        List of species with calculated quantities and costs
    """
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
    """
    Calculate percentage of native species.
    
    Args:
        especies: List of species
        
    Returns:
        Percentage (0-100) of native species
    """
    if not especies:
        return 0.0
    
    nativas = sum(1 for esp in especies if esp.get('nativa_iberia', False))
    return (nativas / len(especies)) * 100
