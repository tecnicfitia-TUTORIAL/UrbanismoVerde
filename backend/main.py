"""
UrbanismoVerde AI Backend API
FastAPI application for rooftop inspection with Gemini Vision
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="UrbanismoVerde AI API",
    description="Backend API for intelligent rooftop inspection using Google Gemini Vision",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
allowed_origins = [
    "https://urbanismo-verde.vercel.app",
    "https://urbanismoverde.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://(urbanismo-verde|urbanismoverde)-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
try:
    from api.endpoints.inspeccion import router as inspeccion_router
    app.include_router(inspeccion_router, prefix="/api/inspecciones", tags=["inspecciones"])
    logger.info("✅ Inspection router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load inspection router: {e}")

try:
    from api.endpoints.analysis import router as analysis_router
    app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])
    logger.info("✅ Analysis router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load analysis router: {e}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "UrbanismoVerde AI API",
        "status": "running",
        "version": "1.0.0",
        "environment": "production" if os.getenv("GOOGLE_API_KEY") else "development",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Health check endpoint for Cloud Run and monitoring"""
    google_api_key_configured = bool(os.getenv("GOOGLE_API_KEY"))
    supabase_configured = bool(os.getenv("SUPABASE_URL"))
    
    return {
        "status": "healthy" if (google_api_key_configured and supabase_configured) else "degraded",
        "service": "urbanismoverde-backend",
        "cloud_run": True,
        "configuration": {
            "vision_provider": os.getenv("VISION_PROVIDER", "gemini"),
            "model": os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash"),
            "api_key_configured": google_api_key_configured,
            "supabase": "configured" if supabase_configured else "missing",
            "port": os.getenv("PORT", "8080")
        }
    }

@app.get("/api/info")
async def api_info():
    """Comprehensive API information endpoint with diagnostics"""
    import sys
    
    try:
        import google.generativeai as genai
        genai_available = True
        genai_version = "google-generativeai==0.8.3"
    except ImportError:
        genai_available = False
        genai_version = 'not installed'
    
    try:
        import fastapi
        fastapi_version = fastapi.__version__
    except (ImportError, AttributeError):
        fastapi_version = 'unknown'
    
    google_api_key_configured = bool(os.getenv("GOOGLE_API_KEY"))
    supabase_configured = bool(os.getenv("SUPABASE_URL"))
    vision_provider = os.getenv("VISION_PROVIDER", "gemini")
    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    
    return {
        "service": "UrbanismoVerde AI API",
        "version": "1.0.0",
        "status": "healthy" if (google_api_key_configured and supabase_configured) else "degraded",
        "environment": "production" if google_api_key_configured else "development",
        "vision": {
            "provider": vision_provider,
            "model_name": model_name,
            "api_key_configured": google_api_key_configured,
            "library": "google-generativeai",
            "library_version": genai_version,
            "available": genai_available and google_api_key_configured,
            "configuration": {
                "temperature": 0.4,
                "max_output_tokens": 2048
            }
        },
        "backend": {
            "framework": "FastAPI",
            "framework_version": fastapi_version,
            "python_version": sys.version.split()[0],
            "port": os.getenv("PORT", "8080")
        },
        "database": {
            "provider": "Supabase",
            "configured": supabase_configured
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "inspections": "/api/inspecciones/*",
            "analysis": "/api/analysis/*"
        }
    }

@app.get("/test-env")
async def test_env():
    """Test endpoint to verify environment variables"""
    return {
        "vision_provider": os.getenv("VISION_PROVIDER", "gemini"),
        "model_name": os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash"),
        "api_key_configured": bool(os.getenv("GOOGLE_API_KEY")),
        "supabase_url": os.getenv("SUPABASE_URL", "not_set")[:30] + "..." if os.getenv("SUPABASE_URL") else None,
        "supabase_configured": bool(os.getenv("SUPABASE_ANON_KEY")),
        "port": os.getenv("PORT", "8080")
    }

@app.on_event("startup")
async def startup_event():
    """Actions to perform on application startup"""
    logger.info("🚀 Starting UrbanismoVerde AI Backend")
    
    try:
        import google.generativeai as genai
        logger.info(f"📦 google-generativeai SDK available")
    except ImportError as e:
        logger.warning(f"⚠️ google-generativeai SDK not available: {e}")
    
    logger.info(f"🔑 GOOGLE_API_KEY: {'configured' if os.getenv('GOOGLE_API_KEY') else 'not set'}")
    logger.info(f"📍 Environment: {'Production' if os.getenv('GOOGLE_API_KEY') else 'Development'}")
    logger.info(f"🤖 Vision Provider: {os.getenv('VISION_PROVIDER', 'gemini')}")
    logger.info(f"🤖 Model: {os.getenv('GEMINI_MODEL_NAME', 'gemini-2.5-flash')}")
    logger.info(f"🔌 Port: {os.getenv('PORT', '8080')}")
    logger.info(f"🌐 Allowed origins: {allowed_origins}")
    
    if not os.getenv("GOOGLE_API_KEY"):
        logger.warning("⚠️ GOOGLE_API_KEY not set - AI features will not work")
    if not os.getenv("SUPABASE_URL"):
        logger.warning("⚠️ SUPABASE_URL not set - Database features will not work")

@app.on_event("shutdown")
async def shutdown_event():
    """Actions to perform on application shutdown"""
    logger.info("🛑 Shutting down UrbanismoVerde AI Backend")
