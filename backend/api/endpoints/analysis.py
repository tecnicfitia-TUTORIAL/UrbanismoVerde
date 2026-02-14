"""
Urban Analysis API Endpoints
Handles automatic area analysis for green roof opportunities
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Optional
import logging

from services.urban_analysis_engine import UrbanAnalysisEngine

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize analysis engine
engine = UrbanAnalysisEngine()


class AnalyzeAreaRequest(BaseModel):
    """Request model for area analysis"""
    north: float = Field(..., description="North boundary latitude", ge=-90, le=90)
    south: float = Field(..., description="South boundary latitude", ge=-90, le=90)
    east: float = Field(..., description="East boundary longitude", ge=-180, le=180)
    west: float = Field(..., description="West boundary longitude", ge=-180, le=180)


class AnalyzeAreaResponse(BaseModel):
    """Response model for area analysis"""
    success: bool = Field(..., description="Whether analysis was successful")
    report: Optional[Dict] = Field(None, description="Analysis report")
    error: Optional[str] = Field(None, description="Error message if failed")


@router.post("/analyze-area", response_model=AnalyzeAreaResponse)
async def analyze_area(request: AnalyzeAreaRequest):
    """
    Analyze an urban area for green roof and reforestation opportunities
    
    Args:
        request: Bounding box coordinates (north, south, east, west)
    
    Returns:
        Analysis report with opportunities, costs, and CO₂ impact
    """
    try:
        logger.info(f"📥 Received area analysis request")
        logger.info(f"   Bounds: N={request.north}, S={request.south}, E={request.east}, W={request.west}")
        
        # Validate bounds
        if request.north <= request.south:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bounds: north must be greater than south"
            )
        if request.east <= request.west:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bounds: east must be greater than west"
            )
        
        # Run analysis
        report = await engine.analyze_area(
            north=request.north,
            south=request.south,
            east=request.east,
            west=request.west
        )
        
        logger.info(f"✅ Analysis completed: {report['summary']['total_opportunities']} opportunities")
        
        return AnalyzeAreaResponse(
            success=True,
            report=report
        )
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        return AnalyzeAreaResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error in area analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/test")
async def test_analysis_service():
    """
    Test endpoint to verify analysis service is working
    """
    import os
    
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    return {
        "status": "ok" if google_api_key else "warning",
        "message": "Analysis service ready" if google_api_key else "GOOGLE_API_KEY not configured - using fallback",
        "service": "UrbanAnalysisEngine",
        "capabilities": [
            "Grid-based rooftop detection",
            "Gemini Vision analysis",
            "Viability scoring",
            "Cost estimation",
            "CO₂ impact calculation"
        ],
        "limits": {
            "max_area_km2": 5.0,
            "max_rooftops": 50,
            "grid_spacing_m": 100
        }
    }
