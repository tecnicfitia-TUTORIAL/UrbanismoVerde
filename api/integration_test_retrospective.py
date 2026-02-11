#!/usr/bin/env python3
"""
Integration Test Example for Retrospective Analysis API
Demonstrates real-world usage scenarios
"""

import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def format_currency(value):
    """Format currency values"""
    return f"€{value:,.2f}"


def format_number(value, decimals=1):
    """Format numbers with decimals"""
    return f"{value:,.{decimals}f}"


def test_small_residential_roof():
    """
    Scenario 1: Small residential building (100m²)
    Client: Community of neighbors in Madrid
    Goal: Justify investment for general assembly
    """
    print_section("SCENARIO 1: Small Residential Roof (100m²)")
    
    from retrospective_analyze import (
        calculate_baseline,
        calculate_projection,
        calculate_comparison,
        calculate_roi,
        generate_timeline,
        calculate_ecosystem_value
    )
    
    # Define scenario
    baseline_data = {
        'tipo_superficie': 'asfalto',
        'area_m2': 100,
        'temperatura_verano_c': 36,
        'coste_ac_eur_anual': 1500,
        'coste_calefaccion_eur_anual': 1200
    }
    
    projection_data = {
        'tipo_cubierta': 'extensiva',
        'area_verde_m2': 100,
        'anos_horizonte': 25,
        'especies': ['Sedum', 'Festuca', 'Thymus']
    }
    
    # Perform analysis
    baseline = calculate_baseline(baseline_data)
    projection = calculate_projection(projection_data, baseline)
    comparison = calculate_comparison(baseline, projection)
    roi = calculate_roi(projection, comparison)
    timeline = generate_timeline(projection, comparison, 25)
    eco_value = calculate_ecosystem_value(projection, baseline)
    
    # Print report
    print("\n📋 CLIENT PROFILE:")
    print(f"   Type: Community of 12 neighbors")
    print(f"   Location: Madrid (Chamberí)")
    print(f"   Current roof: Deteriorated asphalt")
    
    print("\n💰 INVESTMENT:")
    print(f"   Total cost: {format_currency(projection['coste_inicial_eur'])}")
    print(f"   Subsidy (PECV Madrid 45%): {format_currency(projection['subvenciones_disponibles_eur'])}")
    print(f"   Net investment: {format_currency(projection['coste_neto_inicial_eur'])}")
    print(f"   Cost per neighbor: {format_currency(projection['coste_neto_inicial_eur'] / 12)}")
    
    print("\n🌱 ENVIRONMENTAL BENEFITS:")
    print(f"   Temperature reduction: {format_number(projection['reduccion_temperatura_c'], 1)}°C")
    print(f"   CO₂ captured: {format_number(projection['co2_adicional_kg_anual'], 0)} kg/year")
    print(f"   Water retained: {format_number(comparison['delta_agua_retenida_m3_anual'], 1)} m³/year")
    print(f"   Noise reduction: {format_number(projection['reduccion_ruido_db'], 1)} dB")
    
    print("\n💵 ECONOMIC RETURNS:")
    print(f"   Annual savings: {format_currency(projection['ahorro_total_anual'])}")
    print(f"   Savings per neighbor/year: {format_currency(projection['ahorro_total_anual'] / 12)}")
    print(f"   ROI: {format_number(roi['roi_porcentaje'], 2)}%")
    print(f"   Payback period: {format_number(roi['payback_anos'], 1)} years")
    print(f"   25-year accumulated: {format_currency(timeline[24]['beneficio_acumulado_eur'])}")
    
    print("\n🏆 KEY ARGUMENTS FOR ASSEMBLY:")
    print(f"   ✓ Each neighbor invests: {format_currency(projection['coste_neto_inicial_eur'] / 12)}")
    print(f"   ✓ Each neighbor saves: {format_currency(projection['ahorro_total_anual'] / 12)}/year")
    print(f"   ✓ Building value increase: ~5-8%")
    print(f"   ✓ Improved summer comfort (roof apartments)")
    print(f"   ✓ Environmental certification")
    
    print("\n✅ RECOMMENDATION: Viable investment with moderate payback")


def test_large_office_building():
    """
    Scenario 2: Large office building (500m²)
    Client: Real estate developer
    Goal: LEED/BREEAM certification
    """
    print_section("SCENARIO 2: Large Office Building (500m²)")
    
    from retrospective_analyze import (
        calculate_baseline,
        calculate_projection,
        calculate_comparison,
        calculate_roi,
        generate_timeline,
        calculate_ecosystem_value
    )
    
    baseline_data = {
        'tipo_superficie': 'hormigon',
        'area_m2': 500,
        'temperatura_verano_c': 38
    }
    
    projection_data = {
        'tipo_cubierta': 'intensiva',
        'area_verde_m2': 500,
        'anos_horizonte': 25,
        'especies': ['Lavanda', 'Romero', 'Santolina', 'Salvia', 'Thymus']
    }
    
    baseline = calculate_baseline(baseline_data)
    projection = calculate_projection(projection_data, baseline)
    comparison = calculate_comparison(baseline, projection)
    roi = calculate_roi(projection, comparison)
    timeline = generate_timeline(projection, comparison, 25)
    eco_value = calculate_ecosystem_value(projection, baseline)
    
    print("\n📋 CLIENT PROFILE:")
    print(f"   Type: Corporate office building")
    print(f"   Location: Madrid (business district)")
    print(f"   Goal: LEED Gold certification")
    
    print("\n💰 INVESTMENT:")
    print(f"   Total cost: {format_currency(projection['coste_inicial_eur'])}")
    print(f"   Subsidy (PECV Madrid): {format_currency(projection['subvenciones_disponibles_eur'])}")
    print(f"   Net investment: {format_currency(projection['coste_neto_inicial_eur'])}")
    
    print("\n🌱 ENVIRONMENTAL BENEFITS (Annual):")
    print(f"   Temperature reduction: {format_number(projection['reduccion_temperatura_c'], 1)}°C")
    print(f"   CO₂ captured: {format_number(projection['co2_adicional_kg_anual'], 0)} kg")
    print(f"   Equivalent trees: {format_number(projection['co2_adicional_kg_anual'] / 20, 0)}")
    print(f"   Water retained: {format_number(comparison['delta_agua_retenida_m3_anual'], 0)} m³")
    print(f"   Biodiversity improvement: {format_number(projection['biodiversidad_mejora_pct'], 0)}%")
    
    print("\n💵 ECONOMIC ANALYSIS:")
    print(f"   Annual energy savings: {format_currency(projection['ahorro_total_anual'])}")
    print(f"   25-year savings: {format_currency(timeline[24]['beneficio_acumulado_eur'])}")
    print(f"   NPV (25 years @ 3%): {format_currency(roi['vnp_25_anos_eur'])}")
    print(f"   Ecosystem services value: {format_currency(eco_value['valor_ecosistemico_total_eur'])}")
    
    print("\n🏆 CERTIFICATION BENEFITS:")
    print(f"   ✓ LEED points: Sustainable Sites + Water Efficiency + Innovation")
    print(f"   ✓ Urban Heat Island reduction: {format_number(projection['reduccion_temperatura_c'], 1)}°C")
    print(f"   ✓ Stormwater management: {format_number(projection['retencion_agua_pct'], 0)}% retention")
    print(f"   ✓ Biodiversity: Native species habitat")
    
    print("\n🏢 COMMERCIAL ADVANTAGES:")
    print(f"   ✓ Premium rent positioning (+10-15%)")
    print(f"   ✓ Tenant attraction (wellness workspace)")
    print(f"   ✓ Corporate sustainability reporting")
    print(f"   ✓ Brand image enhancement")
    
    print("\n✅ RECOMMENDATION: Strategic investment for premium positioning")


def test_municipal_building():
    """
    Scenario 3: Municipal building (300m²)
    Client: City council
    Goal: Public sustainability demonstration
    """
    print_section("SCENARIO 3: Municipal Building (300m²)")
    
    from retrospective_analyze import (
        calculate_baseline,
        calculate_projection,
        calculate_comparison,
        calculate_roi,
        generate_timeline,
        calculate_ecosystem_value
    )
    
    baseline_data = {
        'tipo_superficie': 'grava',
        'area_m2': 300,
        'temperatura_verano_c': 35
    }
    
    projection_data = {
        'tipo_cubierta': 'semi-intensiva',
        'area_verde_m2': 300,
        'anos_horizonte': 25,
        'especies': ['Lavanda', 'Romero', 'Tomillo', 'Santolina']
    }
    
    baseline = calculate_baseline(baseline_data)
    projection = calculate_projection(projection_data, baseline)
    comparison = calculate_comparison(baseline, projection)
    roi = calculate_roi(projection, comparison)
    timeline = generate_timeline(projection, comparison, 25)
    eco_value = calculate_ecosystem_value(projection, baseline)
    
    print("\n📋 CLIENT PROFILE:")
    print(f"   Type: Municipal cultural center")
    print(f"   Location: Madrid")
    print(f"   Goal: Public sustainability example")
    
    print("\n💰 BUDGET (Public Investment):")
    print(f"   Total project cost: {format_currency(projection['coste_inicial_eur'])}")
    print(f"   EU/Regional subsidy: {format_currency(projection['subvenciones_disponibles_eur'])}")
    print(f"   Municipal investment: {format_currency(projection['coste_neto_inicial_eur'])}")
    print(f"   Annual maintenance: {format_currency(projection['mantenimiento_anual_eur'])}")
    
    print("\n🌱 ENVIRONMENTAL IMPACT (25 years):")
    print(f"   Total CO₂ captured: {format_number(timeline[24]['co2_acumulado_kg'], 0)} kg")
    print(f"   Equivalent cars off road: {format_number(timeline[24]['co2_acumulado_kg'] / 4000, 1)}")
    print(f"   Total water retained: {format_number(timeline[24]['agua_acumulada_m3'], 0)} m³")
    print(f"   Stormwater cost savings: {format_currency(timeline[24]['agua_acumulada_m3'] * 2)}")
    
    print("\n💵 ECONOMIC JUSTIFICATION:")
    print(f"   Total operational savings: {format_currency(timeline[24]['beneficio_acumulado_eur'])}")
    print(f"   Ecosystem services value: {format_currency(eco_value['valor_ecosistemico_total_eur'])}")
    print(f"   Total value created: {format_currency(timeline[24]['beneficio_acumulado_eur'] + eco_value['valor_ecosistemico_total_eur'])}")
    print(f"   Return ratio: {format_number((timeline[24]['beneficio_acumulado_eur'] + eco_value['valor_ecosistemico_total_eur']) / projection['coste_neto_inicial_eur'], 2)}x")
    
    print("\n🏛️ PUBLIC VALUE:")
    print(f"   ✓ Educational resource (school visits)")
    print(f"   ✓ Climate adaptation demonstration")
    print(f"   ✓ Urban biodiversity enhancement")
    print(f"   ✓ Community wellness space")
    print(f"   ✓ Policy replication model")
    
    print("\n📊 DATA FOR CITY COUNCIL:")
    print(f"   • Investment per m²: {format_currency(projection['coste_neto_inicial_eur'] / 300)}")
    print(f"   • Annual city savings: {format_currency(projection['ahorro_total_anual'])}")
    print(f"   • Citizen benefit: Improved urban microclimate")
    print(f"   • Policy goal: Contributes to Climate Action Plan")
    
    print("\n✅ RECOMMENDATION: High public value beyond direct ROI")


def main():
    """Run all integration test scenarios"""
    print("\n" + "🧪 " + "=" * 68)
    print("   RETROSPECTIVE ANALYSIS - INTEGRATION TEST SCENARIOS")
    print("=" * 70)
    print("\nDemonstrating real-world usage with 3 different client profiles:")
    print("1. Small residential building (community of neighbors)")
    print("2. Large office building (real estate developer)")
    print("3. Municipal building (city council)")
    
    try:
        test_small_residential_roof()
        test_large_office_building()
        test_municipal_building()
        
        print("\n" + "=" * 70)
        print("🎉 ALL INTEGRATION SCENARIOS COMPLETED SUCCESSFULLY")
        print("=" * 70)
        print("\n✅ The Retrospective Analysis API provides actionable data")
        print("   for diverse stakeholders and use cases.\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
