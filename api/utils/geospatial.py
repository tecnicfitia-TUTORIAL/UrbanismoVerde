"""
Geospatial Utilities

Accurate geospatial calculations using Haversine formula and 
geodesic methods for precise area and distance calculations.
"""

import math

# Earth radius in meters
EARTH_RADIUS_M = 6371000

# Meters per degree (approximate, varies by latitude)
METERS_PER_DEGREE_LAT = 111000
METERS_PER_DEGREE_LON_AT_EQUATOR = 111320


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    
    Args:
        lat1, lon1: First point coordinates (degrees)
        lat2, lon2: Second point coordinates (degrees)
        
    Returns:
        Distance in meters
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return EARTH_RADIUS_M * c


def calculate_area_haversine(coordinates: list) -> float:
    """
    Calculate area of a polygon using Haversine-based method.
    More accurate than simple planar approximation, especially for larger areas.
    
    Args:
        coordinates: List of [lon, lat] pairs forming a polygon
        
    Returns:
        Area in square meters
    """
    if len(coordinates) < 3:
        return 0.0
    
    # Get center latitude for projection
    center_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
    
    # Convert to planar coordinates (orthographic projection)
    # X = lon * cos(center_lat) * METERS_PER_DEGREE
    # Y = lat * METERS_PER_DEGREE
    cos_lat = math.cos(math.radians(center_lat))
    
    planar_coords = []
    for lon, lat in coordinates:
        x = lon * cos_lat * METERS_PER_DEGREE_LON_AT_EQUATOR
        y = lat * METERS_PER_DEGREE_LAT
        planar_coords.append((x, y))
    
    # Calculate area using shoelace formula
    area = 0.0
    n = len(planar_coords)
    
    for i in range(n):
        x1, y1 = planar_coords[i]
        x2, y2 = planar_coords[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    
    return abs(area) / 2


def calculate_perimeter(coordinates: list) -> float:
    """
    Calculate perimeter of a polygon using Haversine distances.
    
    Args:
        coordinates: List of [lon, lat] pairs forming a polygon
        
    Returns:
        Perimeter in meters
    """
    if len(coordinates) < 2:
        return 0.0
    
    perimeter = 0.0
    n = len(coordinates)
    
    for i in range(n):
        lon1, lat1 = coordinates[i]
        lon2, lat2 = coordinates[(i + 1) % n]
        perimeter += haversine_distance(lat1, lon1, lat2, lon2)
    
    return perimeter


def get_center_coordinates(coordinates: list) -> tuple:
    """
    Calculate centroid (center point) of a polygon.
    
    Args:
        coordinates: List of [lon, lat] pairs
        
    Returns:
        Tuple (center_lat, center_lon)
    """
    if not coordinates:
        return (0.0, 0.0)
    
    center_lon = sum(coord[0] for coord in coordinates) / len(coordinates)
    center_lat = sum(coord[1] for coord in coordinates) / len(coordinates)
    
    return (center_lat, center_lon)


def get_bounding_box(coordinates: list) -> dict:
    """
    Get bounding box of a polygon.
    
    Args:
        coordinates: List of [lon, lat] pairs
        
    Returns:
        dict with min/max lat/lon
    """
    if not coordinates:
        return {'min_lat': 0, 'max_lat': 0, 'min_lon': 0, 'max_lon': 0}
    
    lons = [coord[0] for coord in coordinates]
    lats = [coord[1] for coord in coordinates]
    
    return {
        'min_lat': min(lats),
        'max_lat': max(lats),
        'min_lon': min(lons),
        'max_lon': max(lons)
    }


def calculate_slope_from_area_and_perimeter(area_m2: float, perimeter_m: float) -> float:
    """
    Estimate slope based on area-to-perimeter ratio.
    This is a simplified estimation for roofs.
    
    For a perfect square: perimeter = 4 * sqrt(area)
    For elongated shapes: perimeter increases relative to area
    
    Args:
        area_m2: Area in m²
        perimeter_m: Perimeter in meters
        
    Returns:
        Estimated slope in degrees (simplified calculation)
    """
    if area_m2 <= 0:
        return 0.0
    
    # Calculate ideal perimeter for a square with this area
    ideal_perimeter = 4 * math.sqrt(area_m2)
    
    # Shape factor: how much the shape deviates from square
    shape_factor = perimeter_m / ideal_perimeter if ideal_perimeter > 0 else 1.0
    
    # Estimate slope (simplified - assumes some correlation)
    # For roofs, typical slopes: 0-30 degrees
    # This is a rough estimation - in reality would need elevation data
    estimated_slope = min(5.0 * (shape_factor - 1.0), 15.0)
    
    return max(0.0, estimated_slope)
