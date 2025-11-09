import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.core.config import settings
from src.core.database import test_connection
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Vanna AI API",
    description="Natural language to SQL API using Vanna AI and Groq",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes with prefix
app.include_router(router, prefix="/api/v1", tags=["vanna"])

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("=" * 50)
    logger.info("Starting Vanna AI API...")
    logger.info("=" * 50)
    
    # Test database connection
    logger.info("Testing database connection...")
    if test_connection():
        logger.info("✓ Database connection successful")
    else:
        logger.error("✗ Database connection failed")
    
    logger.info("-" * 50)
    logger.info("API is ready!")
    logger.info(f"Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Vanna AI API...")

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Vanna AI API - Natural Language to SQL",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs",
        "health_check": "/api/v1/health",
        "endpoints": {
            "train": "POST /api/v1/train",
            "ask": "POST /api/v1/ask",
            "generate_sql": "POST /api/v1/generate-sql"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )