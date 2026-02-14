"""
Urban Analysis Engine - Automatic rooftop detection and analysis
Detects rooftops in a given area and analyzes them with Gemini Vision
"""

import logging
import math
from typing import Dict, List, Tuple, Optional
from datetime import datetime

from services.rooftop_vision_service import analyze_rooftop_image

logger = logging.getLogger(__name__)

# Constants for analysis
GRID_SPACING_M = 100  # Distance between sample points in meters
MAX_ROOFTOPS_PER_ANALYSIS = 50  # Limit to prevent timeout
MIN_AREA_M2 = 50  # Minimum rooftop area to consider
MAX_AREA_KM2 = 5.0  # Maximum area to analyze

# Cost and impact estimates
COST_PER_M2_EUR = 100  # €/m² for green roof installation
CO2_SAVINGS_PER_M2_KG_YEAR = 3  # kg CO₂/m²/year


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lng points using Haversine formula"""
    R = 6371000  # Earth radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def calculate_area_km2(north: float, south: float, east: float, west: float) -> float:
    """Calculate approximate area in km² of a rectangular region"""
    # Calculate width and height in meters
    center_lat = (north + south) / 2
    width_m = haversine_distance(center_lat, west, center_lat, east)
    height_m = haversine_distance(south, (west + east) / 2, north, (west + east) / 2)
    
    # Convert to km²
    area_km2 = (width_m * height_m) / 1_000_000
    return area_km2


def generate_grid_points(north: float, south: float, east: float, west: float, 
                         spacing_m: int = GRID_SPACING_M) -> List[Tuple[float, float]]:
    """Generate a grid of lat/lng points for sampling rooftops"""
    points = []
    
    # Calculate approximate degrees per meter
    center_lat = (north + south) / 2
    lat_per_m = 1 / 111320  # Roughly 111.32 km per degree latitude
    lon_per_m = 1 / (111320 * math.cos(math.radians(center_lat)))
    
    # Calculate grid spacing in degrees
    lat_spacing = spacing_m * lat_per_m
    lon_spacing = spacing_m * lon_per_m
    
    # Generate grid
    current_lat = south
    while current_lat <= north:
        current_lon = west
        while current_lon <= east:
            points.append((current_lat, current_lon))
            current_lon += lon_spacing
        current_lat += lat_spacing
    
    return points


def estimate_rooftop_viability(
    tipo_cubierta: str,
    estado_conservacion: str,
    obstrucciones: List[Dict],
    confianza: int
) -> int:
    """Calculate viability score (0-100) based on rooftop characteristics"""
    score = 50  # Base score
    
    # Roof type bonus
    if tipo_cubierta == "plana":
        score += 30
    elif tipo_cubierta == "inclinada":
        score += 10
    
    # Condition bonus
    if estado_conservacion == "excelente":
        score += 20
    elif estado_conservacion == "bueno":
        score += 10
    elif estado_conservacion == "regular":
        score -= 10
    elif estado_conservacion == "malo":
        score -= 30
    
    # Obstructions penalty
    obstruction_penalty = len(obstrucciones) * 5
    score -= obstruction_penalty
    
    # Confidence factor
    confidence_factor = (confianza / 100) * 0.2  # Max 20% adjustment
    score = int(score * (1 + confidence_factor - 0.1))  # Center around 1.0
    
    # Clamp to 0-100
    return max(0, min(100, score))


def generate_google_maps_static_url(lat: float, lng: float, zoom: int = 19, 
                                    size: str = "400x300") -> str:
    """Generate Google Maps Static API URL for a location"""
    # For MVP, we'll use a placeholder. In production, use Google Maps Static API
    # This would require an API key and proper implementation
    return f"https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&size={size}&maptype=satellite"


class UrbanAnalysisEngine:
    """Main engine for urban area analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def analyze_area(
        self,
        north: float,
        south: float,
        east: float,
        west: float
    ) -> Dict:
        """
        Analyze an urban area for green roof opportunities
        
        Args:
            north, south, east, west: Bounding box coordinates
            
        Returns:
            Urban analysis report with opportunities
        """
        try:
            self.logger.info(f"🔍 Starting area analysis: ({north},{south},{east},{west})")
            
            # Validate area size
            area_km2 = calculate_area_km2(north, south, east, west)
            self.logger.info(f"📏 Area size: {area_km2:.2f} km²")
            
            if area_km2 > MAX_AREA_KM2:
                raise ValueError(f"Area too large: {area_km2:.2f} km² (max: {MAX_AREA_KM2} km²)")
            
            # Generate sample points
            grid_points = generate_grid_points(north, south, east, west)
            self.logger.info(f"📍 Generated {len(grid_points)} sample points")
            
            # Limit points to prevent timeout
            if len(grid_points) > MAX_ROOFTOPS_PER_ANALYSIS:
                grid_points = grid_points[:MAX_ROOFTOPS_PER_ANALYSIS]
                self.logger.warning(f"⚠️ Limited to {MAX_ROOFTOPS_PER_ANALYSIS} points")
            
            # Analyze rooftops at each point
            green_roof_opportunities = []
            
            for i, (lat, lng) in enumerate(grid_points, 1):
                self.logger.info(f"🏢 Analyzing rooftop {i}/{len(grid_points)} at ({lat:.6f}, {lng:.6f})")
                
                # Generate image URL (placeholder for MVP)
                image_url = generate_google_maps_static_url(lat, lng)
                
                # Estimate area (simplified - would need proper detection)
                area_m2 = 100  # Default estimate for MVP
                orientacion = "sur"  # Default orientation
                
                # Analyze with Gemini Vision
                try:
                    analysis = await analyze_rooftop_image(
                        image_url=image_url,
                        area_m2=area_m2,
                        orientacion=orientacion
                    )
                    
                    # Calculate viability
                    viability_score = estimate_rooftop_viability(
                        tipo_cubierta=analysis.get("tipo_cubierta", "desconocido"),
                        estado_conservacion=analysis.get("estado_conservacion", "bueno"),
                        obstrucciones=analysis.get("obstrucciones", []),
                        confianza=analysis.get("confianza", 50)
                    )
                    
                    # Only include viable opportunities (score > 40)
                    if viability_score > 40:
                        opportunity = {
                            "id": f"roof_{i}_{int(lat * 1000000)}_{int(lng * 1000000)}",
                            "address": f"Aprox. {lat:.5f}, {lng:.5f}",
                            "coordinates": [lat, lng],
                            "area_m2": area_m2,
                            "viability_score": viability_score,
                            "roof_type": analysis.get("tipo_cubierta", "desconocido"),
                            "condition": analysis.get("estado_conservacion", "bueno"),
                            "obstructions": [obs.get("tipo", "otro") for obs in analysis.get("obstrucciones", [])],
                            "estimated_cost_eur": int(area_m2 * COST_PER_M2_EUR),
                            "co2_savings_kg_year": int(area_m2 * CO2_SAVINGS_PER_M2_KG_YEAR),
                            "image_url": image_url,
                            "ai_notes": analysis.get("notas_ia", "")
                        }
                        
                        green_roof_opportunities.append(opportunity)
                        self.logger.info(f"✅ Added opportunity: viability={viability_score}")
                    else:
                        self.logger.info(f"⏭️ Skipped: low viability ({viability_score})")
                        
                except Exception as e:
                    self.logger.error(f"❌ Error analyzing point {i}: {e}")
                    continue
            
            # Sort by viability score
            green_roof_opportunities.sort(key=lambda x: x["viability_score"], reverse=True)
            
            # Calculate summary
            total_opportunities = len(green_roof_opportunities)
            total_investment = sum(opp["estimated_cost_eur"] for opp in green_roof_opportunities)
            total_co2_impact = sum(opp["co2_savings_kg_year"] for opp in green_roof_opportunities)
            total_area = sum(opp["area_m2"] for opp in green_roof_opportunities)
            
            # Generate top priorities
            top_priorities = []
            if total_opportunities > 0:
                top_priorities.append(f"Techo con mayor viabilidad: {green_roof_opportunities[0]['viability_score']}%")
            if total_area > 0:
                top_priorities.append(f"Área verde potencial: {total_area:.0f} m²")
            if total_co2_impact > 0:
                top_priorities.append(f"Captura CO₂: {total_co2_impact:.0f} kg/año")
            
            # Build report
            report = {
                "area_name": f"Área urbana ({lat:.4f}, {lng:.4f})",
                "analysis_date": datetime.utcnow().isoformat(),
                "bounds": {
                    "north": north,
                    "south": south,
                    "east": east,
                    "west": west
                },
                "green_roofs": green_roof_opportunities,
                "reforestation": [],  # Placeholder for future implementation
                "summary": {
                    "total_opportunities": total_opportunities,
                    "total_investment_eur": total_investment,
                    "total_co2_impact_kg_year": total_co2_impact,
                    "total_green_area_m2": total_area,
                    "top_priorities": top_priorities
                }
            }
            
            self.logger.info(f"✅ Analysis complete: {total_opportunities} opportunities found")
            return report
            
        except Exception as e:
            self.logger.error(f"❌ Error in area analysis: {e}")
            raise
