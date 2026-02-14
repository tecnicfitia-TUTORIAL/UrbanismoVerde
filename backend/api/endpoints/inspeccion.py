"""
Inspection API Endpoints
Handles rooftop inspection requests with Gemini Vision
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import logging

from services.rooftop_vision_service import (
    analyze_rooftop_from_image,
    batch_analyze_rooftops
)

logger = logging.getLogger(__name__)

router = APIRouter()


class RooftopAnalysisRequest(BaseModel):
    """Request model for single rooftop analysis"""
    imageUrl: str = Field(..., description="URL of satellite image to analyze")
    coordinates: Optional[Dict] = Field(None, description="GeoJSON coordinates of rooftop")
    area_m2: Optional[float] = Field(None, description="Area in square meters")
    orientacion: Optional[str] = Field(None, description="Orientation (Norte, Sur, Este, Oeste)")


class BatchAnalysisRequest(BaseModel):
    """Request model for batch rooftop analysis"""
    rooftops: List[RooftopAnalysisRequest] = Field(..., description="List of rooftops to analyze")


@router.post("/inspecciones/analyze")
async def analyze_single_rooftop(request: RooftopAnalysisRequest):
    """
    Analyze a single rooftop using Gemini Vision
    
    Returns:
        Analysis results including roof type, condition, obstructions, etc.
    """
    try:
        logger.info(f"📥 Received analysis request for image: {request.imageUrl[:50]}...")
        
        result = await analyze_rooftop_from_image(
            image_url=request.imageUrl,
            coordinates=request.coordinates
        )
        
        # Add original request data to response
        response = {
            **request.model_dump(),
            **result
        }
        
        logger.info(f"✅ Analysis completed: {result.get('tipo_cubierta')}, confidence: {result.get('confianza')}%")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error in single analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/inspecciones/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """
    Analyze multiple rooftops in batch using Gemini Vision
    
    Returns:
        List of analysis results for all rooftops
    """
    try:
        rooftops_data = [r.model_dump() for r in request.rooftops]
        logger.info(f"📥 Received batch analysis request for {len(rooftops_data)} rooftops")
        
        results = await batch_analyze_rooftops(rooftops_data)
        
        logger.info(f"✅ Batch analysis completed: {len(results)} rooftops")
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"❌ Error in batch analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.get("/inspecciones/test")
async def test_ai_service():
    """
    Test endpoint to verify Gemini AI service is working with comprehensive diagnostics
    """
    import os
    import sys
    
    try:
        import google.generativeai as genai
        genai_version = getattr(genai, '__version__', 'unknown')
        genai_available = True
    except ImportError:
        genai_version = 'not installed'
        genai_available = False
    
    google_api_configured = bool(os.getenv("GOOGLE_API_KEY"))
    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash-001")
    
    if not google_api_configured:
        return {
            "status": "error",
            "message": "GOOGLE_API_KEY not configured",
            "gemini_available": False,
            "vision_provider": os.getenv("VISION_PROVIDER", "gemini"),
            "model_name": model_name,
            "library_version": genai_version,
            "python_version": sys.version
        }
    
    return {
        "status": "ok",
        "message": "Gemini Vision AI service is ready",
        "gemini_available": genai_available,
        "vision_provider": os.getenv("VISION_PROVIDER", "gemini"),
        "model_name": model_name,
        "region": os.getenv("GOOGLE_CLOUD_REGION", "not configured"),
        "library_version": genai_version,
        "api_version": "v1",
        "python_version": sys.version,
        "configuration": {
            "temperature": 0.4,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048
        }
    }
