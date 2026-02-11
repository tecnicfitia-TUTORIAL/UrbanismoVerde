#!/usr/bin/env python3
"""
Test script for the Analysis Engine
"""
import sys
import json

# Test polygon - Centro Madrid
polygon = {
    'type': 'Polygon',
    'coordinates': [[
        [-3.7038, 40.4168],
        [-3.7020, 40.4168],
        [-3.7020, 40.4150],
        [-3.7038, 40.4150],
        [-3.7038, 40.4168]
    ]]
}

# Import modules
from standards.pecv_madrid import calculate_factor_verde, validate_requirements, get_orientation_from_solar_hours
from standards.species_spain import get_species_by_exposure, calculate_plant_quantities, get_native_species_percentage
from standards.costs_2024 import calculate_budget
from standards.idae_formulas import calculate_energy_savings
from standards.miteco_2024 import calculate_ecosystem_benefits, calculate_biodiversity_impact

from utils.geospatial import calculate_area_haversine, calculate_perimeter, get_center_coordinates
from utils.computer_vision import segment_surfaces, analyze_solar_exposure, calculate_ndvi
from utils.subsidy_zones import check_subsidy_eligibility, calculate_subsidy_amount

def test_analysis():
    """Run a complete analysis test."""
    
    print("Testing 3-Layer Analysis Engine...")
    print("=" * 60)
    
    coordinates = polygon['coordinates'][0]
    center_lat, center_lon = get_center_coordinates(coordinates)
    
    # Layer 1: Geospatial
    print("\n[LAYER 1: GEOSPATIAL]")
    area_m2 = calculate_area_haversine(coordinates)
    perimetro_m = calculate_perimeter(coordinates)
    print(f"✅ Area: {area_m2:.2f} m²")
    print(f"✅ Perimeter: {perimetro_m:.2f} m")
    print(f"✅ Center: {center_lat:.4f}, {center_lon:.4f}")
    
    # Layer 2: Computer Vision
    print("\n[LAYER 2: COMPUTER VISION]")
    segmentation = segment_surfaces(area_m2)
    solar_data = analyze_solar_exposure(center_lat, center_lon, area_m2)
    ndvi = calculate_ndvi(area_m2, segmentation['vegetacion_previa_m2'])
    print(f"✅ Usable area: {segmentation['area_util_m2']:.2f} m²")
    print(f"✅ Solar hours: {solar_data['horas_sol_anuales']}/year")
    print(f"✅ Solar classification: {solar_data['clasificacion']}")
    print(f"✅ NDVI: {ndvi}")
    
    # Layer 3: Value Generation
    print("\n[LAYER 3: VALUE GENERATION]")
    
    # Factor Verde
    orientacion = get_orientation_from_solar_hours(solar_data['horas_sol_anuales'])
    fv_result = calculate_factor_verde(
        area_total_m2=area_m2,
        area_verde_m2=segmentation['area_util_m2'],
        orientacion=orientacion
    )
    print(f"✅ Factor Verde: {fv_result['factor_verde']}")
    
    # Species
    especies = get_species_by_exposure(solar_data['clasificacion'], 3)
    especies_calc = calculate_plant_quantities(segmentation['area_util_m2'], especies)
    print(f"✅ Recommended species: {len(especies_calc)}")
    for esp in especies_calc:
        print(f"   - {esp['nombre_comun']}: {esp['cantidad_estimada']} plants")
    
    # Budget
    presupuesto = calculate_budget(segmentation['area_util_m2'], especies_calc)
    print(f"✅ Total cost: €{presupuesto['coste_total_inicial_eur']:,.2f}")
    
    # Subsidy
    subsidy_info = check_subsidy_eligibility(center_lat, center_lon)
    subsidy_calc = calculate_subsidy_amount(
        presupuesto['coste_total_inicial_eur'],
        subsidy_info['porcentaje']
    )
    print(f"✅ Subsidy: {subsidy_info['porcentaje']}% (€{subsidy_calc['monto_subvencion_eur']:,.2f})")
    
    # Ecosystem benefits
    beneficios = calculate_ecosystem_benefits(segmentation['area_util_m2'])
    print(f"✅ CO₂ captured: {beneficios['co2_capturado_kg_anual']:.0f} kg/year")
    print(f"✅ Water retention: {beneficios['agua_retenida_litros_anual']:,.0f} L/year")
    
    # Energy savings
    ahorro = calculate_energy_savings(segmentation['area_util_m2'])
    print(f"✅ Energy savings: €{ahorro['ahorro_energia_eur_anual']:,.0f}/year")
    
    # ROI
    ahorro_total = ahorro['ahorro_energia_eur_anual'] + beneficios['valor_retencion_agua_eur_anual']
    amortizacion = subsidy_calc['inversion_neta_eur'] / ahorro_total if ahorro_total > 0 else 999
    print(f"✅ ROI: {amortizacion:.1f} years")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    return True

if __name__ == '__main__':
    try:
        test_analysis()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
