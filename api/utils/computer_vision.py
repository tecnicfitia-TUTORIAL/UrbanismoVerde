"""
Computer Vision Simulation

Simulated computer vision analysis for green roof viability.
In production, this would use real satellite imagery and OpenCV.

Future integration requires:
- Google Earth Engine or Sentinel Hub API
- NIR (Near Infrared) band processing
- Trained segmentation models
- Multi-temporal shadow analysis
"""

import random


def segment_surfaces(area_m2: float, seed: int = None) -> dict:
    """
    Simulate surface segmentation analysis.
    
    In production, this would use:
    - Satellite imagery (RGB + NIR bands)
    - Segmentation models (U-Net, DeepLab)
    - Surface classification (asphalt, gravel, vegetation, obstacles)
    
    Args:
        area_m2: Total roof area
        seed: Random seed for reproducibility
        
    Returns:
        dict with segmented surface areas
    """
    if seed is not None:
        random.seed(seed)
    
    # Simulate realistic surface distribution
    # Typical urban roof composition:
    asfalto_pct = random.uniform(0.25, 0.35)      # Asphalt/tar
    grava_pct = random.uniform(0.45, 0.55)        # Gravel
    vegetacion_pct = random.uniform(0.05, 0.15)   # Existing vegetation
    obstaculos_pct = random.uniform(0.08, 0.12)   # Chimneys, AC units, etc.
    
    # Normalize to 100%
    total_pct = asfalto_pct + grava_pct + vegetacion_pct + obstaculos_pct
    asfalto_pct /= total_pct
    grava_pct /= total_pct
    vegetacion_pct /= total_pct
    obstaculos_pct /= total_pct
    
    # Calculate areas
    asfalto_m2 = area_m2 * asfalto_pct
    grava_m2 = area_m2 * grava_pct
    vegetacion_previa_m2 = area_m2 * vegetacion_pct
    obstaculos_m2 = area_m2 * obstaculos_pct
    
    # Usable area (exclude obstacles)
    area_util_m2 = area_m2 - obstaculos_m2
    
    return {
        'asfalto_m2': round(asfalto_m2, 2),
        'grava_m2': round(grava_m2, 2),
        'vegetacion_previa_m2': round(vegetacion_previa_m2, 2),
        'obstaculos_m2': round(obstaculos_m2, 2),
        'area_util_m2': round(area_util_m2, 2),
        'area_util_pct': round((area_util_m2 / area_m2) * 100, 1) if area_m2 > 0 else 0
    }


def analyze_solar_exposure(lat: float, lon: float, area_m2: float) -> dict:
    """
    Analyze solar exposure for the location.
    
    In production, this would use:
    - Solar radiation databases (PVGIS, NASA POWER)
    - Shadow analysis from surrounding buildings
    - Multi-temporal satellite imagery
    - 3D building models
    
    Args:
        lat: Latitude
        lon: Longitude  
        area_m2: Roof area
        
    Returns:
        dict with solar exposure metrics
    """
    # Estimate annual solar hours based on latitude
    # Spain latitude range: 36°N (south) to 43.5°N (north)
    # Madrid: ~40.4°N
    
    # Base solar hours (Madrid): ~2800 hours/year theoretical max
    # Actual (accounting for clouds, seasons): ~2400 hours/year
    
    # Adjust by latitude
    if lat >= 41.5:  # Northern Spain
        base_hours = 2200
    elif lat >= 39.5:  # Central Spain (Madrid)
        base_hours = 2400
    else:  # Southern Spain
        base_hours = 2600
    
    # Simulate shadow factor from surrounding buildings
    # In production, would use 3D models and sun path analysis
    shadow_factor = random.uniform(0.75, 0.95)
    
    horas_sol_anuales = int(base_hours * shadow_factor)
    
    # Classify solar exposure
    if horas_sol_anuales >= 2200:
        clasificacion = 'SOL_DIRECTO'
    elif horas_sol_anuales >= 1800:
        clasificacion = 'MIXTA'
    else:
        clasificacion = 'SOMBRA'
    
    return {
        'horas_sol_anuales': horas_sol_anuales,
        'clasificacion': clasificacion,
        'factor_sombra': round(shadow_factor, 2),
        'radiacion_estimada_kwh_m2_ano': round(horas_sol_anuales * 0.8, 0)  # Rough estimate
    }


def calculate_ndvi(area_m2: float, vegetacion_previa_m2: float = 0) -> float:
    """
    Calculate current NDVI (Normalized Difference Vegetation Index).
    
    NDVI = (NIR - Red) / (NIR + Red)
    Range: -1 to +1
    - -1 to 0: Water, bare soil
    - 0 to 0.2: Sparse vegetation, urban areas
    - 0.2 to 0.5: Moderate vegetation
    - 0.5 to 1: Dense vegetation
    
    In production, this would use:
    - Sentinel-2 satellite imagery (bands 4 and 8)
    - NIR and Red band processing
    - Cloud-free composite images
    
    Args:
        area_m2: Total area
        vegetacion_previa_m2: Existing vegetation area
        
    Returns:
        NDVI value (-1 to 1)
    """
    if area_m2 <= 0:
        return 0.0
    
    # Calculate vegetation percentage
    veg_pct = vegetacion_previa_m2 / area_m2 if area_m2 > 0 else 0
    
    # Urban areas with little vegetation: NDVI ~0.1-0.2
    # Roofs typically have NDVI: 0.05-0.15 (low vegetation)
    base_ndvi = 0.10
    
    # Adjust based on existing vegetation
    ndvi_actual = base_ndvi + (veg_pct * 0.3)  # Max contribution: +0.3
    
    # Clamp to valid range
    ndvi_actual = max(-1.0, min(1.0, ndvi_actual))
    
    return round(ndvi_actual, 2)


def estimate_ndvi_post_installation(area_verde_m2: float, area_total_m2: float, tipo_vegetacion: str = 'extensiva') -> float:
    """
    Estimate NDVI after green roof installation.
    
    Args:
        area_verde_m2: Green roof area
        area_total_m2: Total area
        tipo_vegetacion: 'extensiva' or 'intensiva'
        
    Returns:
        Estimated post-installation NDVI
    """
    if area_total_m2 <= 0:
        return 0.0
    
    cobertura_pct = area_verde_m2 / area_total_m2
    
    # Extensive green roof: NDVI ~0.4-0.5
    # Intensive green roof: NDVI ~0.5-0.7
    if tipo_vegetacion == 'intensiva':
        ndvi_verde = 0.6
    else:
        ndvi_verde = 0.45
    
    # Weighted average
    ndvi_post = cobertura_pct * ndvi_verde + (1 - cobertura_pct) * 0.1
    
    return round(ndvi_post, 2)


def simulate_seasonal_ndvi(base_ndvi: float) -> dict:
    """
    Simulate NDVI variation across seasons.
    
    Args:
        base_ndvi: Base NDVI value
        
    Returns:
        dict with seasonal NDVI values
    """
    # Mediterranean climate: less variation than temperate
    # Green roofs: relatively stable due to species selection
    
    return {
        'primavera': round(base_ndvi * 1.1, 2),  # Spring: peak
        'verano': round(base_ndvi * 0.95, 2),    # Summer: slight drop
        'otono': round(base_ndvi * 1.0, 2),      # Autumn: stable
        'invierno': round(base_ndvi * 0.85, 2)   # Winter: lowest
    }
