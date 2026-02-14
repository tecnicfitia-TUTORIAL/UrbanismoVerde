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

# CORS configuration - Updated with correct frontend domain
allowed_origins = [
    "https://urbanismo-verde.vercel.app",      # ✅ Production domain (with hyphen)
    "https://urbanismoverde.vercel.app",       # ✅ Alternative (without hyphen)
    "http://localhost:5173",                    # ✅ Local development (Vite)
    "http://localhost:3000",                    # ✅ Local development (alternative)
    "http://localhost:8080"                     # ✅ Local development (alternative)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://(urbanismo-verde|urbanismoverde)-.*\.vercel\.app",  # ✅ Preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers (will be added in separate files)
try:
    from api.endpoints.inspeccion import router as inspeccion_router
    app.include_router(inspeccion_router, prefix="/api", tags=["inspecciones"])
    logger.info("✅ Inspection router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load inspection router: {e}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "UrbanismoVerde AI API",
        "status": "running",
        "version": "1.0.0",
        "environment": "production" if os.getenv("GOOGLE_CLOUD_PROJECT") else "development",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """
    Health check endpoint for Cloud Run and monitoring
    Returns service status and configuration
    """
    vertex_ai_configured = bool(os.getenv("GOOGLE_CLOUD_PROJECT"))
    supabase_configured = bool(os.getenv("SUPABASE_URL"))
    
    return {
        "status": "healthy" if (vertex_ai_configured and supabase_configured) else "degraded",
        "service": "urbanismoverde-backend",
        "cloud_run": True,
        "configuration": {
            "vertex_ai_project": os.getenv("GOOGLE_CLOUD_PROJECT", "not configured"),
            "vertex_ai_location": os.getenv("GOOGLE_CLOUD_LOCATION", "europe-west9"),
            "vision_provider": "vertex-ai",
            "supabase": "configured" if supabase_configured else "missing",
            "port": os.getenv("PORT", "8080")
        }
    }

@app.get("/api/info")
async def api_info():
    """
    Comprehensive API information endpoint with diagnostics
    """
    import sys
    
    try:
        import vertexai
        vertexai_available = True
        vertexai_version = "google-cloud-aiplatform"
    except ImportError:
        vertexai_available = False
        vertexai_version = 'not installed'
    
    try:
        import fastapi
        fastapi_version = fastapi.__version__
    except (ImportError, AttributeError):
        fastapi_version = 'unknown'
    
    vertex_ai_configured = bool(os.getenv("GOOGLE_CLOUD_PROJECT"))
    supabase_configured = bool(os.getenv("SUPABASE_URL"))
    
    return {
        "service": "UrbanismoVerde AI API",
        "version": "1.0.0",
        "status": "healthy" if (vertex_ai_configured and supabase_configured) else "degraded",
        "environment": "production" if vertex_ai_configured else "development",
        "vision": {
            "provider": "vertex-ai",
            "model_name": os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash-001"),
            "project_id": os.getenv("GOOGLE_CLOUD_PROJECT", "ecourbe-ai"),
            "location": os.getenv("GOOGLE_CLOUD_LOCATION", "europe-west9"),
            "library_version": vertexai_version,
            "available": vertexai_available and vertex_ai_configured,
            "configuration": {
                "temperature": 0.4,
                "top_p": 0.95,
                "top_k": 40,
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
            "inspections": "/api/inspecciones/*"
        }
    }

@app.get("/test-env")
async def test_env():
    """
    Test endpoint to verify environment variables (development only)
    """
    return {
        "vertex_ai_project": os.getenv("GOOGLE_CLOUD_PROJECT", "not_set"),
        "vertex_ai_location": os.getenv("GOOGLE_CLOUD_LOCATION", "europe-west9"),
        "vision_provider": "vertex-ai",
        "model_name": os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash-001"),
        "supabase_url": os.getenv("SUPABASE_URL", "not_set")[:30] + "..." if os.getenv("SUPABASE_URL") else None,
        "supabase_configured": bool(os.getenv("SUPABASE_ANON_KEY")),
        "port": os.getenv("PORT", "8080")
    }

@app.on_event("startup")
async def startup_event():
    """Actions to perform on application startup"""
    logger.info("🚀 Starting UrbanismoVerde AI Backend")
    
    # Log Vertex AI configuration
    try:
        import vertexai
        logger.info(f"📦 Vertex AI SDK available: google-cloud-aiplatform")
    except ImportError as e:
        logger.warning(f"⚠️ Vertex AI SDK not available: {e}")
    
    logger.info(f"🔑 GOOGLE_CLOUD_PROJECT: {os.getenv('GOOGLE_CLOUD_PROJECT', 'not set')}")
    logger.info(f"📍 Environment: {'Production' if os.getenv('GOOGLE_CLOUD_PROJECT') else 'Development'}")
    logger.info(f"🤖 Vision Provider: vertex-ai")
    logger.info(f"📍 Vertex AI Location: {os.getenv('GOOGLE_CLOUD_LOCATION', 'europe-west9')}")
    logger.info(f"🤖 Model: {os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-flash-001')}")
    logger.info(f"🔌 Port: {os.getenv('PORT', '8080')}")
    logger.info(f"🌐 Allowed origins: {allowed_origins}")  # ✅ Log CORS origins
    
    # Verify critical environment variables
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        logger.warning("⚠️ GOOGLE_CLOUD_PROJECT not set - AI features will not work")
    if not os.getenv("SUPABASE_URL"):
        logger.warning("⚠️ SUPABASE_URL not set - Database features will not work")

@app.on_event("shutdown")
async def shutdown_event():
    """Actions to perform on application shutdown"""
    logger.info("🛑 Shutting down UrbanismoVerde AI Backend")
