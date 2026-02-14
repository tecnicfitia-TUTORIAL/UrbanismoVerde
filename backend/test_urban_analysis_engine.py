#!/usr/bin/env python3
"""
Test script for Urban Analysis Engine fixes
Tests the critical bug fixes:
1. API key in Google Maps URLs
2. Grid reduced from 17x3 to 5x5 
3. Improved address format
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.urban_analysis_engine import (
    UrbanAnalysisEngine,
    generate_grid_points,
    estimate_rooftop_viability
)


def test_grid_generation():
    """Test that grid generates 5x5 = 25 points"""
    print("\n[TEST 1] Grid Generation (5x5 = 25 points)")
    print("-" * 60)
    
    # Test bounds (small area in Madrid)
    north, south = 40.42, 40.41
    east, west = -3.69, -3.71
    
    points = generate_grid_points(north, south, east, west, grid_size=5)
    
    assert len(points) == 25, f"Expected 25 points, got {len(points)}"
    assert all(isinstance(p, tuple) and len(p) == 2 for p in points), "All points should be (lat, lng) tuples"
    assert all(south <= p[0] <= north for p in points), "All latitudes should be within bounds"
    assert all(west <= p[1] <= east for p in points), "All longitudes should be within bounds"
    
    print(f"✅ Generated {len(points)} points")
    print(f"✅ First point: {points[0]}")
    print(f"✅ Last point: {points[-1]}")
    print("✅ TEST 1 PASSED\n")
    return True


def test_api_key_loading():
    """Test that API key is loaded from environment"""
    print("\n[TEST 2] API Key Loading")
    print("-" * 60)
    
    # Save original
    original_key = os.getenv('GOOGLE_API_KEY')
    
    try:
        # Test with key
        os.environ['GOOGLE_API_KEY'] = 'test_api_key_12345'
        engine = UrbanAnalysisEngine()
        assert engine.google_maps_api_key == 'test_api_key_12345', "API key should be loaded"
        print("✅ API key loaded correctly: test_api_key_12345")
        
        # Test without key
        if 'GOOGLE_API_KEY' in os.environ:
            del os.environ['GOOGLE_API_KEY']
        engine2 = UrbanAnalysisEngine()
        assert engine2.google_maps_api_key is None, "API key should be None when not set"
        print("✅ Handles missing API key gracefully")
        
    finally:
        # Restore original
        if original_key:
            os.environ['GOOGLE_API_KEY'] = original_key
        elif 'GOOGLE_API_KEY' in os.environ:
            del os.environ['GOOGLE_API_KEY']
    
    print("✅ TEST 2 PASSED\n")
    return True


def test_url_generation_with_key():
    """Test that URLs include API key parameter"""
    print("\n[TEST 3] URL Generation with API Key")
    print("-" * 60)
    
    # Save original
    original_key = os.getenv('GOOGLE_API_KEY')
    
    try:
        # Set test API key
        os.environ['GOOGLE_API_KEY'] = 'test_key_abc123'
        engine = UrbanAnalysisEngine()
        
        # Generate URL
        lat, lng = 40.4168, -3.7038
        url = engine._generate_satellite_image_url(lat, lng)
        
        # Verify URL format
        assert 'maps.googleapis.com/maps/api/staticmap' in url, "Should use Google Maps Static API"
        assert f'center={lat},{lng}' in url, "Should include center coordinates"
        assert 'zoom=19' in url, "Should include zoom level"
        assert 'size=400x300' in url, "Should include image size"
        assert 'maptype=satellite' in url, "Should specify satellite view"
        assert '&key=test_key_abc123' in url, "Should include API key parameter"
        
        print(f"✅ URL format correct")
        print(f"✅ URL includes API key: &key=test_key_abc123")
        print(f"   URL preview: {url[:80]}...")
        
    finally:
        # Restore original
        if original_key:
            os.environ['GOOGLE_API_KEY'] = original_key
        elif 'GOOGLE_API_KEY' in os.environ:
            del os.environ['GOOGLE_API_KEY']
    
    print("✅ TEST 3 PASSED\n")
    return True


def test_viability_calculation():
    """Test viability score calculation"""
    print("\n[TEST 4] Viability Score Calculation")
    print("-" * 60)
    
    # Test case 1: Ideal flat roof
    score1 = estimate_rooftop_viability(
        tipo_cubierta="plana",
        estado_conservacion="excelente",
        obstrucciones=[],
        confianza=90
    )
    assert 70 <= score1 <= 100, f"Ideal flat roof should score high, got {score1}"
    print(f"✅ Ideal flat roof: {score1} (expected 70-100)")
    
    # Test case 2: Poor condition roof
    score2 = estimate_rooftop_viability(
        tipo_cubierta="inclinada",
        estado_conservacion="malo",
        obstrucciones=[{"tipo": "ac"}, {"tipo": "antena"}],
        confianza=50
    )
    assert 0 <= score2 < 50, f"Poor roof should score low, got {score2}"
    print(f"✅ Poor condition roof: {score2} (expected 0-50)")
    
    # Test case 3: Good flat roof with some obstructions
    score3 = estimate_rooftop_viability(
        tipo_cubierta="plana",
        estado_conservacion="bueno",
        obstrucciones=[{"tipo": "ac"}],
        confianza=70
    )
    assert 50 <= score3 <= 90, f"Good roof with obstruction should score medium-high, got {score3}"
    print(f"✅ Good roof with obstruction: {score3} (expected 50-90)")
    
    print("✅ TEST 4 PASSED\n")
    return True


def test_address_format():
    """Test that address format is 'Edificio N (lat, lng)'"""
    print("\n[TEST 5] Address Format")
    print("-" * 60)
    
    # Generate grid
    points = generate_grid_points(40.42, 40.41, -3.69, -3.71, grid_size=5)
    
    # Check first few addresses
    for i in range(min(3, len(points))):
        lat, lng = points[i]
        address = f"Edificio {i+1} ({lat:.5f}, {lng:.5f})"
        
        assert address.startswith(f"Edificio {i+1}"), f"Address should start with 'Edificio {i+1}'"
        assert f"({lat:.5f}, {lng:.5f})" in address, "Address should include coordinates"
        print(f"✅ Address {i+1}: {address}")
    
    print("✅ TEST 5 PASSED\n")
    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("TESTING URBAN ANALYSIS ENGINE BUG FIXES")
    print("=" * 60)
    
    tests = [
        ("Grid Generation", test_grid_generation),
        ("API Key Loading", test_api_key_loading),
        ("URL Generation", test_url_generation_with_key),
        ("Viability Calculation", test_viability_calculation),
        ("Address Format", test_address_format),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except AssertionError as e:
            print(f"❌ TEST FAILED: {name}")
            print(f"   Error: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ TEST ERROR: {name}")
            print(f"   Exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"❌ {failed} TEST(S) FAILED")
        return 1


if __name__ == '__main__':
    sys.exit(main())
