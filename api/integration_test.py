#!/usr/bin/env python3
"""
Integration test for the Analysis API endpoint
Tests the complete 3-layer analysis engine
"""
import json
import sys

# Test data
test_cases = [
    {
        "name": "Centro Madrid (80% subsidy)",
        "polygon": {
            "type": "Polygon",
            "coordinates": [[
                [-3.7038, 40.4168],
                [-3.7020, 40.4168],
                [-3.7020, 40.4150],
                [-3.7038, 40.4150],
                [-3.7038, 40.4168]
            ]]
        },
        "expected_subsidy_min": 70,
        "expected_area_min": 30000
    },
    {
        "name": "Peripheral Madrid (50% subsidy)",
        "polygon": {
            "type": "Polygon",
            "coordinates": [[
                [-3.8000, 40.4500],
                [-3.7980, 40.4500],
                [-3.7980, 40.4485],
                [-3.8000, 40.4485],
                [-3.8000, 40.4500]
            ]]
        },
        "expected_subsidy_min": 40,
        "expected_area_min": 2000
    }
]

def test_analysis_engine():
    """Test the analysis engine with different scenarios."""
    
    # Import the engine
    from analyze import AnalysisEngine
    
    print("=" * 70)
    print("INTEGRATION TEST: 3-Layer Analysis Engine")
    print("=" * 70)
    
    all_passed = True
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n[TEST {i}] {test_case['name']}")
        print("-" * 70)
        
        try:
            # Run analysis
            engine = AnalysisEngine(test_case['polygon'])
            result = engine.analyze()
            
            # Validate structure
            assert result['success'] == True, "Analysis should succeed"
            assert 'green_score' in result, "Should have green_score"
            assert 'area_m2' in result, "Should have area_m2"
            assert 'normativa' in result, "Should have normativa"
            assert 'subvencion' in result, "Should have subvencion"
            assert 'especies_recomendadas' in result, "Should have especies"
            assert 'presupuesto' in result, "Should have presupuesto"
            assert 'roi_ambiental' in result, "Should have ROI"
            
            # Validate values
            assert result['area_m2'] >= test_case['expected_area_min'], \
                f"Area should be >= {test_case['expected_area_min']}"
            assert result['subvencion']['porcentaje'] >= test_case['expected_subsidy_min'], \
                f"Subsidy should be >= {test_case['expected_subsidy_min']}%"
            
            # Print results
            print(f"✅ Area: {result['area_m2']:.2f} m²")
            print(f"✅ Factor Verde: {result['normativa']['factor_verde']}")
            print(f"✅ Green Score: {result['green_score']}")
            print(f"✅ Subsidy: {result['subvencion']['porcentaje']}%")
            print(f"✅ Species: {len(result['especies_recomendadas'])}")
            print(f"✅ ROI: {result['roi_ambiental']['amortizacion_anos']:.1f} years")
            print(f"✅ Processing: {result['processing_time']}s")
            
            # Validate calculated values (not hardcoded)
            assert result['normativa']['factor_verde'] != 0.65, "Factor Verde should be calculated"
            assert result['green_score'] != 72.5, "Green Score should be calculated"
            
            print(f"\n✅ TEST {i} PASSED")
            
        except Exception as e:
            print(f"\n❌ TEST {i} FAILED: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(test_analysis_engine())
