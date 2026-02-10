"""
EcoUrbe AI - AI Service
FastAPI + TensorFlow + Computer Vision

Servicio de inteligencia artificial para:
- Detección de zonas grises/abandonadas
- Análisis de viabilidad de reforestación
- Clasificación de tipo de suelo
- Estimación de horas de sol (NDVI)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

# Inicializar aplicación FastAPI
app = FastAPI(
    title="EcoUrbe AI Service",
    description="Servicio de IA para análisis de zonas urbanas y reforestación",
    version="1.0.0"
)

# Configurar CORS para permitir requests desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==========================================
# MODELOS DE DATOS (Pydantic)
# ==========================================

class Coordenada(BaseModel):
    """Coordenada geográfica (latitud, longitud)"""
    lat: float = Field(..., ge=-90, le=90, description="Latitud en grados decimales")
    lon: float = Field(..., ge=-180, le=180, description="Longitud en grados decimales")

class AnalisisRequest(BaseModel):
    """Solicitud de análisis de zona"""
    coordenadas: List[Coordenada] = Field(..., min_items=3, description="Polígono de la zona a analizar")
    municipio_id: Optional[str] = None

class AnalisisResponse(BaseModel):
    """Respuesta con resultados del análisis de IA"""
    tipo_suelo: str = Field(..., description="Tipo de suelo detectado")
    horas_sol_promedio: float = Field(..., ge=0, le=24, description="Horas de sol promedio por día")
    nivel_viabilidad: str = Field(..., description="Nivel de viabilidad: alta, media, baja, no_viable")
    ndvi_promedio: Optional[float] = Field(None, ge=-1, le=1, description="Índice de vegetación NDVI")
    confianza: float = Field(..., ge=0, le=1, description="Confianza del análisis (0-1)")

class HealthResponse(BaseModel):
    """Respuesta de health check"""
    status: str
    service: str
    version: str

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/", response_model=dict)
async def root():
    """Endpoint raíz con información del servicio"""
    return {
        "message": "EcoUrbe AI Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze-zone",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "ecourbe-ai",
        "version": "1.0.0"
    }

@app.post("/api/analyze-zone", response_model=AnalisisResponse)
async def analyze_zone(request: AnalisisRequest):
    """
    Analiza una zona geográfica para determinar viabilidad de reforestación.
    
    Este endpoint recibe un polígono de coordenadas y retorna:
    - Tipo de suelo estimado
    - Horas de sol promedio
    - Nivel de viabilidad para reforestación
    - Índice NDVI (vegetación)
    
    NOTA: Esta es una implementación simulada. En producción, aquí se integrarían:
    - Modelos de TensorFlow entrenados
    - Google Earth Engine API para imágenes satelitales
    - Análisis de NDVI real
    - Clasificación de suelo mediante computer vision
    """
    
    try:
        # Validar que hay suficientes coordenadas
        if len(request.coordenadas) < 3:
            raise HTTPException(
                status_code=400,
                detail="Se requieren al menos 3 coordenadas para formar un polígono"
            )
        
        # SIMULACIÓN: En producción, aquí iría la lógica real de IA
        # - Obtener imágenes satelitales de la zona
        # - Ejecutar modelos de clasificación
        # - Calcular NDVI y métricas
        
        # Calcular centroide aproximado para simulación
        lat_promedio = sum(c.lat for c in request.coordenadas) / len(request.coordenadas)
        lon_promedio = sum(c.lon for c in request.coordenadas) / len(request.coordenadas)
        
        # Simulación simple basada en ubicación
        # En Madrid (40.4N, -3.7W), simular diferentes resultados
        variacion = (abs(lat_promedio - 40.4) + abs(lon_promedio + 3.7)) * 10
        
        # Tipos de suelo posibles
        tipos_suelo = ["arcilloso", "arenoso", "limoso", "mixto", "artificial"]
        tipo_suelo_idx = int(variacion * 10) % len(tipos_suelo)
        
        # Simular horas de sol (6-9 horas típico en España)
        horas_sol = 7.5 + (variacion % 2)
        
        # Determinar viabilidad basada en simulación
        if horas_sol > 7 and tipos_suelo[tipo_suelo_idx] in ["arcilloso", "limoso", "mixto"]:
            nivel_viabilidad = "alta"
            confianza = 0.85
            ndvi = 0.3
        elif horas_sol > 6:
            nivel_viabilidad = "media"
            confianza = 0.72
            ndvi = 0.2
        else:
            nivel_viabilidad = "baja"
            confianza = 0.60
            ndvi = 0.1
        
        return AnalisisResponse(
            tipo_suelo=tipos_suelo[tipo_suelo_idx],
            horas_sol_promedio=round(horas_sol, 2),
            nivel_viabilidad=nivel_viabilidad,
            ndvi_promedio=round(ndvi, 3),
            confianza=round(confianza, 2)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error en datos de entrada: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# ==========================================
# EJECUCIÓN (solo para desarrollo local)
# ==========================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
