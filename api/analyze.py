import cv2
import json
import numpy as np
from shapely.geometry import shape


def calculate_area(polygon):
    return shape(polygon).area


def calculate_perimeter(polygon):
    return shape(polygon).length


def calculate_centroid(polygon):
    return shape(polygon).centroid.x, shape(polygon).centroid.y


def get_satellite_image(polygon):
    # Mock function to return a satellite image
    return "mock_image_data"


def calculate_green_index(image):
    # Example using OpenCV to calculate a green index
    green_channel = image[:, :, 1]  # Assuming BGR format
    red_channel = image[:, :, 2]
    return cv2.divide(green_channel, (green_channel + red_channel + 1e-6))  # Avoid division by zero


def detect_tags(image):
    # Dummy implementation for tag detection
    return ["tree", "bush"]


def recommend_species(tags):
    species_dict = {
        "tree": ["Oak", "Maple"],
        "bush": ["Rose", "Lilac"]
    }
    recommendations = []
    for tag in tags:
        recommendations.extend(species_dict.get(tag, []))
    return recommendations


def generate_recommendations(polygon):
    area = calculate_area(polygon)
    perimeter = calculate_perimeter(polygon)
    centroid = calculate_centroid(polygon)
    image_data = get_satellite_image(polygon)
    green_index = calculate_green_index(image_data)
    tags = detect_tags(image_data)
    species = recommend_species(tags)

    return json.dumps({
        'area': area,
        'perimeter': perimeter,
        'centroid': centroid,
        'green_index': green_index.tolist() if isinstance(green_index, np.ndarray) else green_index,
        'recommended_species': species
    })


def handler(event, context):
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS'}
        }
    elif event['httpMethod'] == 'POST':
        body = json.loads(event['body'])
        polygon = body.get('polygon')
        analysis_result = generate_recommendations(polygon)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': analysis_result
        }
    return {
        'statusCode': 400,
        'body': 'Unsupported method'
    }