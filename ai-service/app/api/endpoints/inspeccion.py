"""
Inspection endpoints for rooftop analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.rooftop_vision_service import analyze_rooftop_from_image, batch_analyze_rooftops

router = APIRouter(prefix="/api/inspecciones", tags=["inspecciones"])


class RooftopAnalysisRequest(BaseModel):
    """Request model for single rooftop analysis"""
    coordinates: dict = Field(..., description="GeoJSON Polygon coordinates")
    imageUrl: str = Field(..., description="URL of satellite image")
    area_m2: float = Field(..., description="Area in square meters")
    orientacion: str = Field(..., description="Cardinal orientation")


class BatchAnalysisRequest(BaseModel):
    """Request model for batch rooftop analysis"""
    rooftops: List[RooftopAnalysisRequest] = Field(..., description="List of rooftops to analyze")


class AnalysisResponse(BaseModel):
    """Response model for rooftop analysis"""
    tipo_cubierta: str
    estado_conservacion: str
    inclinacion_estimada: float
    obstrucciones: List[Dict[str, str]]
    confianza: int
    notas_ia: str
    error: Optional[str] = None


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_single_rooftop(request: RooftopAnalysisRequest):
    """
    Analyze a single rooftop with AI
    
    Uses GPT-4 Vision to analyze satellite imagery and detect:
    - Roof type (flat/sloped/mixed)
    - Condition (excellent/good/fair/poor/very poor)
    - Estimated slope angle
    - Obstructions (chimneys, AC units, antennas, etc.)
    - Confidence level
    """
    try:
        result = await analyze_rooftop_from_image(
            image_url=request.imageUrl,
            coordinates=request.coordinates
        )
        
        # Merge request data with analysis result
        return {
            "coordinates": request.coordinates,
            "imageUrl": request.imageUrl,
            "area_m2": request.area_m2,
            "orientacion": request.orientacion,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing rooftop: {str(e)}")


@router.post("/analyze-batch")
async def analyze_batch_rooftops(request: BatchAnalysisRequest):
    """
    Analyze multiple rooftops in batch
    
    Processes multiple rooftops efficiently, ideal for bulk operations.
    Returns analysis results for all rooftops.
    """
    try:
        rooftops_data = [r.dict() for r in request.rooftops]
        results = await batch_analyze_rooftops(rooftops_data)
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")
