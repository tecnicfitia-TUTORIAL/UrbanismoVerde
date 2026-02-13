"""
Rooftop Vision Analysis Service using Google Gemini
Replaces OpenAI GPT-4 Vision with Google Gemini API
"""

import google.generativeai as genai
import os
import json
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("✅ Gemini API configured")
else:
    logger.warning("⚠️ GOOGLE_API_KEY not set - AI features will not work")


ANALYSIS_PROMPT = """
Eres un experto en análisis de cubiertas y tejados para proyectos de infraestructura verde urbana.

Analiza esta imagen satelital de un tejado y proporciona un análisis técnico detallado.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones adicionales) con esta estructura exacta:

{
  "tipo_cubierta": "plana" | "inclinada" | "mixta",
  "estado_conservacion": "excelente" | "bueno" | "regular" | "malo" | "muy_malo",
  "inclinacion_estimada": número entre 0-45,
  "obstrucciones": [
    {"tipo": "chimenea" | "ac" | "antena" | "vegetacion" | "solar" | "otro", "descripcion": "descripción breve"}
  ],
  "confianza": número entre 0-100,
  "notas_ia": "observaciones técnicas relevantes"
}

Criterios de evaluación:

1. **tipo_cubierta**:
   - "plana": ángulo < 10°, superficie mayormente horizontal
   - "inclinada": ángulo > 10°, pendiente claramente visible
   - "mixta": combinación de secciones planas e inclinadas

2. **estado_conservacion**:
   - "excelente": sin daños visibles, superficie uniforme y limpia
   - "bueno": pequeñas marcas o decoloración menor, estructuralmente sano
   - "regular": decoloración notable, posibles grietas menores, necesita mantenimiento
   - "malo": daños evidentes, grietas, manchas extensas, requiere reparación
   - "muy_malo": daños graves, vegetación invasiva, deterioro estructural

3. **inclinacion_estimada**: Ángulo en grados (0° = totalmente plano, 45° = muy inclinado)

4. **obstrucciones**: Lista detallada de todos los elementos visibles que podrían afectar la instalación de infraestructura verde

5. **confianza**: Tu nivel de certeza en el análisis (0-100%):
   - 90-100: imagen clara, análisis muy confiable
   - 70-89: buena visibilidad, análisis confiable
   - 50-69: visibilidad moderada, análisis con reservas
   - 0-49: imagen poco clara, análisis poco confiable

6. **notas_ia**: Observaciones adicionales sobre viabilidad para techos verdes, paneles solares, o mejoras ambientales

Sé preciso, técnico y objetivo en tu evaluación.
"""


async def analyze_rooftop_from_image(
    image_url: str,
    coordinates: Optional[Dict] = None
) -> Dict:
    """
    Analyze rooftop characteristics from satellite image using Gemini Vision
    
    Args:
        image_url: URL of the satellite image to analyze
        coordinates: Optional GeoJSON coordinates of the rooftop
    
    Returns:
        Dict with analysis results including tipo_cubierta, estado_conservacion, etc.
    """
    
    if not GOOGLE_API_KEY:
        logger.error("❌ GOOGLE_API_KEY not configured")
        return _fallback_response("API key not configured")
    
    try:
        logger.info(f"🔍 Analyzing rooftop image with Gemini Vision")
        
        # Initialize Gemini model with specific version
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # For Gemini API, we need to pass the image URL directly in a different format
        # Using the proper format for image URLs
        import requests
        from PIL import Image
        from io import BytesIO
        
        # Download image from URL
        response_img = requests.get(image_url, timeout=30)
        response_img.raise_for_status()
        img = Image.open(BytesIO(response_img.content))
        
        # Generate content with image and prompt
        response = model.generate_content([
            ANALYSIS_PROMPT,
            img
        ])
        
        # Extract and clean response
        content = response.text
        logger.info(f"📄 Raw Gemini response: {content[:200]}...")
        
        # Remove markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        result = json.loads(content)
        
        # Validate required fields
        required_fields = [
            "tipo_cubierta",
            "estado_conservacion",
            "inclinacion_estimada",
            "obstrucciones",
            "confianza",
            "notas_ia"
        ]
        
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate field types and values
        if result["confianza"] < 0 or result["confianza"] > 100:
            result["confianza"] = max(0, min(100, result["confianza"]))
        
        if result["inclinacion_estimada"] < 0 or result["inclinacion_estimada"] > 45:
            result["inclinacion_estimada"] = max(0, min(45, result["inclinacion_estimada"]))
        
        logger.info(f"✅ Analysis completed successfully (confidence: {result['confianza']}%)")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing error: {e}")
        logger.error(f"Response content: {content}")
        return _fallback_response(f"JSON parsing error: {str(e)}")
        
    except Exception as e:
        logger.error(f"❌ Error analyzing rooftop: {e}")
        return _fallback_response(str(e))


async def batch_analyze_rooftops(rooftops: List[Dict]) -> List[Dict]:
    """
    Analyze multiple rooftops in batch
    
    Args:
        rooftops: List of dicts with 'imageUrl' and other rooftop data
    
    Returns:
        List of dicts with original data + analysis results
    """
    results = []
    total = len(rooftops)
    
    logger.info(f"🔄 Starting batch analysis of {total} rooftops")
    
    for idx, rooftop in enumerate(rooftops, 1):
        logger.info(f"🔍 Analyzing rooftop {idx}/{total}...")
        
        analysis = await analyze_rooftop_from_image(
            image_url=rooftop.get('imageUrl'),
            coordinates=rooftop.get('coordinates')
        )
        
        results.append({
            **rooftop,
            **analysis
        })
    
    logger.info(f"✅ Batch analysis completed: {total} rooftops")
    return results


def _fallback_response(error_message: str) -> Dict:
    """
    Generate fallback response when AI analysis fails
    """
    return {
        "tipo_cubierta": "desconocido",
        "estado_conservacion": "bueno",
        "inclinacion_estimada": 0,
        "obstrucciones": [],
        "confianza": 20,
        "notas_ia": f"Análisis automático no disponible: {error_message}. Se requiere inspección manual.",
        "error": error_message,
        "fallback": True
    }
