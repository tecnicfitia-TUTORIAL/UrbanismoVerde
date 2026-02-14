"""
Vertex AI Service for Gemini Vision Analysis
Uses Google Cloud Vertex AI instead of google-generativeai
"""

import vertexai
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Configuración de Vertex AI
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'ecourbe-ai')
LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'europe-west9')
MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-flash-001')

# Inicializar Vertex AI
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    logger.info("✅ Vertex AI initialized")
    logger.info(f"   Project: {PROJECT_ID}")
    logger.info(f"   Location: {LOCATION}")
    logger.info(f"   Model: {MODEL_NAME}")
except Exception as e:
    logger.error(f"❌ Error initializing Vertex AI: {e}")


async def analyze_rooftop_with_vertex_ai(
    image_bytes: bytes,
    prompt: str
) -> Dict:
    """
    Analizar imagen de cubierta usando Vertex AI Gemini
    
    Args:
        image_bytes: Bytes de la imagen
        prompt: Prompt para el análisis
        
    Returns:
        Dict con el resultado del análisis
    """
    try:
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
        
        # Generar contenido
        response = model.generate_content(
            [image_part, prompt],
            generation_config=generation_config
        )
        
        # Procesar respuesta
        result_text = response.text
        logger.info(f"✅ Vertex AI analysis completed")
        
        return {
            "success": True,
            "result": result_text,
            "model": MODEL_NAME
        }
        
    except Exception as e:
        logger.error(f"❌ Error in Vertex AI analysis: {e}")
        return {
            "success": False,
            "error": str(e),
            "model": MODEL_NAME
        }
