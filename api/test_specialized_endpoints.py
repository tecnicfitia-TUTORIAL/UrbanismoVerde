"""
Quick integration tests for new specialized endpoints
Tests basic functionality of all 4 new endpoints.
"""

import json
import sys
import importlib.util
from io import BytesIO
from unittest.mock import Mock


def load_endpoint(filename):
    """Load endpoint module from hyphenated filename"""
    spec = importlib.util.spec_from_file_location(
        filename.replace('.py', '').replace('-', '_'),
        f'/home/runner/work/UrbanismoVerde/UrbanismoVerde/api/{filename}'
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.handler


def test_endpoint(endpoint_name, test_data):
    """Test an endpoint with given data"""
    print(f"\n🔍 Testing {endpoint_name}...")
    
    handler_class = load_endpoint(endpoint_name)
    
    # Create mock request
    mock_request = Mock()
    mock_request.rfile = BytesIO(json.dumps(test_data).encode('utf-8'))
    mock_request.headers = {'Content-Length': str(len(json.dumps(test_data)))}
    
    # Create handler instance
    handler = handler_class(mock_request, ('127.0.0.1', 8000), None)
    
    # Mock response methods
    responses = []
    headers = []
    handler.send_response = lambda code: responses.append(code)
    handler.send_header = lambda key, value: headers.append((key, value))
    handler.end_headers = lambda: None
    
    response_data = []
    handler.wfile = Mock()
    handler.wfile.write = lambda data: response_data.append(data)
    
    # Call handler
    handler.do_POST()
    
    # Parse response
    if response_data:
        response_json = json.loads(response_data[0].decode('utf-8'))
        
        assert responses[0] == 200, f"Expected 200, got {responses[0]}"
        assert response_json['success'] == True, "Response should be successful"
        assert 'presupuesto_total_eur' in response_json, "Should have budget"
        assert 'viabilidad_final' in response_json, "Should have viability"
        
        print(f"  ✓ Status: {responses[0]}")
        print(f"  ✓ Success: {response_json['success']}")
        print(f"  ✓ Tipo: {response_json['tipo_especializacion']}")
        print(f"  ✓ Presupuesto total: €{response_json['presupuesto_total_eur']:,.2f}")
        print(f"  ✓ Viabilidad: {response_json['viabilidad_final']}")
        print(f"  ✓ Incremento vs base: {response_json['incremento_vs_base_porcentaje']:.1f}%")
        
        return True
    else:
        print("  ❌ No response data")
        return False


def test_zona_abandonada():
    """Test abandoned zone endpoint"""
    test_data = {
        'analisis_id': 'test-uuid-001',
        'tipo_especializacion': 'zona_abandonada',
        'area_base_m2': 1500.0,
        'perimetro_m': 180.0,
        'presupuesto_base_eur': 75000,
        'green_score_base': 65.0,
        'zone_type': 'area_residencial',
        'abandonment_years': 15
    }
    return test_endpoint('specialize-zona_abandonada.py', test_data)


def test_solar_vacio():
    """Test empty lot endpoint"""
    test_data = {
        'analisis_id': 'test-uuid-002',
        'tipo_especializacion': 'solar_vacio',
        'area_base_m2': 800.0,
        'perimetro_m': 120.0,
        'presupuesto_base_eur': 40000,
        'green_score_base': 70.0,
        'urban_location': True
    }
    return test_endpoint('specialize-solar_vacio.py', test_data)


def test_parque_degradado():
    """Test degraded park endpoint"""
    test_data = {
        'analisis_id': 'test-uuid-003',
        'tipo_especializacion': 'parque_degradado',
        'area_base_m2': 2500.0,
        'presupuesto_base_eur': 125000,
        'green_score_base': 55.0,
        'park_age_years': 25
    }
    return test_endpoint('specialize-parque_degradado.py', test_data)


def test_jardin_vertical():
    """Test vertical garden endpoint"""
    test_data = {
        'analisis_id': 'test-uuid-004',
        'tipo_especializacion': 'jardin_vertical',
        'area_base_m2': 50.0,
        'presupuesto_base_eur': 5000,
        'green_score_base': 75.0,
        'wall_height_m': 4.0,
        'wall_type': 'hormigon',
        'location': 'exterior',
        'budget_priority': 'medio'
    }
    return test_endpoint('specialize-jardin_vertical.py', test_data)


def run_all_tests():
    """Run all endpoint tests"""
    print("=" * 60)
    print("SPECIALIZED ENDPOINTS INTEGRATION TESTS")
    print("=" * 60)
    
    try:
        results = []
        results.append(test_zona_abandonada())
        results.append(test_solar_vacio())
        results.append(test_parque_degradado())
        results.append(test_jardin_vertical())
        
        print("\n" + "=" * 60)
        if all(results):
            print("✅ ALL ENDPOINT TESTS PASSED")
        else:
            print(f"⚠️ SOME TESTS FAILED: {sum(results)}/{len(results)} passed")
        print("=" * 60)
        
        return all(results)
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
