import cv2
import json
import numpy as np
import time
from math import radians, sin, cos, sqrt, atan2
from shapely.geometry import shape


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371000  # Earth radius in meters
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def calculate_area_m2(polygon):
    """Calculate area in square meters using Haversine for accuracy"""
    coords = polygon['coordinates'][0]
    
    # Simplified area calculation for small polygons
    # For production, use proper geographic projection
    area_deg = shape(polygon).area
    
    # Approximate conversion (1 degree ≈ 111km at equator)
    # This is a rough estimate - in production use proper projection
    center_lat = sum(c[1] for c in coords) / len(coords)
    lat_factor = cos(radians(center_lat))
    
    area_m2 = area_deg * (111000 ** 2) * lat_factor
    
    return abs(area_m2)


def calculate_perimeter_m(polygon):
    """Calculate perimeter in meters"""
    coords = polygon['coordinates'][0]
    perimeter = 0
    
    for i in range(len(coords)):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[(i + 1) % len(coords)]
        perimeter += haversine_distance(lat1, lon1, lat2, lon2)
    
    return perimeter


def generate_mock_satellite_image(area_m2):
    """Generate mock satellite image for demo purposes"""
    # Create a mock image with some vegetation patterns
    # Constants for image sizing
    SCALE_FACTOR = 5  # Pixels per meter (controls image resolution)
    MIN_IMAGE_SIZE = 100  # Minimum image dimension in pixels
    MAX_IMAGE_SIZE = 500  # Maximum image dimension to limit memory usage
    
    size = min(max(int(sqrt(area_m2) / SCALE_FACTOR), MIN_IMAGE_SIZE), MAX_IMAGE_SIZE)
    
    # Create base image with soil color
    img = np.ones((size, size, 3), dtype=np.uint8) * np.array([139, 90, 43], dtype=np.uint8)
    
    # Add some random green patches to simulate vegetation
    num_patches = np.random.randint(0, 5)
    for _ in range(num_patches):
        center_x = np.random.randint(0, size)
        center_y = np.random.randint(0, size)
        radius = np.random.randint(10, 30)
        cv2.circle(img, (center_x, center_y), radius, (34, 139, 34), -1)
    
    return img


def calculate_green_score(image):
    """Calculate green score using OpenCV (0-100 scale)"""
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Define range for green color in HSV
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    
    # Create mask for green pixels
    mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Calculate percentage of green pixels
    green_pixels = np.count_nonzero(mask)
    total_pixels = image.shape[0] * image.shape[1]
    
    green_percentage = (green_pixels / total_pixels) * 100
    
    return min(int(green_percentage), 100)


def detect_characteristics(image, area_m2):
    """Detect zone characteristics"""
    tags = []
    
    # Analyze brightness for solar exposure
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray)
    
    if avg_brightness > 180:
        tags.append("Alta radiación solar")
    elif avg_brightness > 120:
        tags.append("Buena exposición solar")
    else:
        tags.append("Zona de sombra")
    
    # Detect existing vegetation
    green_score = calculate_green_score(image)
    if green_score < 10:
        tags.append("Sin vegetación previa")
    elif green_score < 30:
        tags.append("Vegetación escasa")
    else:
        tags.append("Vegetación existente")
    
    # Detect surface type (mock - in production use real detection)
    if area_m2 < 50:
        tags.append("Espacio pequeño")
    elif area_m2 < 200:
        tags.append("Espacio mediano")
    else:
        tags.append("Espacio amplio")
    
    return tags


def recommend_species_detailed(tags, area_m2):
    """Recommend species based on analysis"""
    species = []
    
    has_sun = any("solar" in tag.lower() for tag in tags)
    has_shade = any("sombra" in tag.lower() for tag in tags)
    is_small = area_m2 < 50
    
    if has_sun:
        species.append({
            "nombre_comun": "Lavanda",
            "nombre_cientifico": "Lavandula angustifolia",
            "tipo": "Aromática",
            "viabilidad": 0.95,
            "razon": "Excelente para zonas soleadas, bajo mantenimiento"
        })
        species.append({
            "nombre_comun": "Romero",
            "nombre_cientifico": "Rosmarinus officinalis",
            "tipo": "Aromática",
            "viabilidad": 0.92,
            "razon": "Resiste sequía, ideal para pleno sol"
        })
    
    if has_shade or not has_sun:
        species.append({
            "nombre_comun": "Helecho",
            "nombre_cientifico": "Nephrolepis exaltata",
            "tipo": "Ornamental",
            "viabilidad": 0.88,
            "razon": "Se adapta bien a zonas de sombra"
        })
    
    if not is_small:
        species.append({
            "nombre_comun": "Olivo",
            "nombre_cientifico": "Olea europaea",
            "tipo": "Árbol",
            "viabilidad": 0.85,
            "razon": "Árbol resistente para espacios amplios"
        })
    
    # Add generic recommendations
    species.append({
        "nombre_comun": "Sedum",
        "nombre_cientifico": "Sedum spp.",
        "tipo": "Suculenta",
        "viabilidad": 0.90,
        "razon": "Bajo mantenimiento, resistente"
    })
    
    return species[:5]  # Return top 5


def generate_recommendations(tags, area_m2):
    """Generate maintenance recommendations"""
    recommendations = []
    
    recommendations.append("Preparar sustrato con drenaje adecuado")
    
    if area_m2 < 50:
        recommendations.append("Sistema de riego por goteo recomendado")
    else:
        recommendations.append("Considerar sistema de riego automático")
    
    if any("solar" in tag.lower() for tag in tags):
        recommendations.append("Usar mulch para retener humedad")
        recommendations.append("Riego temprano en la mañana o tarde")
    
    if area_m2 > 100:
        recommendations.append("Dividir en zonas para mantenimiento progresivo")
    
    recommendations.append("Fertilización orgánica cada 2-3 meses")
    
    return recommendations


def analyze_zone(polygon):
    """Main analysis function"""
    start_time = time.time()
    
    try:
        # Calculate metrics
        area_m2 = calculate_area_m2(polygon)
        perimetro_m = calculate_perimeter_m(polygon)
        
        # Generate mock satellite image
        image = generate_mock_satellite_image(area_m2)
        
        # Calculate green score
        green_score = calculate_green_score(image)
        
        # Detect characteristics
        tags = detect_characteristics(image, area_m2)
        
        # Recommend species
        especies = recommend_species_detailed(tags, area_m2)
        
        # Generate recommendations
        recomendaciones = generate_recommendations(tags, area_m2)
        
        processing_time = time.time() - start_time
        
        return {
            'success': True,
            'green_score': green_score,
            'area_m2': round(area_m2, 2),
            'perimetro_m': round(perimetro_m, 2),
            'tags': tags,
            'especies_recomendadas': especies,
            'recomendaciones': recomendaciones,
            'processing_time': round(processing_time, 2)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'processing_time': time.time() - start_time
        }


def handler(event, context):
    """Vercel serverless function handler"""
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    # Handle POST request
    if event.get('httpMethod') == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            polygon = body.get('polygon')
            
            if not polygon:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Missing polygon data'
                    })
                }
            
            # Analyze zone
            result = analyze_zone(polygon)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result)
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': str(e)
                })
            }
    
    # Unsupported method
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': False,
            'error': 'Method not allowed'
        })
    }