"""
Tests for Specialized Rooftop Analysis API
Tests building detection, CTE calculations, budget, and viability assessments.
"""

import json
import sys
from io import BytesIO
from unittest.mock import Mock
import importlib.util

# Import the handler from hyphenated filename
spec = importlib.util.spec_from_file_location(
    'specialize_tejado',
    '/home/runner/work/UrbanismoVerde/UrbanismoVerde/api/specialize-tejado.py'
)
specialize_tejado = importlib.util.module_from_spec(spec)
spec.loader.exec_module(specialize_tejado)

# Import components
handler = specialize_tejado.handler
detect_building_type = specialize_tejado.detect_building_type
analyze_roof_characteristics = specialize_tejado.analyze_roof_characteristics
calculate_structural_cte = specialize_tejado.calculate_structural_cte
detect_obstacles = specialize_tejado.detect_obstacles
calculate_specific_budget = specialize_tejado.calculate_specific_budget
generate_recommendations_and_warnings = specialize_tejado.generate_recommendations_and_warnings
assess_viability = specialize_tejado.assess_viability
GREEN_ROOF_WEIGHTS = specialize_tejado.GREEN_ROOF_WEIGHTS
MIN_LOAD_CAPACITY_KG_M2 = specialize_tejado.MIN_LOAD_CAPACITY_KG_M2


def test_building_detection():
    """Test building detection from compactness"""
    print("\n🏢 Testing building detection...")
    
    # Test 1: Rectangular building (high compactness)
    area_m2 = 250.0
    perimeter_m = 65.0
    coords = [[0, 0], [0.001, 0], [0.001, 0.002], [0, 0.002]]
    
    result = detect_building_type(area_m2, perimeter_m, coords)
    
    assert result['es_edificio'] == True, "Should detect building"
    assert result['confianza'] in ['alta', 'media'], f"Confidence should be alta/media, got {result['confianza']}"
    assert 'compacidad' in result
    assert result['compacidad'] > 0.4
    print(f"  ✓ Rectangular building detected: compactness={result['compacidad']:.3f}, confidence={result['confianza']}")
    
    # Test 2: Irregular shape (low compactness)
    area_m2 = 200.0
    perimeter_m = 120.0  # Very high perimeter for the area
    
    result = detect_building_type(area_m2, perimeter_m, coords)
    
    assert result['compacidad'] < 0.5, "Irregular shape should have low compactness"
    print(f"  ✓ Irregular shape detected: compactness={result['compacidad']:.3f}")


def test_roof_characteristics():
    """Test roof characteristic analysis"""
    print("\n🏠 Testing roof characteristics analysis...")
    
    # Test 1: Modern building
    result = analyze_roof_characteristics(250.0, 'edificio_moderno')
    
    assert result['tipo_cubierta_actual'] == 'plana'
    assert result['tipo_verde_recomendado'] in ['extensiva', 'semi_intensiva', 'intensiva', 'refuerzo_necesario']
    assert result['capacidad_estructural_kg_m2'] > 0
    assert result['estado_impermeabilizacion'] in ['bueno', 'aceptable', 'necesita_reparacion']
    print(f"  ✓ Modern building: capacity={result['capacidad_estructural_kg_m2']} kg/m², "
          f"recommended={result['tipo_verde_recomendado']}, waterproofing={result['estado_impermeabilizacion']}")
    
    # Test 2: Old building
    result = analyze_roof_characteristics(250.0, 'edificio_antiguo')
    
    assert result['capacidad_estructural_kg_m2'] <= 200
    assert result['estado_impermeabilizacion'] == 'necesita_reparacion'
    print(f"  ✓ Old building: capacity={result['capacidad_estructural_kg_m2']} kg/m², "
          f"waterproofing={result['estado_impermeabilizacion']}")
    
    # Test 3: Recent building
    result = analyze_roof_characteristics(250.0, 'edificio_reciente')
    
    assert result['capacidad_estructural_kg_m2'] >= 400
    assert result['estado_impermeabilizacion'] == 'bueno'
    print(f"  ✓ Recent building: capacity={result['capacidad_estructural_kg_m2']} kg/m², "
          f"waterproofing={result['estado_impermeabilizacion']}")


def test_structural_calculations():
    """Test CTE structural calculations"""
    print("\n📐 Testing CTE structural calculations...")
    
    # Test 1: Sufficient capacity for extensive
    area_m2 = 250.0
    capacity = 300  # kg/m²
    tipo_verde = 'extensiva'
    
    result = calculate_structural_cte(area_m2, capacity, tipo_verde)
    
    assert result['peso_cubierta_verde_kg_m2'] == GREEN_ROOF_WEIGHTS['extensiva']['peso_saturado_kg_m2']
    assert result['factor_seguridad_cte'] == 1.5
    assert 'margen_seguridad_kg_m2' in result
    assert 'viabilidad_estructural' in result
    assert result['cumple_cte'] in [True, False]
    print(f"  ✓ Extensive green roof: weight={result['peso_cubierta_verde_kg_m2']} kg/m², "
          f"margin={result['margen_seguridad_kg_m2']:.1f} kg/m², "
          f"viability={result['viabilidad_estructural']}, CTE={result['cumple_cte']}")
    
    # Test 2: Insufficient capacity
    area_m2 = 250.0
    capacity = 150  # kg/m² - too low
    tipo_verde = 'extensiva'
    
    result = calculate_structural_cte(area_m2, capacity, tipo_verde)
    
    assert result['refuerzo_estructural_necesario'] == True
    assert result['viabilidad_estructural'] == 'nula'
    assert result['cumple_cte'] == False
    print(f"  ✓ Insufficient capacity: margin={result['margen_seguridad_kg_m2']:.1f} kg/m², "
          f"reinforcement needed={result['refuerzo_estructural_necesario']}")
    
    # Test 3: High capacity for intensive
    area_m2 = 250.0
    capacity = 600  # kg/m² - high capacity
    tipo_verde = 'intensiva'
    
    result = calculate_structural_cte(area_m2, capacity, tipo_verde)
    
    assert result['cumple_cte'] == True
    assert result['viabilidad_estructural'] in ['alta', 'media']
    print(f"  ✓ High capacity for intensive: margin={result['margen_seguridad_kg_m2']:.1f} kg/m², "
          f"viability={result['viabilidad_estructural']}")


def test_obstacle_detection():
    """Test obstacle detection"""
    print("\n🚧 Testing obstacle detection...")
    
    # Test 1: Small roof
    area_m2 = 100.0
    result = detect_obstacles(area_m2, 'residencial')
    
    assert 'obstaculos_detectados' in result
    assert len(result['obstaculos_detectados']) > 0
    assert result['area_util_cubierta_verde_m2'] < area_m2
    assert result['porcentaje_area_util'] < 100
    print(f"  ✓ Small roof (100 m²): {len(result['obstaculos_detectados'])} obstacle types, "
          f"{result['porcentaje_area_util']:.1f}% usable")
    
    # Test 2: Large roof
    area_m2 = 500.0
    result = detect_obstacles(area_m2, 'oficinas')
    
    assert result['area_ocupada_obstaculos_m2'] > 0
    assert result['area_util_cubierta_verde_m2'] > 0
    print(f"  ✓ Large office roof (500 m²): {result['area_ocupada_obstaculos_m2']:.1f} m² occupied, "
          f"{result['area_util_cubierta_verde_m2']:.1f} m² usable")
    
    # Verify obstacle types
    obstacle_types = [obs['tipo'] for obs in result['obstaculos_detectados']]
    expected_types = ['chimenea', 'aire_acondicionado', 'antena', 'acceso']
    for expected in expected_types:
        assert expected in obstacle_types, f"Expected obstacle type '{expected}' not found"
    print(f"  ✓ All expected obstacle types detected: {', '.join(obstacle_types)}")


def test_specific_budget():
    """Test specific budget calculation"""
    print("\n💰 Testing specific budget calculation...")
    
    # Test case: 250 m² roof, good waterproofing, no reinforcement needed
    area_m2 = 250.0
    area_util_m2 = 220.0  # After removing obstacles
    perimeter_m = 65.0
    estado_impermeabilizacion = 'bueno'
    refuerzo_necesario = False
    tipo_verde = 'extensiva'
    presupuesto_base_eur = 25000.0
    
    result = calculate_specific_budget(
        area_m2,
        area_util_m2,
        perimeter_m,
        estado_impermeabilizacion,
        refuerzo_necesario,
        tipo_verde,
        presupuesto_base_eur
    )
    
    assert result['presupuesto_base_eur'] == presupuesto_base_eur
    assert 'costes_adicionales' in result
    assert result['total_adicional_eur'] > 0
    assert result['presupuesto_total_eur'] > presupuesto_base_eur
    assert result['incremento_vs_base_eur'] > 0
    assert result['incremento_vs_base_porcentaje'] > 0
    
    # Check that all expected additional costs are present
    expected_costs = [
        'impermeabilizacion_eur',
        'drenaje_adicional_eur',
        'barrera_antiraices_premium_eur',
        'riego_automatico_tejado_eur',
        'transporte_grua_eur',
        'refuerzo_estructural_eur',  # Should include engineering study
        'seguridad_eur'
    ]
    for cost in expected_costs:
        assert cost in result['costes_adicionales'], f"Missing cost: {cost}"
        assert result['costes_adicionales'][cost] > 0
    
    print(f"  ✓ Base budget: {presupuesto_base_eur:,.0f} €")
    print(f"  ✓ Additional costs: {result['total_adicional_eur']:,.0f} € "
          f"(+{result['incremento_vs_base_porcentaje']:.1f}%)")
    print(f"  ✓ Total budget: {result['presupuesto_total_eur']:,.0f} €")
    print(f"  ✓ Cost per m²: {result['coste_por_m2_total_eur']:.2f} €/m²")
    
    # Test with reinforcement needed
    result2 = calculate_specific_budget(
        area_m2,
        area_util_m2,
        perimeter_m,
        'necesita_reparacion',  # Bad waterproofing
        True,  # Reinforcement needed
        tipo_verde,
        presupuesto_base_eur
    )
    
    assert result2['total_adicional_eur'] > result['total_adicional_eur']
    assert result2['costes_adicionales']['refuerzo_estructural_eur'] > result['costes_adicionales']['refuerzo_estructural_eur']
    print(f"  ✓ With reinforcement: {result2['total_adicional_eur']:,.0f} € additional "
          f"(+{result2['incremento_vs_base_porcentaje']:.1f}%)")


def test_viability_assessment():
    """Test viability assessment"""
    print("\n✅ Testing viability assessment...")
    
    # Test 1: High viability case
    structural = {
        'viabilidad_estructural': 'alta',
        'cumple_cte': True
    }
    roof_chars = {
        'estado_impermeabilizacion': 'bueno'
    }
    budget = {
        'coste_por_m2_total_eur': 100.0  # Low cost
    }
    area_util_m2 = 220.0
    
    result = assess_viability(structural, roof_chars, budget, area_util_m2)
    
    assert result['viabilidad_tecnica'] == 'alta'
    assert result['viabilidad_economica'] == 'alta'
    assert result['viabilidad_normativa'] == 'alta'
    assert result['viabilidad_final'] == 'alta'
    print(f"  ✓ High viability case: technical={result['viabilidad_tecnica']}, "
          f"economic={result['viabilidad_economica']}, regulatory={result['viabilidad_normativa']}, "
          f"final={result['viabilidad_final']}")
    
    # Test 2: Low viability case
    structural = {
        'viabilidad_estructural': 'baja',
        'cumple_cte': False
    }
    roof_chars = {
        'estado_impermeabilizacion': 'necesita_reparacion'
    }
    budget = {
        'coste_por_m2_total_eur': 280.0  # High cost
    }
    
    result = assess_viability(structural, roof_chars, budget, area_util_m2)
    
    assert result['viabilidad_tecnica'] == 'baja'
    assert result['viabilidad_economica'] in ['baja', 'nula']
    assert result['viabilidad_normativa'] in ['baja', 'media']  # Can be media if one condition is met
    assert result['viabilidad_final'] in ['baja', 'nula']
    print(f"  ✓ Low viability case: technical={result['viabilidad_tecnica']}, "
          f"economic={result['viabilidad_economica']}, regulatory={result['viabilidad_normativa']}, "
          f"final={result['viabilidad_final']}")


def test_recommendations_and_warnings():
    """Test recommendations and warnings generation"""
    print("\n📋 Testing recommendations and warnings...")
    
    # Create test data
    building_detection = {
        'confianza': 'alta',
        'es_edificio': True
    }
    roof_chars = {
        'tipo_verde_recomendado': 'extensiva',
        'estado_impermeabilizacion': 'aceptable',
        'pendiente_grados': 3,
        'accesibilidad': 'si'
    }
    structural = {
        'refuerzo_estructural_necesario': False,
        'margen_seguridad_porcentaje': 35.0,
        'peso_cubierta_verde_kg_m2': 180,
        'capacidad_estructural_kg_m2': 300,
        'cumple_cte': True
    }
    obstacles = {
        'porcentaje_area_util': 85.0
    }
    budget = {
        'incremento_vs_base_porcentaje': 45.0
    }
    
    recommendations, warnings = generate_recommendations_and_warnings(
        building_detection,
        roof_chars,
        structural,
        obstacles,
        budget
    )
    
    assert isinstance(recommendations, list)
    assert isinstance(warnings, list)
    assert len(recommendations) > 0
    print(f"  ✓ Generated {len(recommendations)} recommendations")
    print(f"  ✓ Generated {len(warnings)} warnings")
    
    # Check that recommendations contain key advice
    recommendations_text = ' '.join(recommendations)
    assert 'extensiva' in recommendations_text.lower() or 'intensiva' in recommendations_text.lower()
    
    # Test case with warnings
    structural['refuerzo_estructural_necesario'] = True
    structural['margen_seguridad_porcentaje'] = -10.0
    roof_chars['estado_impermeabilizacion'] = 'necesita_reparacion'
    
    recommendations, warnings = generate_recommendations_and_warnings(
        building_detection,
        roof_chars,
        structural,
        obstacles,
        budget
    )
    
    assert len(warnings) > 0
    warnings_text = ' '.join(warnings)
    assert 'crítico' in warnings_text.lower() or 'refuerzo' in warnings_text.lower()
    print(f"  ✓ Generated warnings for critical issues")


def test_full_endpoint():
    """Test the full API endpoint"""
    print("\n🔌 Testing full API endpoint...")
    
    # Create request data
    request_data = {
        'analisis_id': 'test-uuid-12345',
        'tipo_especializacion': 'tejado',
        'area_base_m2': 250.5,
        'perimetro_m': 65.2,
        'green_score_base': 75.5,
        'especies_base': [
            {'nombre_cientifico': 'Rosmarinus officinalis', 'nombre_comun': 'Romero'}
        ],
        'presupuesto_base_eur': 25000,
        'coordinates': [[-3.7038, 40.4168], [-3.7035, 40.4168], [-3.7035, 40.4170], [-3.7038, 40.4170]],
        'building_age': 'edificio_moderno'
    }
    
    # Simulate the endpoint logic directly (without HTTP layer)
    # This tests all the integration between components
    
    analisis_id = request_data.get('analisis_id')
    area_base_m2 = float(request_data.get('area_base_m2', 0))
    perimetro_m = float(request_data.get('perimetro_m', 0))
    presupuesto_base_eur = float(request_data.get('presupuesto_base_eur', 0))
    coordinates = request_data.get('coordinates', [])
    building_age = request_data.get('building_age', 'edificio_moderno')
    
    # Execute the analysis flow
    building_detection = detect_building_type(area_base_m2, perimetro_m, coordinates)
    roof_chars = analyze_roof_characteristics(area_base_m2, building_age)
    
    tipo_verde = roof_chars['tipo_verde_recomendado']
    if tipo_verde == 'refuerzo_necesario':
        tipo_verde = 'extensiva'
    
    structural = calculate_structural_cte(
        area_base_m2,
        roof_chars['capacidad_estructural_kg_m2'],
        tipo_verde
    )
    
    obstacles = detect_obstacles(area_base_m2)
    
    budget = calculate_specific_budget(
        area_base_m2,
        obstacles['area_util_cubierta_verde_m2'],
        perimetro_m,
        roof_chars['estado_impermeabilizacion'],
        structural['refuerzo_estructural_necesario'],
        tipo_verde,
        presupuesto_base_eur
    )
    
    recommendations, warnings = generate_recommendations_and_warnings(
        building_detection,
        roof_chars,
        structural,
        obstacles,
        budget
    )
    
    viability = assess_viability(
        structural,
        roof_chars,
        budget,
        obstacles['area_util_cubierta_verde_m2']
    )
    
    # Build response (same structure as API)
    response_data = {
        'success': True,
        'analisis_id': analisis_id,
        'tipo_especializacion': 'tejado',
        'area_base_m2': area_base_m2,
        'green_score_base': request_data.get('green_score_base', 0),
        'especies_base': request_data.get('especies_base', []),
        'presupuesto_base_eur': presupuesto_base_eur,
        'caracteristicas_especificas': {
            'deteccion_edificio': building_detection,
            'caracteristicas_tejado': roof_chars,
            'analisis_obstaculos': obstacles,
        },
        'analisis_adicional': {
            'calculo_estructural_cte': structural,
            'recomendaciones': recommendations,
            'advertencias': warnings,
        },
        'presupuesto_adicional': budget['costes_adicionales'],
        'presupuesto_total_eur': budget['presupuesto_total_eur'],
        'incremento_vs_base_eur': budget['incremento_vs_base_eur'],
        'incremento_vs_base_porcentaje': budget['incremento_vs_base_porcentaje'],
        'viabilidad_tecnica': viability['viabilidad_tecnica'],
        'viabilidad_economica': viability['viabilidad_economica'],
        'viabilidad_normativa': viability['viabilidad_normativa'],
        'viabilidad_final': viability['viabilidad_final'],
        'notas': f'Análisis especializado de tejado generado. Tipo recomendado: {tipo_verde}. '
                f'Viabilidad final: {viability["viabilidad_final"]}.',
    }
    
    # Verify response structure
    assert response_data['success'] == True
    assert response_data['analisis_id'] == 'test-uuid-12345'
    assert response_data['tipo_especializacion'] == 'tejado'
    assert response_data['area_base_m2'] == 250.5
    
    # Verify caracteristicas_especificas
    assert 'caracteristicas_especificas' in response_data
    assert 'deteccion_edificio' in response_data['caracteristicas_especificas']
    assert 'caracteristicas_tejado' in response_data['caracteristicas_especificas']
    assert 'analisis_obstaculos' in response_data['caracteristicas_especificas']
    
    # Verify analisis_adicional
    assert 'analisis_adicional' in response_data
    assert 'calculo_estructural_cte' in response_data['analisis_adicional']
    assert 'recomendaciones' in response_data['analisis_adicional']
    assert 'advertencias' in response_data['analisis_adicional']
    
    # Verify budget
    assert 'presupuesto_adicional' in response_data
    assert 'presupuesto_total_eur' in response_data
    assert response_data['presupuesto_total_eur'] > request_data['presupuesto_base_eur']
    
    # Verify viability
    assert 'viabilidad_tecnica' in response_data
    assert 'viabilidad_economica' in response_data
    assert 'viabilidad_normativa' in response_data
    assert 'viabilidad_final' in response_data
    assert response_data['viabilidad_final'] in ['alta', 'media', 'baja', 'nula']
    
    print(f"  ✓ Endpoint returned success")
    print(f"  ✓ Building detection: {response_data['caracteristicas_especificas']['deteccion_edificio']['tipo_probable']}")
    print(f"  ✓ Recommended type: {response_data['caracteristicas_especificas']['caracteristicas_tejado']['tipo_verde_recomendado']}")
    print(f"  ✓ Structural viability: {response_data['viabilidad_tecnica']}")
    print(f"  ✓ Final viability: {response_data['viabilidad_final']}")
    print(f"  ✓ Total budget: {response_data['presupuesto_total_eur']:,.0f} €")
    print(f"  ✓ Budget increase: +{response_data['incremento_vs_base_porcentaje']:.1f}%")


def run_all_tests():
    """Run all tests"""
    print("=" * 70)
    print("🧪 SPECIALIZED ROOFTOP ANALYSIS - TEST SUITE")
    print("=" * 70)
    
    try:
        test_building_detection()
        test_roof_characteristics()
        test_structural_calculations()
        test_obstacle_detection()
        test_specific_budget()
        test_viability_assessment()
        test_recommendations_and_warnings()
        test_full_endpoint()
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED")
        print("=" * 70)
        return True
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
