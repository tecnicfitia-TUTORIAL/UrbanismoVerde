"""
Inspection API Endpoints
Handles rooftop inspection requests with Gemini Vision
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import logging

from services.rooftop_vision_service import (
    analyze_rooftop_image,
    analyze_batch_rooftops
)

logger = logging.getLogger(__name__)

router = APIRouter()


class RooftopAnalysisRequest(BaseModel):
    """Request model for single rooftop analysis"""
    imageUrl: str = Field(..., description="URL of satellite image to analyze")
    coordinates: Optional[Dict] = Field(None, description="GeoJSON coordinates of rooftop")
    area_m2: Optional[float] = Field(100, description="Area in square meters")
    orientacion: Optional[str] = Field("sur", description="Orientation (norte, sur, este, oeste)")


class BatchAnalysisRequest(BaseModel):
    """Request model for batch rooftop analysis"""
    rooftops: List[RooftopAnalysisRequest] = Field(..., description="List of rooftops to analyze")


@router.post("/analyze")
async def analyze_single_rooftop(request: RooftopAnalysisRequest):
    """
    Analyze a single rooftop using Gemini Vision
    
    Returns:
        Analysis results including roof type, condition, obstructions, etc.
    """
    try:
        logger.info(f"📥 Received analysis request for image: {request.imageUrl[:50]}...")
        
        result = await analyze_rooftop_image(
            image_url=request.imageUrl,
            area_m2=request.area_m2 or 100,
            orientacion=request.orientacion or "sur"
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


@router.post("/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """
    Analyze multiple rooftops in batch using Gemini Vision
    
    Returns:
        List of analysis results for all rooftops
    """
    try:
        rooftops_data = [r.model_dump() for r in request.rooftops]
        logger.info(f"📥 Received batch analysis request for {len(rooftops_data)} rooftops")
        
        results = await analyze_batch_rooftops(rooftops_data)
        
        logger.info(f"✅ Batch analysis completed: {len(results)} rooftops")
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"❌ Error in batch analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.get("/test")
async def test_ai_service():
    """
    Test endpoint to verify AI service is working
    """
    import os
    import sys
    
    google_api_key = os.getenv("GOOGLE_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    vision_provider = os.getenv("VISION_PROVIDER", "gemini")
    
    try:
        import google.generativeai as genai
        library_available = True
        library_version = "google-generativeai"
    except ImportError:
        library_available = False
        library_version = 'not installed'
    
    return {
        "status": "ok" if google_api_key else "error",
        "message": "Gemini service ready" if google_api_key else "GOOGLE_API_KEY not configured",
        "provider": vision_provider,
        "model_name": gemini_model,
        "api_key_configured": bool(google_api_key),
        "library_available": library_available,
        "library_version": library_version,
        "python_version": sys.version,
        "configuration": {
            "temperature": 0.4,
            "max_tokens": 2048
        }
    }
