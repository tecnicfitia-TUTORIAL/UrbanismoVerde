"""
Rooftop Vision Analysis Service using Google Generative AI with Gemini 2.5
"""

import os
import json
import logging
import httpx
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GEMINI_MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-2.5-flash')
VISION_PROVIDER = os.getenv('VISION_PROVIDER', 'gemini')

# Solo importar y configurar si tenemos API key
if GOOGLE_API_KEY and VISION_PROVIDER == 'gemini':
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info("✅ Gemini API configured")
        logger.info(f"   Model: {GEMINI_MODEL_NAME}")
        logger.info(f"   Provider: {VISION_PROVIDER}")
    except Exception as e:
        logger.error(f"❌ Error configuring Gemini API: {e}")
        GOOGLE_API_KEY = None
else:
    logger.warning("⚠️ Gemini not configured - using fallback responses")

# Allowed URL schemes and domains
ALLOWED_SCHEMES = ['https']
ALLOWED_DOMAINS = [
    'maps.googleapis.com',
    'maps.gstatic.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'supabase.co',
    'wxxztdpkwbyvggpwqdgx.supabase.co'
]


def validate_image_url(url: str) -> bool:
    """Validate image URL for security"""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ALLOWED_SCHEMES:
            logger.warning(f"⚠️ Scheme not allowed: {parsed.scheme}")
            return False
        if not any(domain in parsed.netloc for domain in ALLOWED_DOMAINS):
            logger.warning(f"⚠️ Domain not allowed: {parsed.netloc}")
            return False
        return True
    except Exception as e:
        logger.error(f"❌ Error validating URL: {e}")
        return False


async def download_image(url: str) -> Optional[bytes]:
    """Download image from URL"""
    try:
        if not validate_image_url(url):
            raise ValueError(f"Invalid image URL: {url}")
        
        logger.info(f"📥 Downloading image from: {url[:80]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            image_bytes = response.content
            logger.info(f"✅ Image downloaded: {len(image_bytes)} bytes")
            
            return image_bytes
            
    except Exception as e:
        logger.error(f"❌ Error downloading image: {e}")
        return None


def clean_json_response(text: str) -> str:
    """
    Limpiar respuesta de Gemini para extraer JSON válido
    
    Gemini puede devolver:
    - JSON puro: {"key": "value"}
    - JSON con markdown: ```json\n{"key": "value"}\n```
    - Texto + JSON: "Aquí está:\n```json\n{...}\n```"
    """
    try:
        # 1. Buscar JSON dentro de bloques markdown
        json_block_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_block_match:
            return json_block_match.group(1).strip()
        
        # 2. Buscar JSON sin bloques
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()
        
        # 3. Si no se encuentra, devolver original
        return text.strip()
        
    except Exception as e:
        logger.warning(f"⚠️ Error cleaning JSON: {e}")
        return text


async def analyze_rooftop_image(
    image_url: str,
    area_m2: float,
    orientacion: str
) -> Dict:
    """Analyze rooftop image using Gemini Vision"""
    
    if not GOOGLE_API_KEY:
        logger.warning("⚠️ No API key configured")
        return {
            "tipo_cubierta": "desconocido",
            "estado_conservacion": "bueno",
            "inclinacion_estimada": 0,
            "obstrucciones": [],
            "confianza": 20,
            "notas_ia": "API key not configured",
            "error": "API key not configured",
            "fallback": True
        }
    
    try:
        logger.info("🔍 Analyzing rooftop with Gemini")
        logger.info(f"   Model: {GEMINI_MODEL_NAME}")
        
        image_bytes = await download_image(image_url)
        if not image_bytes:
            raise ValueError("Failed to download image")
        
        logger.info(f"✅ Downloaded: {len(image_bytes)} bytes")
        logger.info("🤖 Sending to Gemini...")
        
        import google.generativeai as genai
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        
        prompt = f"""Analiza esta cubierta y responde SOLO con JSON válido (sin markdown):

{{
  "tipo_cubierta": "plana|inclinada|mixta",
  "estado": "excelente|bueno|regular|malo",
  "inclinacion": 0-45,
  "obstrucciones": [{{"tipo": "ac|antena|chimenea|otro", "descripcion": "..."}}],
  "confianza": 0-100,
  "notas": "Análisis detallado"
}}

Área: {area_m2} m², Orientación: {orientacion}"""
        
        response = model.generate_content([
            {"mime_type": "image/jpeg", "data": image_bytes},
            prompt
        ])
        
        result_text = response.text
        logger.info(f"✅ Response: {len(result_text)} chars")
        logger.info(f"📄 Preview: {result_text[:150]}...")
        
        try:
            clean_text = clean_json_response(result_text)
            logger.info(f"🧹 Cleaned: {clean_text[:150]}...")
            
            analysis = json.loads(clean_text)
            
            return {
                "tipo_cubierta": analysis.get("tipo_cubierta", "desconocido"),
                "estado_conservacion": analysis.get("estado", "desconocido"),
                "inclinacion_estimada": int(analysis.get("inclinacion", 0)),
                "obstrucciones": analysis.get("obstrucciones", []),
                "confianza": int(analysis.get("confianza", 50)),
                "notas_ia": analysis.get("notas", result_text[:500])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON error: {e}")
            logger.error(f"📄 Text: {result_text}")
            
            return {
                "tipo_cubierta": "desconocido",
                "estado_conservacion": "bueno",
                "inclinacion_estimada": 0,
                "obstrucciones": [],
                "confianza": 30,
                "notas_ia": f"Parse error. Raw: {result_text[:500]}",
                "error": f"JSON parse: {str(e)}",
                "raw_response": result_text
            }
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        
        return {
            "tipo_cubierta": "desconocido",
            "estado_conservacion": "bueno",
            "inclinacion_estimada": 0,
            "obstrucciones": [],
            "confianza": 20,
            "notas_ia": f"Error: {e}",
            "error": str(e),
            "fallback": True
        }


async def analyze_batch_rooftops(rooftops: List[Dict]) -> List[Dict]:
    """Analyze multiple rooftops"""
    logger.info(f"🔄 Batch: {len(rooftops)} rooftops")
    
    results = []
    for i, rooftop in enumerate(rooftops, 1):
        logger.info(f"🔍 {i}/{len(rooftops)}...")
        
        result = await analyze_rooftop_image(
            image_url=rooftop.get("imageUrl"),
            area_m2=rooftop.get("area_m2", 100),
            orientacion=rooftop.get("orientacion", "sur")
        )
        
        results.append({**rooftop, **result})
    
    logger.info(f"✅ Completed: {len(results)} rooftops")
    return results
