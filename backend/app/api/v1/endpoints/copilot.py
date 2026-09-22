from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.schemas.user import UserInDB
from app.api.deps import get_current_user
from app.services.gemini_service import gemini_service, GeminiServiceError
from app.schemas.task import TaskPriority, TaskStatus
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class GenerateDescriptionRequest(BaseModel):
    title: str

class GenerateDescriptionResponse(BaseModel):
    description: str

class GenerateTasksRequest(BaseModel):
    project_name: str
    description: str

class SuggestedTask(BaseModel):
    title: str
    description: str
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM

class GenerateTasksResponse(BaseModel):
    tasks: List[SuggestedTask]

class PrioritizeTasksRequest(BaseModel):
    tasks: List[SuggestedTask]

class ProductivityRequest(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int

class ProductivityResponse(BaseModel):
    suggestion: str

class GeminiHealthResponse(BaseModel):
    status: str
    provider: str
    model: str
    ping: str

class GeminiModelStatusResponse(BaseModel):
    provider: str
    active_model: str
    api_key_configured: bool
    masked_key: str
    cascade_models: List[str]
    auto_switch_enabled: bool
    exhausted_models: List[str]

class UpdateApiKeyRequest(BaseModel):
    api_key: str

class SwitchModelRequest(BaseModel):
    model: str

@router.get("/health", response_model=GeminiHealthResponse)
async def gemini_health_check(
    current_user: UserInDB = Depends(get_current_user)
):
    """Health check endpoint to safely test Gemini connectivity with automatic failover."""
    try:
        ping_result = await gemini_service.test_connection()
        return GeminiHealthResponse(
            status="ok",
            provider="Google Gemini",
            model=gemini_service.model_name,
            ping=ping_result,
        )
    except GeminiServiceError as e:
        logger.warning("Gemini health check failure: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in gemini health check: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error testing Gemini connection.")

@router.get("/model-status", response_model=GeminiModelStatusResponse)
async def get_gemini_model_status(
    current_user: UserInDB = Depends(get_current_user)
):
    """Retrieve active Gemini model and failover cascade status."""
    return gemini_service.get_model_status()

@router.post("/update-key", response_model=GeminiModelStatusResponse)
async def update_gemini_api_key(
    req: UpdateApiKeyRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Dynamically configure or update Gemini API key and probe working models."""
    if not req.api_key or not req.api_key.strip():
        raise HTTPException(status_code=400, detail="API key must not be empty.")
    try:
        gemini_service.update_api_key(req.api_key.strip())
        await gemini_service.auto_detect_working_model()
        return gemini_service.get_model_status()
    except GeminiServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error updating API key: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to update API key: {str(e)}")

@router.post("/switch-model", response_model=GeminiModelStatusResponse)
async def switch_gemini_model(
    req: SwitchModelRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Manually select or switch the preferred Gemini model."""
    try:
        gemini_service.set_active_model(req.model)
        return gemini_service.get_model_status()
    except GeminiServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-description", response_model=GenerateDescriptionResponse)
async def generate_description(
    req: GenerateDescriptionRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        desc = await gemini_service.generate_project_description(req.title)
        return GenerateDescriptionResponse(description=desc)
    except GeminiServiceError as e:
        logger.warning("Gemini generate-description error: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in generate-description: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/generate-tasks", response_model=GenerateTasksResponse)
async def generate_tasks(
    req: GenerateTasksRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        raw_tasks = await gemini_service.generate_tasks(req.project_name, req.description)
        return GenerateTasksResponse(tasks=raw_tasks)
    except GeminiServiceError as e:
        logger.warning("Gemini generate-tasks error: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in generate-tasks: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/prioritize-tasks", response_model=GenerateTasksResponse)
async def prioritize_tasks(
    req: PrioritizeTasksRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        task_dicts = [t.model_dump(mode='json') for t in req.tasks]
        prioritized = await gemini_service.prioritize_tasks(task_dicts)
        return GenerateTasksResponse(tasks=prioritized)
    except GeminiServiceError as e:
        logger.warning("Gemini prioritize-tasks error: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in prioritize-tasks: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/suggestions", response_model=ProductivityResponse)
async def get_suggestions(
    req: ProductivityRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        tip = await gemini_service.get_productivity_suggestions(req.total_projects, req.total_tasks, req.completed_tasks)
        return ProductivityResponse(suggestion=tip)
    except GeminiServiceError as e:
        logger.warning("Gemini suggestions error: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in suggestions: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
