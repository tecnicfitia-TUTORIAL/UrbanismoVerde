"""
Vertex AI Service for Gemini Vision Analysis
Uses Google Cloud Vertex AI instead of google-generativeai
"""

import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig
import os
import logging
import asyncio
from typing import Dict

logger = logging.getLogger(__name__)

# Configuración de Vertex AI
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'ecourbe-ai')
LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-flash')

logger.info("🔧 Initializing Vertex AI...")
logger.info(f"   Project: {PROJECT_ID}")
logger.info(f"   Location: {LOCATION}")
logger.info(f"   Model: {MODEL_NAME}")

# Inicializar Vertex AI
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    logger.info("✅ Vertex AI initialized successfully")
except Exception as e:
    logger.error(f"❌ Error initializing Vertex AI: {e}")
    logger.error(f"   This will cause all vision requests to fail")


def _analyze_rooftop_sync(image_bytes: bytes, prompt: str) -> Dict:
    """
    Synchronous function to analyze image with Vertex AI
    
    Args:
        image_bytes: Bytes de la imagen
        prompt: Prompt para el análisis
        
    Returns:
        Dict con el resultado del análisis
    """
    try:
        logger.info(f"🤖 Creating GenerativeModel with: {MODEL_NAME}")
        
        # Crear modelo
        model = GenerativeModel(MODEL_NAME)
        
        # Configuración de generación
        generation_config = GenerationConfig(
            temperature=0.4,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )
        
        # Crear parte de imagen
        image_part = Part.from_data(
            mime_type="image/jpeg",
            data=image_bytes
        )
        
        logger.info(f"📤 Sending request to Vertex AI...")
        
        # Generar contenido (blocking call)
        response = model.generate_content(
            [image_part, prompt],
            generation_config=generation_config
        )
        
        # Procesar respuesta
        result_text = response.text
        logger.info(f"✅ Vertex AI analysis completed successfully")
        logger.info(f"   Response length: {len(result_text)} characters")
        
        return {
            "success": True,
            "result": result_text,
            "model": MODEL_NAME,
            "location": LOCATION
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Error in Vertex AI analysis: {error_msg}")
        logger.error(f"   Model: {MODEL_NAME}")
        logger.error(f"   Location: {LOCATION}")
        logger.error(f"   Project: {PROJECT_ID}")
        
        return {
            "success": False,
            "error": error_msg,
            "model": MODEL_NAME,
            "location": LOCATION
        }


async def analyze_rooftop_with_vertex_ai(image_bytes: bytes, prompt: str) -> Dict:
    """
    Analizar imagen de cubierta usando Vertex AI Gemini (async wrapper)
    
    Args:
        image_bytes: Bytes de la imagen
        prompt: Prompt para el análisis
        
    Returns:
        Dict con el resultado del análisis
    """
    # Run the synchronous Vertex AI call in a thread pool to avoid blocking the event loop
    return await asyncio.to_thread(_analyze_rooftop_sync, image_bytes, prompt)
