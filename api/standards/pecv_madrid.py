"""
PECV Madrid 2025 - Factor Verde Calculation

Plan Estratégico de Calidad del Verde y la Biodiversidad (PECV) Madrid 2025
Official implementation of Factor Verde calculation for green roofs.

Reference: Ordenanza Municipal de Calidad del Aire y Sostenibilidad
"""

# =====================================================
# COEFFICIENTS (Official PECV Madrid 2025)
# =====================================================

# Ct: Coefficient by roof type
COEF_TIPO_CUBIERTA = {
    'extensiva': 0.75,      # Extensive green roof (low maintenance)
    'intensiva': 1.0,       # Intensive green roof (accessible)
    'semi_intensiva': 0.85  # Semi-intensive
}

# Co: Coefficient by orientation (solar exposure)
COEF_ORIENTACION = {
    'sur': 1.0,           # South (best)
    'sureste': 0.95,      # Southeast
    'suroeste': 0.95,     # Southwest
    'este': 0.85,         # East
    'oeste': 0.85,        # West
    'norte': 0.7,         # North (worst)
    'noreste': 0.75,
    'noroeste': 0.75
}

# Ci: Coefficient by green infrastructure type
COEF_INFRAESTRUCTURA = {
    'cubierta_vegetal_extensiva': 0.6,
    'cubierta_vegetal_intensiva': 1.0,
    'jardin_vertical': 0.4,
    'arbolado_aislado': 0.8,
    'vegetacion_tapizante': 0.5,
    'arbustos': 0.7,
    'pradera': 0.5
}

# =====================================================
# REQUIREMENTS (PECV Madrid 2025 & MITECO 2024)
# =====================================================

REQUISITOS_MINIMOS = {
    'superficie_min_m2': 50,        # Minimum area for green roof
    'inclinacion_max_grados': 30,   # Maximum slope
    'factor_verde_min_extensiva': 0.6,   # Minimum FV for extensive
    'factor_verde_min_intensiva': 0.8,   # Minimum FV for intensive
    'especies_nativas_pct_min': 60,      # Minimum % of native species
    'profundidad_sustrato_min_cm': 8,    # Minimum substrate depth
    'peso_maximo_kg_m2_extensiva': 150,  # Max structural load
    'peso_maximo_kg_m2_intensiva': 400
}


def calculate_factor_verde(
    area_total_m2: float,
    area_verde_m2: float,
    tipo_cubierta: str = 'extensiva',
    orientacion: str = 'sur',
    tipo_infraestructura: str = 'cubierta_vegetal_extensiva'
) -> dict:
    """
    Calculate Factor Verde according to PECV Madrid 2025 official formula:
    
    FV = (Ct × Co × Σ(Ci × Si)) / Sp
    
    Where:
    - Ct: Roof type coefficient
    - Co: Orientation coefficient  
    - Ci: Green infrastructure coefficient
    - Si: Surface area of infrastructure elements
    - Sp: Total plot surface area
    
    Args:
        area_total_m2: Total roof area (Sp)
        area_verde_m2: Green area (Si)
        tipo_cubierta: Roof type ('extensiva', 'intensiva', 'semi_intensiva')
        orientacion: Orientation ('sur', 'norte', 'este', 'oeste', etc.)
        tipo_infraestructura: Infrastructure type
        
    Returns:
        dict with:
            - factor_verde: Calculated FV value
            - cumple_extensiva: Meets extensive roof requirements
            - cumple_intensiva: Meets intensive roof requirements
            - coeficientes: Applied coefficients
    """
    # Get coefficients
    ct = COEF_TIPO_CUBIERTA.get(tipo_cubierta, 0.75)
    co = COEF_ORIENTACION.get(orientacion, 0.85)
    ci = COEF_INFRAESTRUCTURA.get(tipo_infraestructura, 0.6)
    
    # Calculate Factor Verde
    # FV = (Ct × Co × Σ(Ci × Si)) / Sp
    suma_ci_si = ci * area_verde_m2
    factor_verde = (ct * co * suma_ci_si) / area_total_m2 if area_total_m2 > 0 else 0.0
    
    # Check compliance
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
    """
    Validate compliance with PECV Madrid 2025 and MITECO 2024 requirements.
    
    Args:
        area_m2: Total area
        inclinacion_grados: Roof slope in degrees
        factor_verde: Calculated Factor Verde
        especies_nativas_pct: Percentage of native species
        tipo_cubierta: Roof type
        
    Returns:
        dict with compliance status for each requirement
    """
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
    """
    Estimate orientation based on annual solar hours.
    
    Args:
        horas_sol_anuales: Annual solar hours
        
    Returns:
        Estimated orientation string
    """
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
