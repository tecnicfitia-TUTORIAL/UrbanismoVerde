"""
Urban Analysis Engine - Automatic rooftop detection and analysis
Detects rooftops in a given area and analyzes them with Gemini Vision
"""

import os
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
                         grid_size: int = 5) -> List[Tuple[float, float]]:
    """Generate a fixed grid of lat/lng points for sampling rooftops
    
    Args:
        north, south, east, west: Bounding box coordinates
        grid_size: Number of points in each dimension (default: 5x5 = 25 points)
        
    Returns:
        List of (lat, lng) tuples representing grid points
    """
    points = []
    
    # Calculate step sizes
    lat_step = (north - south) / grid_size
    lng_step = (east - west) / grid_size
    
    # Generate grid with points at center of each cell
    for i in range(grid_size):
        for j in range(grid_size):
            lat = south + (lat_step * i) + (lat_step / 2)
            lng = west + (lng_step * j) + (lng_step / 2)
            points.append((lat, lng))
    
    logger.info(f"📍 Grid sampling: {grid_size}x{grid_size} = {len(points)} puntos")
    
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


class UrbanAnalysisEngine:
    """Main engine for urban area analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.google_maps_api_key = os.getenv('GOOGLE_API_KEY')
        
        # Validar que existe API key
        if not self.google_maps_api_key:
            logger.warning("⚠️ GOOGLE_API_KEY no configurada. Las imágenes no se descargarán.")
        else:
            logger.info("✅ Google Maps API key configurada")
    
    def _generate_satellite_image_url(self, lat: float, lng: float, zoom: int = 19, 
                                     size: str = "400x300") -> str:
        """Generate Google Maps Static API URL for a location with API key"""
        return (
            f"https://maps.googleapis.com/maps/api/staticmap"
            f"?center={lat},{lng}"
            f"&zoom={zoom}"
            f"&size={size}"
            f"&maptype=satellite"
            f"&key={self.google_maps_api_key}"
        )
    
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
            center_lat = (north + south) / 2
            center_lng = (east + west) / 2
            self.logger.info(f"🔍 Iniciando análisis de área: ({center_lat:.4f}, {center_lng:.4f})")
            
            # Validate area size
            area_km2 = calculate_area_km2(north, south, east, west)
            self.logger.info(f"📏 Area size: {area_km2:.2f} km²")
            
            if area_km2 > MAX_AREA_KM2:
                raise ValueError(f"Area too large: {area_km2:.2f} km² (max: {MAX_AREA_KM2} km²)")
            
            # Generate sample points with fixed 5x5 grid
            grid_points = generate_grid_points(north, south, east, west, grid_size=5)
            self.logger.info(f"📍 Detectados {len(grid_points)} puntos de muestreo")
            
            # Analyze rooftops at each point (with limit)
            green_roof_opportunities = []
            max_analyses = 25  # Límite para no saturar
            
            for i, (lat, lng) in enumerate(grid_points[:max_analyses], 1):
                self.logger.info(f"🤖 Analizando punto {i}/{len(grid_points[:max_analyses])}")
                
                # Generate image URL with API key
                image_url = self._generate_satellite_image_url(lat, lng)
                
                # Create descriptive address
                address = f"Edificio {i} ({lat:.5f}, {lng:.5f})"
                
                self.logger.info(f"📸 Descargando imagen: {address}")
                
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
                    
                    roof_type = analysis.get("tipo_cubierta", "desconocido")
                    self.logger.info(f"✅ Análisis completado: {roof_type}")
                    
                    # Calculate viability
                    viability_score = estimate_rooftop_viability(
                        tipo_cubierta=roof_type,
                        estado_conservacion=analysis.get("estado_conservacion", "bueno"),
                        obstrucciones=analysis.get("obstrucciones", []),
                        confianza=analysis.get("confianza", 50)
                    )
                    
                    # Only include viable opportunities (score > 50 per problem statement)
                    if viability_score < 50:
                        self.logger.info(f"❌ Viabilidad baja ({viability_score}%), descartado")
                        continue
                    
                    # Estimate costs and CO2 savings
                    cost = int(area_m2 * COST_PER_M2_EUR)
                    co2_savings = int(area_m2 * CO2_SAVINGS_PER_M2_KG_YEAR)
                    
                    self.logger.info(f"💰 Coste estimado: {cost}€, CO₂: {co2_savings}kg/año")
                    
                    opportunity = {
                        "id": f"roof_{i}_{int(lat * 1000000)}_{int(lng * 1000000)}",
                        "address": address,
                        "coordinates": [lat, lng],
                        "area_m2": area_m2,
                        "viability_score": viability_score,
                        "roof_type": roof_type,
                        "condition": analysis.get("estado_conservacion", "bueno"),
                        "obstructions": [obs.get("tipo", "otro") for obs in analysis.get("obstrucciones", [])],
                        "estimated_cost_eur": cost,
                        "co2_savings_kg_year": co2_savings,
                        "image_url": image_url,
                        "ai_notes": analysis.get("notas_ia", "")
                    }
                    
                    green_roof_opportunities.append(opportunity)
                    self.logger.info(f"✅ Added opportunity: viability={viability_score}")
                        
                except Exception as e:
                    self.logger.error(f"❌ Error analizando {address}: {e}")
                    continue
            
            self.logger.info(f"✅ {len(green_roof_opportunities)} tejados viables detectados")
            
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
                "area_name": f"Área urbana ({center_lat:.4f}, {center_lng:.4f})",
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
            
            self.logger.info(f"📊 Informe completado: {total_opportunities} oportunidades totales")
            return report
            
        except Exception as e:
            self.logger.error(f"❌ Error in area analysis: {e}")
            raise
