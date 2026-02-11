"""
MITECO 2024 - Ecosystem Benefits

Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO)
Official methodology for quantifying ecosystem services from green infrastructure.

Based on:
- MITECO Green Infrastructure Strategy 2024
- EU Nature Restoration Law
- Spanish Climate Change and Energy Transition Law
"""

# =====================================================
# ECOSYSTEM SERVICE COEFFICIENTS
# =====================================================

# CO₂ capture (kg/m²/year)
CO2_CAPTURA_KG_M2_ANO = 5.0  # Average for extensive green roof

# Water retention
AGUA_RETENCION = {
    'precipitacion_anual_madrid_mm': 400,  # Madrid average
    'porcentaje_retencion': 0.60,          # 60% retention
    'litros_por_mm_m2': 1.0                # 1 mm = 1 liter/m²
}

# Temperature reduction (Urban Heat Island effect)
REDUCCION_TEMPERATURA_C = 1.5  # Average reduction

# Air quality improvement
PARTICULAS_FILTRADAS_KG_M2_ANO = 0.15  # PM10 and PM2.5

# Biodiversity enhancement
BIODIVERSIDAD = {
    'especies_polinizadores_incremento_pct': 30,
    'habitat_aves_urbanas': True,
    'conectividad_ecologica': True
}


def calculate_ecosystem_benefits(area_m2: float, tipo_cubierta: str = 'extensiva') -> dict:
    """
    Calculate quantified ecosystem benefits according to MITECO 2024.
    
    Args:
        area_m2: Green roof area in m²
        tipo_cubierta: 'extensiva' or 'intensiva'
        
    Returns:
        dict with quantified ecosystem services
    """
    # Adjust coefficients by roof type
    if tipo_cubierta == 'intensiva':
        co2_factor = 1.3
        water_factor = 1.2
        temp_factor = 1.2
    else:
        co2_factor = 1.0
        water_factor = 1.0
        temp_factor = 1.0
    
    # CO₂ capture
    co2_capturado_kg_anual = area_m2 * CO2_CAPTURA_KG_M2_ANO * co2_factor
    
    # Water retention
    agua_retenida_mm = (
        AGUA_RETENCION['precipitacion_anual_madrid_mm'] * 
        AGUA_RETENCION['porcentaje_retencion'] * 
        water_factor
    )
    agua_retenida_litros_anual = area_m2 * agua_retenida_mm * AGUA_RETENCION['litros_por_mm_m2']
    
    # Temperature reduction
    reduccion_temperatura_c = REDUCCION_TEMPERATURA_C * temp_factor
    
    # Air quality
    particulas_filtradas_kg_anual = area_m2 * PARTICULAS_FILTRADAS_KG_M2_ANO
    
    return {
        'co2_capturado_kg_anual': round(co2_capturado_kg_anual, 1),
        'co2_equivalente_arboles': round(co2_capturado_kg_anual / 20, 1),  # 1 tree = ~20kg CO₂/year
        'agua_retenida_litros_anual': round(agua_retenida_litros_anual, 0),
        'agua_retenida_m3_anual': round(agua_retenida_litros_anual / 1000, 2),
        'reduccion_temperatura_c': round(reduccion_temperatura_c, 2),
        'particulas_filtradas_kg_anual': round(particulas_filtradas_kg_anual, 2),
        'valor_retencion_agua_eur_anual': round(agua_retenida_litros_anual * 0.002, 2),  # Water cost: 0.002 €/L
        'porcentaje_retencion_agua': int(AGUA_RETENCION['porcentaje_retencion'] * 100)
    }


def calculate_biodiversity_impact(area_m2: float, especies_nativas_pct: float) -> dict:
    """
    Calculate biodiversity impact metrics.
    
    Args:
        area_m2: Green roof area
        especies_nativas_pct: Percentage of native species (0-100)
        
    Returns:
        dict with biodiversity metrics
    """
    # Pollinator potential
    if especies_nativas_pct >= 60:
        potencial_polinizacion = 'ALTO'
        incremento_polinizadores_pct = 30
    elif especies_nativas_pct >= 40:
        potencial_polinizacion = 'MEDIO'
        incremento_polinizadores_pct = 20
    else:
        potencial_polinizacion = 'BAJO'
        incremento_polinizadores_pct = 10
    
    # Urban bird habitat (area threshold)
    habitat_fauna_urbana = area_m2 >= 100
    
    # Ecological connectivity
    conectividad_ecologica = 'Mejora el corredor verde urbano' if area_m2 >= 50 else 'Contribución limitada'
    
    # Number of species recommended
    especies_recomendadas_num = min(int(area_m2 / 50) + 3, 10)
    
    return {
        'potencial_polinizacion': potencial_polinizacion,
        'incremento_polinizadores_pct': incremento_polinizadores_pct,
        'habitat_fauna_urbana': habitat_fauna_urbana,
        'conectividad_ecologica': conectividad_ecologica,
        'especies_nativas_recomendadas_num': especies_recomendadas_num,
        'servicios_ecosistemicos': [
            'Hábitat para insectos polinizadores',
            'Refugio para aves urbanas',
            'Corredor ecológico',
            'Mejora de microclima local'
        ] if area_m2 >= 100 else [
            'Hábitat para insectos polinizadores',
            'Mejora de microclima local'
        ]
    }


def calculate_social_benefits(area_m2: float) -> dict:
    """
    Calculate social and health benefits (qualitative).
    
    Args:
        area_m2: Green roof area
        
    Returns:
        dict with social benefit indicators
    """
    return {
        'mejora_salud_mental': area_m2 >= 50,  # Visual contact with nature
        'reduccion_ruido_db': round(5 + (area_m2 / 100), 1),  # Noise reduction
        'mejora_calidad_aire_radio_m': round(area_m2 ** 0.5 * 3, 1),  # Air quality improvement radius
        'incremento_valor_inmueble_pct': round(5 + (min(area_m2, 500) / 100), 1)  # Property value increase
    }


def calculate_economic_value_ecosystem_services(benefits: dict, area_m2: float) -> dict:
    """
    Calculate economic value of ecosystem services.
    
    Args:
        benefits: Output from calculate_ecosystem_benefits
        area_m2: Area in m²
        
    Returns:
        dict with monetized ecosystem services
    """
    # CO₂ capture value (EU ETS carbon price: ~80 €/ton CO₂)
    valor_co2_eur = (benefits['co2_capturado_kg_anual'] / 1000) * 80
    
    # Water management value
    valor_agua_eur = benefits['valor_retencion_agua_eur_anual']
    
    # Urban heat island mitigation (energy savings already calculated separately)
    
    # Air quality improvement (health cost savings: ~50 €/kg PM filtered)
    valor_aire_eur = benefits.get('particulas_filtradas_kg_anual', 0) * 50
    
    # Total annual value
    valor_total_anual_eur = valor_co2_eur + valor_agua_eur + valor_aire_eur
    
    return {
        'valor_co2_eur_anual': round(valor_co2_eur, 2),
        'valor_agua_eur_anual': round(valor_agua_eur, 2),
        'valor_aire_eur_anual': round(valor_aire_eur, 2),
        'valor_total_anual_eur': round(valor_total_anual_eur, 2),
        'valor_25_anos_eur': round(valor_total_anual_eur * 25, 2)
    }
