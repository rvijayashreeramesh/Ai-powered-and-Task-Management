from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db_instance
from app.api.v1.api import api_router
from app.core.exceptions import validation_exception_handler, global_exception_handler

import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.warning("MongoDB connection could not be established on startup: %s", str(e))
    yield
    await close_mongo_connection()

app = FastAPI(
    title="AI-Powered Project & Task Management API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Exception Handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# API Router
app.include_router(api_router, prefix="/api/v1")

from app.core.config import settings

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend is running."""
    return {"status": "ok", "message": "Backend is running successfully."}

@app.get("/health/db")
async def health_db_check():
    """Health check endpoint to verify database connectivity."""
    try:
        if db_instance.client is not None:
            await db_instance.client.admin.command('ping')
            return {"status": "ok", "database": "connected"}
        return {"status": "error", "database": "disconnected"}
    except Exception as e:
        logger.warning("Database ping health check failed: %s", str(e))
        return {"status": "error", "database": "disconnected"}
