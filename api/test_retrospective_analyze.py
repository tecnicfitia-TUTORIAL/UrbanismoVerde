#!/usr/bin/env python3
"""
Test script for Retrospective Analysis API
Validates calculations and response structure
"""

import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from retrospective_analyze import (
    calculate_baseline,
    calculate_projection,
    calculate_comparison,
    calculate_roi,
    generate_timeline,
    calculate_ecosystem_value
)


def test_baseline_calculation():
    """Test baseline (current state) calculation"""
    print("\n" + "="*60)
    print("TEST 1: Baseline Calculation")
    print("="*60)
    
    baseline_data = {
        'tipo_superficie': 'asfalto',
        'area_m2': 500,
        'temperatura_verano_c': 34.0,
        'coste_ac_eur_anual': 8000,
        'coste_calefaccion_eur_anual': 4000
    }
    
    baseline = calculate_baseline(baseline_data)
    
    print(f"✓ Area: {baseline['area_m2']} m²")
    print(f"✓ Surface type: {baseline['tipo_superficie']}")
    print(f"✓ Temperature: {baseline['temperatura_verano_c']}°C")
    print(f"✓ Heat island intensity: {baseline['isla_calor_intensidad']}/10")
    print(f"✓ CO₂ capture: {baseline['co2_captura_kg_anual']} kg/year (baseline: 0)")
    print(f"✓ Annual costs: €{baseline['coste_total_eur_anual']:,.2f}")
    
    assert baseline['area_m2'] == 500
    assert baseline['tipo_superficie'] == 'asfalto'
    assert baseline['co2_captura_kg_anual'] == 0
    assert baseline['runoff_agua_pct'] == 100.0
    
    print("✅ Baseline calculation PASSED")
    return baseline


def test_projection_calculation(baseline):
    """Test projection (future state) calculation"""
    print("\n" + "="*60)
    print("TEST 2: Projection Calculation")
    print("="*60)
    
    projection_data = {
        'tipo_cubierta': 'extensiva',
        'area_verde_m2': 500,
        'anos_horizonte': 25,
        'especies': ['Lavanda', 'Romero', 'Tomillo']
    }
    
    projection = calculate_projection(projection_data, baseline)
    
    print(f"✓ Roof type: {projection['tipo_cubierta']}")
    print(f"✓ Green area: {projection['area_verde_m2']} m²")
    print(f"✓ Temperature reduction: {projection['reduccion_temperatura_c']}°C")
    print(f"✓ Water retention: {projection['retencion_agua_pct']}%")
    print(f"✓ CO₂ capture: {projection['co2_adicional_kg_anual']} kg/year")
    print(f"✓ Annual savings: €{projection['ahorro_total_anual']:,.2f}")
    print(f"✓ Initial cost: €{projection['coste_inicial_eur']:,.2f}")
    print(f"✓ Subsidies available: €{projection['subvenciones_disponibles_eur']:,.2f}")
    print(f"✓ Net cost: €{projection['coste_neto_inicial_eur']:,.2f}")
    
    assert projection['area_verde_m2'] == 500
    assert projection['tipo_cubierta'] == 'extensiva'
    assert projection['reduccion_temperatura_c'] > 0
    assert projection['co2_adicional_kg_anual'] > 0
    assert projection['ahorro_total_anual'] > 0
    
    print("✅ Projection calculation PASSED")
    return projection


def test_comparison_calculation(baseline, projection):
    """Test comparison (deltas) calculation"""
    print("\n" + "="*60)
    print("TEST 3: Comparison (Deltas) Calculation")
    print("="*60)
    
    comparison = calculate_comparison(baseline, projection)
    
    print(f"✓ Δ Temperature: {comparison['delta_temperatura_c']}°C (negative = cooling)")
    print(f"✓ Δ CO₂: {comparison['delta_co2_kg_anual']} kg/year (positive = more capture)")
    print(f"✓ Δ Water retained: {comparison['delta_agua_retenida_m3_anual']} m³/year")
    print(f"✓ Δ Costs: €{comparison['delta_costes_eur_anual']:,.2f}/year (negative = savings)")
    print(f"✓ Δ Biodiversity: {comparison['delta_biodiversidad_pct']}%")
    
    assert comparison['delta_temperatura_c'] < 0  # Should be negative (cooling)
    assert comparison['delta_co2_kg_anual'] > 0   # Should be positive (more capture)
    assert comparison['delta_agua_retenida_m3_anual'] > 0  # Should be positive
    
    print("✅ Comparison calculation PASSED")
    return comparison


def test_roi_calculation(projection, comparison):
    """Test ROI calculation"""
    print("\n" + "="*60)
    print("TEST 4: ROI Calculation")
    print("="*60)
    
    roi = calculate_roi(projection, comparison)
    
    print(f"✓ ROI: {roi['roi_porcentaje']}% per year")
    print(f"✓ Payback: {roi['payback_anos']} years")
    print(f"✓ NPV (25 years): €{roi['vnp_25_anos_eur']:,.2f}")
    
    assert roi['roi_porcentaje'] > 0
    assert roi['payback_anos'] > 0
    assert roi['payback_anos'] < 100  # Should be reasonable
    
    print("✅ ROI calculation PASSED")
    return roi


def test_timeline_generation(projection, comparison):
    """Test timeline generation"""
    print("\n" + "="*60)
    print("TEST 5: Timeline Generation (25 years)")
    print("="*60)
    
    timeline = generate_timeline(projection, comparison, 25)
    
    print(f"✓ Timeline points: {len(timeline)}")
    print(f"✓ Year 1: €{timeline[0]['beneficio_acumulado_eur']:,.2f}")
    print(f"✓ Year 10: €{timeline[9]['beneficio_acumulado_eur']:,.2f}")
    print(f"✓ Year 25: €{timeline[24]['beneficio_acumulado_eur']:,.2f}")
    print(f"✓ CO₂ accumulated (25 years): {timeline[24]['co2_acumulado_kg']:,.0f} kg")
    print(f"✓ Water accumulated (25 years): {timeline[24]['agua_acumulada_m3']:,.0f} m³")
    
    assert len(timeline) == 25
    assert timeline[0]['ano'] == 1
    assert timeline[24]['ano'] == 25
    assert timeline[24]['beneficio_acumulado_eur'] > timeline[0]['beneficio_acumulado_eur']
    
    print("✅ Timeline generation PASSED")
    return timeline


def test_ecosystem_value(projection, baseline):
    """Test ecosystem value calculation"""
    print("\n" + "="*60)
    print("TEST 6: Ecosystem Value Calculation")
    print("="*60)
    
    eco_value = calculate_ecosystem_value(projection, baseline)
    
    print(f"✓ Total ecosystem value (25 years): €{eco_value['valor_ecosistemico_total_eur']:,.2f}")
    print(f"✓ Quality of life index: {eco_value['mejora_calidad_vida_indice']}/10")
    print(f"✓ CO₂ value: €{eco_value['desglose_ecosistemico']['valor_co2_eur_anual']:,.2f}/year")
    print(f"✓ Water value: €{eco_value['desglose_ecosistemico']['valor_agua_eur_anual']:,.2f}/year")
    print(f"✓ Air quality value: €{eco_value['desglose_ecosistemico']['valor_aire_eur_anual']:,.2f}/year")
    
    assert eco_value['valor_ecosistemico_total_eur'] > 0
    assert 0 <= eco_value['mejora_calidad_vida_indice'] <= 10
    
    print("✅ Ecosystem value calculation PASSED")
    return eco_value


def test_complete_analysis():
    """Test complete analysis pipeline"""
    print("\n" + "="*60)
    print("TEST 7: Complete Analysis Pipeline")
    print("="*60)
    
    request_data = {
        'nombre': 'Test Analysis - 500m² Extensive Green Roof',
        'baseline': {
            'tipo_superficie': 'asfalto',
            'area_m2': 500,
            'temperatura_verano_c': 34.0
        },
        'projection': {
            'tipo_cubierta': 'extensiva',
            'area_verde_m2': 500,
            'anos_horizonte': 25,
            'especies': ['Lavanda', 'Romero', 'Tomillo']
        }
    }
    
    # Simulate complete analysis
    baseline = calculate_baseline(request_data['baseline'])
    projection = calculate_projection(request_data['projection'], baseline)
    comparison = calculate_comparison(baseline, projection)
    roi = calculate_roi(projection, comparison)
    timeline = generate_timeline(projection, comparison, 25)
    eco_value = calculate_ecosystem_value(projection, baseline)
    
    response = {
        'success': True,
        'nombre': request_data['nombre'],
        'baseline': baseline,
        'projection': projection,
        'comparison': comparison,
        'roi': roi,
        'timeline_summary': {
            'year_1': timeline[0],
            'year_10': timeline[9],
            'year_25': timeline[24]
        },
        'valor_ecosistemico_total_eur': eco_value['valor_ecosistemico_total_eur'],
        'mejora_calidad_vida_indice': eco_value['mejora_calidad_vida_indice']
    }
    
    print(f"\n✓ Complete analysis successful!")
    print(f"\n📊 SUMMARY:")
    print(f"   Investment: €{projection['coste_neto_inicial_eur']:,.2f} (after subsidies)")
    print(f"   Annual savings: €{projection['ahorro_total_anual']:,.2f}")
    print(f"   ROI: {roi['roi_porcentaje']}%")
    print(f"   Payback: {roi['payback_anos']} years")
    print(f"   25-year benefit: €{timeline[24]['beneficio_acumulado_eur']:,.2f}")
    print(f"   NPV (25 years): €{roi['vnp_25_anos_eur']:,.2f}")
    print(f"   Ecosystem value: €{eco_value['valor_ecosistemico_total_eur']:,.2f}")
    
    print("\n✅ Complete analysis pipeline PASSED")
    return response


def main():
    """Run all tests"""
    print("\n" + "🧪 " + "="*58)
    print("   RETROSPECTIVE ANALYSIS API - TEST SUITE")
    print("="*60)
    
    try:
        baseline = test_baseline_calculation()
        projection = test_projection_calculation(baseline)
        comparison = test_comparison_calculation(baseline, projection)
        roi = test_roi_calculation(projection, comparison)
        timeline = test_timeline_generation(projection, comparison)
        eco_value = test_ecosystem_value(projection, baseline)
        complete = test_complete_analysis()
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED!")
        print("="*60)
        print("\nThe Retrospective Analysis API is working correctly.")
        print("All calculations validated successfully.\n")
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
