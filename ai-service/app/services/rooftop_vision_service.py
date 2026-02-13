"""
Rooftop Vision Service - AI-powered rooftop analysis using GPT-4 Vision
"""
import json
import os
from typing import Dict, List, Any
import base64
import requests
from io import BytesIO

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai package not installed. AI analysis will use fallback mode.")

# Initialize OpenAI client if available
if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
else:
    client = None


async def analyze_rooftop_from_image(image_url: str, coordinates: dict) -> dict:
    """
    Analyze rooftop characteristics from satellite image using GPT-4 Vision
    
    Args:
        image_url: URL of the satellite image
        coordinates: GeoJSON coordinates of the rooftop
        
    Returns:
        dict: Analysis results including roof type, condition, slope, obstructions, etc.
    """
    
    # If OpenAI is not available, return fallback analysis
    if not client:
        return get_fallback_analysis()
    
    prompt = """
    Eres un experto en análisis de cubiertas y tejados. Analiza esta imagen satelital de un tejado y proporciona:
    
    1. **tipo_cubierta**: Clasifica como "plana", "inclinada" o "mixta"
       - Plana: ángulo < 10°, superficie horizontal
       - Inclinada: ángulo > 10°, pendiente visible
       - Mixta: combinación de ambas
    
    2. **estado_conservacion**: Evalúa como "excelente", "bueno", "regular", "malo" o "muy_malo"
       - Excelente: Sin daños visibles, color uniforme
       - Bueno: Pequeñas marcas, generalmente buen estado
       - Regular: Decoloración notable, posibles grietas
       - Malo: Daños evidentes, manchas extensas
       - Muy malo: Daños graves, vegetación invasiva
    
    3. **inclinacion_estimada**: Estima el ángulo en grados (0-45)
    
    4. **obstrucciones**: Lista de elementos visibles como:
       - Chimeneas
       - Unidades de aire acondicionado
       - Antenas
       - Paneles solares existentes
       - Vegetación
       - Escotillas
       - Otros elementos
    
    5. **confianza**: Tu nivel de confianza en el análisis (0-100)
    
    6. **notas_ia**: Observaciones adicionales relevantes
    
    Responde SOLO con un JSON válido en este formato exacto:
    {
      "tipo_cubierta": "plana",
      "estado_conservacion": "bueno",
      "inclinacion_estimada": 5,
      "obstrucciones": [
        {"tipo": "chimenea", "descripcion": "1 chimenea metálica en esquina norte"},
        {"tipo": "ac", "descripcion": "2 unidades AC en lado este"}
      ],
      "confianza": 85,
      "notas_ia": "Tejado plano en buen estado general. Superficie limpia sin vegetación. Ideal para instalación de cubierta verde."
    }
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        # Extract JSON from markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        result = json.loads(content)
        
        # Validate required fields
        required_fields = ["tipo_cubierta", "estado_conservacion", "inclinacion_estimada", "obstrucciones", "confianza", "notas_ia"]
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")
        
        return result
        
    except Exception as e:
        print(f"Error analyzing rooftop: {e}")
        # Return default fallback
        return {
            "tipo_cubierta": "desconocido",
            "estado_conservacion": "bueno",
            "inclinacion_estimada": 0,
            "obstrucciones": [],
            "confianza": 0,
            "notas_ia": f"Error en análisis automático: {str(e)}. Requiere inspección manual.",
            "error": str(e)
        }


def get_fallback_analysis() -> dict:
    """
    Provide fallback analysis when OpenAI is not available
    """
    return {
        "tipo_cubierta": "plana",
        "estado_conservacion": "bueno",
        "inclinacion_estimada": 5,
        "obstrucciones": [],
        "confianza": 50,
        "notas_ia": "Análisis básico sin IA. Requiere revisión manual para mayor precisión."
    }


async def batch_analyze_rooftops(rooftops: List[dict]) -> List[dict]:
    """
    Analyze multiple rooftops in batch
    
    Args:
        rooftops: List of rooftop data dicts, each containing:
            - imageUrl: URL of satellite image
            - coordinates: GeoJSON coordinates
            - area_m2: Area in square meters
            - orientacion: Cardinal orientation
            
    Returns:
        List[dict]: Analysis results for each rooftop
    """
    results = []
    
    for idx, rooftop in enumerate(rooftops):
        print(f"Analyzing rooftop {idx + 1}/{len(rooftops)}...")
        
        result = await analyze_rooftop_from_image(
            image_url=rooftop.get('imageUrl', ''),
            coordinates=rooftop.get('coordinates', {})
        )
        
        # Merge rooftop data with analysis result
        results.append({
            **rooftop,
            **result
        })
    
    return results
