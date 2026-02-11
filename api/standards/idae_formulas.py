"""
IDAE Energy Savings Formulas

Instituto para la Diversificación y Ahorro de la Energía (IDAE)
Official formulas for calculating energy savings from green roofs.

Based on:
- IDAE Technical Guides 2024
- CTE (Código Técnico de la Edificación)
- Spanish energy efficiency standards
"""

# =====================================================
# ENERGY CONSUMPTION CONSTANTS (Spain)
# =====================================================

# Average consumption for residential buildings in Spain (kWh/m²/year)
CONSUMO_BASE = {
    'calefaccion_kwh_m2_ano': 50,    # Heating
    'refrigeracion_kwh_m2_ano': 30,   # Cooling
    'total_kwh_m2_ano': 80
}

# Energy prices in Spain (€/kWh)
PRECIO_ENERGIA = {
    'electricidad_eur_kwh': 0.25,
    'gas_natural_eur_kwh': 0.08
}

# =====================================================
# GREEN ROOF ENERGY SAVINGS
# =====================================================

# Percentage reduction by green roof type
AHORRO_PORCENTAJE = {
    'extensiva': {
        'refrigeracion': 0.35,  # 35% reduction in cooling
        'calefaccion': 0.15     # 15% reduction in heating
    },
    'intensiva': {
        'refrigeracion': 0.50,  # 50% reduction in cooling
        'calefaccion': 0.30     # 30% reduction in heating
    }
}


def calculate_energy_savings(area_m2: float, tipo_cubierta: str = 'extensiva') -> dict:
    """
    Calculate energy savings from green roof installation.
    
    Based on IDAE methodology:
    - Green roofs provide thermal insulation
    - Reduce summer cooling needs
    - Reduce winter heating needs
    - Effect proportional to roof area vs building area
    
    Args:
        area_m2: Green roof area
        tipo_cubierta: 'extensiva' or 'intensiva'
        
    Returns:
        dict with energy savings details
    """
    # Get reduction percentages
    reducciones = AHORRO_PORCENTAJE.get(tipo_cubierta, AHORRO_PORCENTAJE['extensiva'])
    
    # Calculate annual savings per m² of roof
    ahorro_refrigeracion_kwh = (
        CONSUMO_BASE['refrigeracion_kwh_m2_ano'] * reducciones['refrigeracion']
    )
    ahorro_calefaccion_kwh = (
        CONSUMO_BASE['calefaccion_kwh_m2_ano'] * reducciones['calefaccion']
    )
    ahorro_total_kwh_m2 = ahorro_refrigeracion_kwh + ahorro_calefaccion_kwh
    
    # Total savings for the roof area
    ahorro_anual_kwh = area_m2 * ahorro_total_kwh_m2
    
    # Convert to euros
    ahorro_anual_eur = ahorro_anual_kwh * PRECIO_ENERGIA['electricidad_eur_kwh']
    
    return {
        'ahorro_energia_kwh_anual': round(ahorro_anual_kwh, 2),
        'ahorro_energia_eur_anual': round(ahorro_anual_eur, 2),
        'desglose': {
            'refrigeracion_kwh': round(area_m2 * ahorro_refrigeracion_kwh, 2),
            'calefaccion_kwh': round(area_m2 * ahorro_calefaccion_kwh, 2),
            'refrigeracion_eur': round(area_m2 * ahorro_refrigeracion_kwh * PRECIO_ENERGIA['electricidad_eur_kwh'], 2),
            'calefaccion_eur': round(area_m2 * ahorro_calefaccion_kwh * PRECIO_ENERGIA['electricidad_eur_kwh'], 2)
        },
        'reduccion_porcentaje': {
            'refrigeracion': reducciones['refrigeracion'] * 100,
            'calefaccion': reducciones['calefaccion'] * 100
        }
    }


def calculate_thermal_improvement(area_m2: float, tipo_cubierta: str = 'extensiva') -> dict:
    """
    Calculate thermal improvement from green roof.
    
    Args:
        area_m2: Roof area
        tipo_cubierta: 'extensiva' or 'intensiva'
        
    Returns:
        dict with thermal performance metrics
    """
    # Thermal resistance improvement (m²K/W)
    if tipo_cubierta == 'intensiva':
        r_value_improvement = 2.5  # Intensive: better insulation
    else:
        r_value_improvement = 1.5  # Extensive: good insulation
    
    # Temperature reduction (Urban Heat Island effect)
    temp_reduction_c = 1.5 if tipo_cubierta == 'intensiva' else 1.2
    
    return {
        'r_value_improvement_m2k_w': r_value_improvement,
        'reduccion_temperatura_c': temp_reduction_c,
        'mejora_aislamiento_pct': round((r_value_improvement / 5.0) * 100, 1)  # Assuming base R=5
    }


def calculate_co2_savings(ahorro_kwh_anual: float) -> float:
    """
    Calculate CO₂ emission reduction from energy savings.
    
    Args:
        ahorro_kwh_anual: Annual energy savings in kWh
        
    Returns:
        CO₂ savings in kg/year
    """
    # Spain electricity mix: ~0.25 kg CO₂/kWh (2024 data)
    kg_co2_por_kwh = 0.25
    return ahorro_kwh_anual * kg_co2_por_kwh
