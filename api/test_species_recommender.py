"""
Tests for Species Recommender System
Tests recommendation logic, context filtering, and scoring.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.species_recommender import (
    recommend_species_by_context,
    calculate_suitability_score,
    get_predefined_mixes,
    ESPECIES_DATABASE
)


def test_recommend_species_tejado_extensivo():
    """Test species recommendation for extensive rooftop"""
    print("\n🌱 Testing species recommendation for extensive rooftop...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 10,
        'carga_admisible_kg_m2': 180,
        'exposicion_solar': 'pleno_sol',
        'riego_disponible': 'ninguno',
        'mantenimiento_deseado': 'muy_bajo'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='tejado',
        caracteristicas=caracteristicas,
        prioridad='economia',
        max_especies=5
    )
    
    assert len(especies) > 0, "Should recommend at least one species"
    assert especies[0]['idoneidad_score'] > 0, "Species should have positive suitability score"
    
    # Check that recommended species are appropriate for the context
    top_species = especies[0]
    assert top_species['contextos_validos'].get('tejado_extensivo', False) or \
           top_species['contextos_validos'].get('tejado_intensivo', False), \
           "Top species should be valid for rooftops"
    
    print(f"  ✓ Recommended {len(especies)} species for extensive rooftop")
    print(f"  ✓ Top species: {top_species['nombre_comun']} (score: {top_species['idoneidad_score']})")
    print(f"  ✓ Properties: nivel_economia={top_species['nivel_economia']}, "
          f"riego={top_species['riego_necesario']}, "
          f"mantenimiento={top_species['mantenimiento_anual']}")


def test_recommend_species_jardin_vertical():
    """Test species recommendation for vertical garden"""
    print("\n🌿 Testing species recommendation for vertical garden...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 20,
        'carga_admisible_kg_m2': 100,
        'exposicion_solar': 'media_sombra',
        'riego_disponible': 'automatico',
        'mantenimiento_deseado': 'medio'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='jardin_vertical',
        caracteristicas=caracteristicas,
        prioridad='estetica',
        max_especies=5
    )
    
    assert len(especies) > 0, "Should recommend at least one species"
    
    # Vertical garden species should support vertical contexts
    for especie in especies:
        assert especie['contextos_validos'].get('jardin_vertical', False), \
               f"{especie['nombre_comun']} should be valid for vertical gardens"
    
    print(f"  ✓ Recommended {len(especies)} species for vertical garden")
    print(f"  ✓ All species compatible with vertical context")


def test_recommend_species_suelo():
    """Test species recommendation for ground level"""
    print("\n🌳 Testing species recommendation for ground level...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 100,
        'exposicion_solar': 'pleno_sol',
        'riego_disponible': 'manual',
        'mantenimiento_deseado': 'bajo'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='solar_vacio',
        caracteristicas=caracteristicas,
        prioridad='biodiversidad',
        max_especies=10
    )
    
    assert len(especies) > 0, "Should recommend species for ground level"
    
    # Check biodiversity prioritization
    top_species = especies[0]
    biodiversidad_score = top_species.get('beneficios_ambientales', {}).get('biodiversidad_score', 0)
    assert biodiversidad_score > 0, "Top species should have biodiversity score"
    
    print(f"  ✓ Recommended {len(especies)} species for ground level")
    print(f"  ✓ Top species biodiversity score: {biodiversidad_score}")


def test_priority_economia():
    """Test economy-prioritized recommendations"""
    print("\n💰 Testing economy-prioritized recommendations...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 15,
        'exposicion_solar': 'pleno_sol'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='tejado',
        caracteristicas=caracteristicas,
        prioridad='economia',
        max_especies=5
    )
    
    # Top species should be economical
    top_species = especies[0]
    assert top_species['nivel_economia'] in ['muy_alta', 'alta'], \
           "Top species should be economical when priority is 'economia'"
    assert top_species['mantenimiento_anual'] in ['nulo', 'muy_bajo', 'bajo'], \
           "Top species should have low maintenance for economy priority"
    
    print(f"  ✓ Top species is economical: nivel_economia={top_species['nivel_economia']}")


def test_priority_comestible():
    """Test edible-prioritized recommendations"""
    print("\n🍃 Testing edible-prioritized recommendations...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 25,
        'exposicion_solar': 'pleno_sol'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='tejado',
        caracteristicas=caracteristicas,
        prioridad='comestible',
        max_especies=5
    )
    
    # Check if top species are edible or aromatic
    top_species = especies[0]
    assert top_species.get('comestible', False) or top_species.get('aromatica', False), \
           "Top species should be edible or aromatic when priority is 'comestible'"
    
    print(f"  ✓ Top species is edible/aromatic: comestible={top_species.get('comestible')}, "
          f"aromatica={top_species.get('aromatica')}")


def test_depth_constraint():
    """Test that depth constraints are respected"""
    print("\n📏 Testing depth constraint filtering...")
    
    # Request with very shallow substrate
    caracteristicas = {
        'profundidad_sustrato_cm': 5,
        'exposicion_solar': 'pleno_sol'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='tejado',
        caracteristicas=caracteristicas,
        prioridad='economia'
    )
    
    # All recommended species should fit the depth constraint
    for especie in especies:
        profundidad_necesaria = especie['restricciones'].get('profundidad_minima_cm', 0)
        assert profundidad_necesaria <= 5, \
               f"{especie['nombre_comun']} requires {profundidad_necesaria}cm but only 5cm available"
    
    print(f"  ✓ All {len(especies)} species fit 5cm depth constraint")


def test_weight_constraint():
    """Test that weight constraints are respected"""
    print("\n⚖️ Testing weight constraint filtering...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 30,
        'carga_admisible_kg_m2': 50,  # Very limited load
        'exposicion_solar': 'pleno_sol'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='tejado',
        caracteristicas=caracteristicas,
        prioridad='economia'
    )
    
    # All recommended species should fit the weight constraint
    for especie in especies:
        peso_necesario = especie['restricciones'].get('peso_max_kg_m2', 0)
        assert peso_necesario <= 50, \
               f"{especie['nombre_comun']} requires {peso_necesario}kg/m² but only 50kg/m² available"
    
    print(f"  ✓ All {len(especies)} species fit 50kg/m² weight constraint")


def test_calculate_suitability_score():
    """Test suitability score calculation"""
    print("\n🎯 Testing suitability score calculation...")
    
    # Test species
    especie = {
        'nivel_economia': 'muy_alta',
        'mantenimiento_anual': 'nulo',
        'riego_necesario': 'nulo',
        'nativa_espana': True,
        'comestible': False,
        'aromatica': True,
        'melifera': True,
        'beneficios_ambientales': {
            'co2_kg_m2_anual': 0.8,
            'retencion_agua_porcentaje': 30,
            'biodiversidad_score': 9
        }
    }
    
    caracteristicas = {'exposicion_solar': 'pleno_sol'}
    
    # Test different priorities
    score_economia = calculate_suitability_score(especie, caracteristicas, 'economia')
    score_biodiversidad = calculate_suitability_score(especie, caracteristicas, 'biodiversidad')
    
    assert 0 <= score_economia <= 100, "Score should be between 0 and 100"
    assert 0 <= score_biodiversidad <= 100, "Score should be between 0 and 100"
    assert score_economia > 70, "Highly economical species should score high on economy priority"
    assert score_biodiversidad > 70, "High biodiversity species should score high on biodiversity priority"
    
    print(f"  ✓ Score (economia): {score_economia:.2f}")
    print(f"  ✓ Score (biodiversidad): {score_biodiversidad:.2f}")


def test_predefined_mixes():
    """Test predefined species mixes"""
    print("\n🎨 Testing predefined species mixes...")
    
    mixes_tejado = get_predefined_mixes('tejado')
    assert len(mixes_tejado) > 0, "Should have predefined mixes for tejado"
    
    mix = mixes_tejado[0]
    assert 'nombre' in mix, "Mix should have name"
    assert 'descripcion' in mix, "Mix should have description"
    assert 'especies' in mix, "Mix should have species list"
    assert 'caracteristicas' in mix, "Mix should have characteristics"
    
    print(f"  ✓ Found {len(mixes_tejado)} predefined mixes for tejado")
    print(f"  ✓ First mix: {mix['nombre']}")
    print(f"  ✓ Species: {', '.join(mix['especies'])}")


def test_native_species_prioritization():
    """Test that native species are prioritized"""
    print("\n🇪🇸 Testing native species prioritization...")
    
    caracteristicas = {
        'profundidad_sustrato_cm': 50,
        'exposicion_solar': 'pleno_sol'
    }
    
    especies = recommend_species_by_context(
        tipo_especializacion='solar_vacio',
        caracteristicas=caracteristicas,
        prioridad='biodiversidad',  # Biodiversity priority favors native
        max_especies=5
    )
    
    # Count native species in top recommendations
    native_count = sum(1 for esp in especies if esp.get('nativa_espana', False))
    
    assert native_count > 0, "Should recommend at least some native species"
    print(f"  ✓ {native_count}/{len(especies)} recommended species are native to Spain")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("SPECIES RECOMMENDER SYSTEM TESTS")
    print("=" * 60)
    
    try:
        test_recommend_species_tejado_extensivo()
        test_recommend_species_jardin_vertical()
        test_recommend_species_suelo()
        test_priority_economia()
        test_priority_comestible()
        test_depth_constraint()
        test_weight_constraint()
        test_calculate_suitability_score()
        test_predefined_mixes()
        test_native_species_prioritization()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
