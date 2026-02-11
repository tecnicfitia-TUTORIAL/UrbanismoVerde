"""
Subsidy Zones - Madrid

Geographic zones for green roof subsidies in Madrid.
Data based on municipal and regional incentive programs.

Sources:
- Ayuntamiento de Madrid - PECV 2025
- Comunidad de Madrid - Environmental incentives
- EU Next Generation funds
"""

# =====================================================
# MADRID SUBSIDY ZONES
# =====================================================

# Center of Madrid for distance calculations
MADRID_CENTER = {
    'lat': 40.4168,
    'lon': -3.7038,
    'name': 'Puerta del Sol'
}

# Zone definitions (approximate boundaries)
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
    """
    Check if a point is within bounds.
    
    Args:
        lat, lon: Point coordinates
        bounds: Dict with min/max lat/lon
        
    Returns:
        True if point is within bounds
    """
    return (bounds['min_lat'] <= lat <= bounds['max_lat'] and
            bounds['min_lon'] <= lon <= bounds['max_lon'])


def check_subsidy_eligibility(lat: float, lon: float) -> dict:
    """
    Determine subsidy eligibility based on location.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        dict with subsidy details
    """
    # Check zones in order of priority (highest subsidy first)
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
        # Outside defined zones - minimal or no subsidy
        return {
            'elegible': False,
            'porcentaje': 0,
            'zona': 'Fuera de zonas prioritarias',
            'programa': 'No aplica',
            'requisitos': []
        }


def calculate_subsidy_amount(coste_total: float, porcentaje: int, tope_maximo: float = None) -> dict:
    """
    Calculate subsidy amount.
    
    Args:
        coste_total: Total project cost
        porcentaje: Subsidy percentage
        tope_maximo: Maximum subsidy cap (optional)
        
    Returns:
        dict with subsidy calculation
    """
    monto_subvencion = coste_total * (porcentaje / 100)
    
    # Apply cap if specified
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


def get_all_available_programs(lat: float, lon: float) -> list:
    """
    Get all available subsidy programs for a location.
    
    Args:
        lat, lon: Location coordinates
        
    Returns:
        List of available programs
    """
    programs = []
    
    for zona_id, zona_data in ZONAS_SUBVENCION.items():
        if point_in_bounds(lat, lon, zona_data['bounds']):
            programs.append({
                'zona': zona_data['nombre'],
                'porcentaje': zona_data['porcentaje'],
                'programa': zona_data['programa']
            })
    
    # Sort by subsidy percentage (highest first)
    programs.sort(key=lambda x: x['porcentaje'], reverse=True)
    
    return programs
