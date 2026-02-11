"""
Madrid 2024 Market Costs

Current market prices for green roof materials and installation in Madrid.
Prices updated for 2024 market conditions.

Sources:
- Leroy Merlin España
- Bricor Madrid
- Green roof installers Madrid area
"""

# =====================================================
# MATERIAL COSTS (€/m²)
# =====================================================

COSTES_MATERIALES = {
    'sustrato_ligero_m2': 45.0,         # Lightweight substrate
    'drenaje_m2': 25.0,                 # Drainage system
    'membrana_impermeable_m2': 15.0,    # Waterproof membrane
    'lamina_antiraices_m2': 8.0,        # Anti-root barrier
    'geotextil_m2': 5.0,                # Geotextile filter
    'grava_drenaje_m2': 12.0,           # Drainage gravel
    'instalacion_m2': 20.0,             # Installation labor
    'mantenimiento_anual_m2': 8.0       # Annual maintenance
}

# =====================================================
# PLANT COSTS (€/unit) - See species_spain.py for details
# =====================================================

COSTES_PLANTAS = {
    'aromatica': 3.50,
    'suculenta': 2.50,
    'helecho': 4.00,
    'tapizante': 3.00
}

# =====================================================
# IRRIGATION SYSTEM
# =====================================================

COSTES_RIEGO = {
    'riego_goteo_automatizado_m2': 15.0,
    'controlador_riego_unidad': 250.0,
    'sensores_humedad_unidad': 80.0
}

# =====================================================
# STRUCTURAL
# =====================================================

COSTES_ESTRUCTURALES = {
    'refuerzo_estructural_m2': 50.0,    # If needed
    'proteccion_antideslizante_m2': 10.0
}


def calculate_budget(area_m2: float, especies_list: list, incluir_riego: bool = True) -> dict:
    """
    Calculate detailed budget for green roof installation.
    
    Args:
        area_m2: Total area in m²
        especies_list: List of species with quantities
        incluir_riego: Include irrigation system
        
    Returns:
        dict with detailed budget breakdown
    """
    # Materials
    sustrato = area_m2 * COSTES_MATERIALES['sustrato_ligero_m2']
    drenaje = area_m2 * COSTES_MATERIALES['drenaje_m2']
    membrana = area_m2 * COSTES_MATERIALES['membrana_impermeable_m2']
    lamina_antiraices = area_m2 * COSTES_MATERIALES['lamina_antiraices_m2']
    geotextil = area_m2 * COSTES_MATERIALES['geotextil_m2']
    
    # Plants
    coste_plantas = sum(esp.get('coste_total_eur', 0) for esp in especies_list)
    
    # Installation
    instalacion = area_m2 * COSTES_MATERIALES['instalacion_m2']
    
    # Irrigation (optional)
    riego = 0
    if incluir_riego:
        riego = (area_m2 * COSTES_RIEGO['riego_goteo_automatizado_m2'] + 
                COSTES_RIEGO['controlador_riego_unidad'] +
                COSTES_RIEGO['sensores_humedad_unidad'] * max(1, int(area_m2 / 100)))
    
    # Total initial cost
    coste_total_inicial = (
        sustrato + drenaje + membrana + lamina_antiraices + 
        geotextil + coste_plantas + instalacion + riego
    )
    
    # Annual maintenance
    mantenimiento_anual = area_m2 * COSTES_MATERIALES['mantenimiento_anual_m2']
    
    # Cost per m²
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


def calculate_total_cost_with_maintenance(coste_inicial: float, mantenimiento_anual: float, anos: int = 25) -> float:
    """
    Calculate total cost including maintenance over lifetime.
    
    Args:
        coste_inicial: Initial installation cost
        mantenimiento_anual: Annual maintenance cost
        anos: Number of years (default: 25, typical green roof lifespan)
        
    Returns:
        Total cost over lifetime
    """
    return coste_inicial + (mantenimiento_anual * anos)


def get_cost_per_type(tipo_cubierta: str, area_m2: float) -> dict:
    """
    Get estimated cost range by roof type.
    
    Args:
        tipo_cubierta: 'extensiva' or 'intensiva'
        area_m2: Area in m²
        
    Returns:
        dict with cost estimates
    """
    if tipo_cubierta == 'intensiva':
        # Intensive: more substrate, larger plants, irrigation required
        coste_min_m2 = 150
        coste_max_m2 = 250
    else:
        # Extensive: lighter, lower maintenance
        coste_min_m2 = 80
        coste_max_m2 = 150
    
    return {
        'tipo': tipo_cubierta,
        'coste_min_eur': area_m2 * coste_min_m2,
        'coste_max_eur': area_m2 * coste_max_m2,
        'coste_min_m2': coste_min_m2,
        'coste_max_m2': coste_max_m2
    }
