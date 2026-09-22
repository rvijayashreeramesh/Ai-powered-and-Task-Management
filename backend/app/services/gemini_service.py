import asyncio
import json
import logging
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiServiceError(Exception):
    """Base exception for Gemini service errors."""
    pass

# Canonical alias for backward compatibility across the application
AIServiceError = GeminiServiceError

class TaskItemSchema(BaseModel):
    title: str = Field(description="Clear and concise task title")
    description: str = Field(description="Detailed description of what needs to be done")
    status: str = Field(description="Task status, strictly 'Todo'")
    priority: str = Field(description="Priority level: 'Low', 'Medium', or 'High'")

class TaskListSchema(BaseModel):
    tasks: List[TaskItemSchema] = Field(description="List of tasks")

# Defined Gemini models in priority order for automatic failover (strictly Google Gemini only)
GEMINI_MODELS_CASCADE: List[str] = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

class GeminiService:
    """Centralized Google Gemini AI Service using the official google-genai SDK with automatic model cascade."""

    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._active_model: str = settings.gemini_model or "gemini-3.8-flash"
        self._exhausted_models: Dict[str, float] = {}  # model_name -> cooldown_expiry_timestamp
        self._init_client()

    def _init_client(self) -> Optional[genai.Client]:
        api_key = settings.gemini_api_key.strip() if settings.gemini_api_key else ""
        if api_key:
            self._client = genai.Client(api_key=api_key)
        else:
            self._client = None
        return self._client

    def update_api_key(self, api_key: str):
        """Dynamically update the Gemini API key, clear cooldown cache, and reinitialize the client."""
        cleaned_key = api_key.strip()
        if cleaned_key:
            settings.gemini_api_key = cleaned_key
            self._client = genai.Client(api_key=cleaned_key)
            self._exhausted_models.clear()
            logger.info("Gemini API key updated dynamically. Active model: %s.", self._active_model)

    def mark_model_exhausted(self, model: str, duration: float = 600.0):
        """Mark a model as temporarily exhausted (quota/tokens/rate-limit hit) to deprioritize it."""
        self._exhausted_models[model] = time.time() + duration
        logger.warning(
            "Marked model '%s' as token/quota exhausted for %d seconds. Auto-switching to next candidate in cascade.",
            model,
            int(duration),
        )

    def set_active_model(self, model_name: str) -> str:
        """Manually or programmatically set the active Gemini model."""
        if model_name in GEMINI_MODELS_CASCADE:
            self._active_model = model_name
            self._exhausted_models.pop(model_name, None)
            logger.info("Active Gemini model set to %s", model_name)
            return model_name
        raise GeminiServiceError(f"Model '{model_name}' is not in the authorized Gemini cascade list.")

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            self._init_client()
        if not self._client or not settings.gemini_api_key.strip():
            logger.error("Gemini API key is missing from environment.")
            raise GeminiServiceError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in the backend environment."
            )
        return self._client

    @property
    def model_name(self) -> str:
        return self._active_model or settings.gemini_model or "gemini-3.8-flash"

    @property
    def candidate_models(self) -> List[str]:
        """Return candidate models in priority order, prioritizing models not currently in cooldown."""
        now = time.time()
        self._exhausted_models = {m: exp for m, exp in self._exhausted_models.items() if exp > now}

        current = self.model_name
        base_list = [current] + [m for m in GEMINI_MODELS_CASCADE if m != current]

        # Prioritize models that have not hit token/quota exhaustion
        available = [m for m in base_list if m not in self._exhausted_models]
        exhausted = [m for m in base_list if m in self._exhausted_models]
        return available + exhausted

    def get_model_status(self) -> Dict[str, Any]:
        """Return comprehensive status about the active Gemini model and cascade pipeline."""
        now = time.time()
        active_exhausted = [m for m, exp in self._exhausted_models.items() if exp > now]
        return {
            "provider": "Google Gemini",
            "active_model": self.model_name,
            "api_key_configured": bool(settings.gemini_api_key and settings.gemini_api_key.strip()),
            "masked_key": f"{settings.gemini_api_key[:6]}...{settings.gemini_api_key[-4:]}" if (settings.gemini_api_key and len(settings.gemini_api_key) > 10) else ("Configured" if settings.gemini_api_key else "Not Configured"),
            "cascade_models": GEMINI_MODELS_CASCADE,
            "auto_switch_enabled": True,
            "exhausted_models": active_exhausted,
        }

    async def auto_detect_working_model(self) -> str:
        """Probe candidate models in cascade order to automatically find and set the first working model."""
        client = self.client
        config = types.GenerateContentConfig(temperature=0.0)
        prompt = "Respond with: GEMINI_CONNECTION_OK"

        for model in self.candidate_models:
            try:
                logger.info("Probing model for auto-detection: %s", model)
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                if response and response.text:
                    self._active_model = model
                    self._exhausted_models.pop(model, None)
                    logger.info("Auto-detected and activated working Gemini model: %s", model)
                    return model
            except Exception as e:
                err = str(e).lower()
                logger.warning("Probe check failed for model %s: %s", model, err)
                if any(k in err for k in ["429", "quota", "exhausted", "503", "unavailable", "404"]):
                    self.mark_model_exhausted(model, duration=600.0)
                if "400" in err and ("api_key" in err or "key not valid" in err):
                    raise GeminiServiceError("Invalid Gemini API key.")
                continue

        return self.model_name

    async def _generate_content(
        self,
        contents: str,
        system_instruction: Optional[str] = None,
        response_schema: Optional[Any] = None,
        temperature: float = 0.7,
        max_retries_per_model: int = 2,
    ) -> str:
        """Helper to invoke Gemini with automatic model cascade when tokens/quota are exceeded."""
        client = self.client

        config_kwargs: Dict[str, Any] = {
            "temperature": temperature,
        }
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if response_schema is not None:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = response_schema

        config = types.GenerateContentConfig(**config_kwargs)

        # Build candidate list starting with the currently active model, followed by fallbacks
        models_to_try = self.candidate_models
        last_error = None

        for model in models_to_try:
            for attempt in range(max_retries_per_model):
                try:
                    logger.info("Calling Google Gemini model: %s (attempt %d/%d)", model, attempt + 1, max_retries_per_model)
                    response = await client.aio.models.generate_content(
                        model=model,
                        contents=contents,
                        config=config,
                    )

                    if not response or not response.text:
                        logger.warning("Empty response received from Gemini API on model %s", model)
                        last_error = GeminiServiceError("Empty response received from Gemini API.")
                        break

                    # If model successfully switched, update the active model and clear exhaustion if present
                    if model != self._active_model:
                        logger.info("Auto-switched active Gemini model from %s to %s", self._active_model, model)
                        self._active_model = model
                    self._exhausted_models.pop(model, None)

                    return response.text.strip()

                except APIError as e:
                    last_error = e
                    error_message = str(e).lower()
                    logger.warning("Gemini API error on model %s (attempt %d): %s", model, attempt + 1, error_message)

                    # Retry on transient 503 demand spikes on the same model
                    if ("503" in error_message or "unavailable" in error_message or "high demand" in error_message) and attempt < max_retries_per_model - 1:
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue

                    # If quota/token exhausted (429), model not found (404), or server unavailable (503), auto-switch to next Gemini model
                    if any(code in error_message for code in ["429", "resource_exhausted", "quota", "exhausted", "404", "not_found", "503", "unavailable"]):
                        self.mark_model_exhausted(model, duration=600.0)
                        logger.warning(
                            "Gemini model '%s' quota/token exhausted or unavailable. Auto-switching to next Gemini model in cascade.",
                            model,
                        )
                        break  # Move to next model in models_to_try

                    # If API key itself is invalid, switching models won't resolve it
                    if "400" in error_message and ("api_key" in error_message or "key not valid" in error_message):
                        raise GeminiServiceError("Invalid Gemini API key. Please check GEMINI_API_KEY.")

                    break  # For other errors, move to next model

                except GeminiServiceError:
                    raise
                except Exception as e:
                    logger.warning("Unexpected error on Gemini model %s: %s", model, str(e))
                    last_error = e
                    break

        if last_error:
            err_str = str(last_error).lower()
            if any(k in err_str for k in ["429", "resource_exhausted", "quota", "exhausted"]):
                raise GeminiServiceError(f"Gemini API rate limit or quota exceeded across candidate models: {str(last_error)}")
            if "empty response" in err_str:
                raise GeminiServiceError("Empty response received from Gemini API.")
            raise GeminiServiceError(f"All candidate Gemini models exhausted. Last error: {str(last_error)}")
        raise GeminiServiceError("Gemini generation failed across all available models.")

    async def generate_project_description(self, title: str) -> str:
        """Generate a professional project description from a project title."""
        if not title or not title.strip():
            raise GeminiServiceError("Project title must not be empty.")

        system_instruction = (
            "You are an expert technical project manager and architect. "
            "Write a concise, professional project description (1-2 paragraphs) based on the provided project title. "
            "Do not invent database IDs, user IDs, or unverified claims. Output only the description text."
        )
        prompt = f"Project Title: {title.strip()}"
        return await self._generate_content(contents=prompt, system_instruction=system_instruction)

    async def generate_tasks(self, project_name: str, description: str) -> List[Dict[str, Any]]:
        """Generate structured tasks for a project using Gemini structured output."""
        if not project_name or not project_name.strip():
            raise GeminiServiceError("Project name must not be empty.")

        system_instruction = (
            "You are a senior software architect and agile project manager. "
            "Break down the project into 5-8 logical, actionable high-level tasks. "
            "Assign each task a clear title, practical description, status strictly 'Todo', "
            "and priority ('Low', 'Medium', or 'High'). Do not invent database IDs or foreign keys."
        )
        prompt = f"Project Name: {project_name.strip()}\nDescription: {description.strip() if description else 'No description provided.'}"

        raw_json = await self._generate_content(
            contents=prompt,
            system_instruction=system_instruction,
            response_schema=TaskListSchema,
        )

        try:
            parsed = json.loads(raw_json)
            tasks_data = parsed.get("tasks", []) if isinstance(parsed, dict) else parsed
            if isinstance(tasks_data, list):
                result = []
                for item in tasks_data:
                    task_dict = {
                        "title": item.get("title", "").strip() or "Untitled Task",
                        "description": item.get("description", "").strip(),
                        "status": item.get("status", "Todo") or "Todo",
                        "priority": item.get("priority", "Medium") or "Medium",
                    }
                    result.append(task_dict)
                return result
            raise GeminiServiceError("Gemini returned an unexpected JSON structure for tasks.")
        except (json.JSONDecodeError, ValueError) as err:
            logger.error("Failed to parse structured JSON from Gemini: %s. Raw: %s", err, raw_json)
            raise GeminiServiceError(f"Failed to parse tasks response from Gemini: {err}")

    async def prioritize_tasks(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluate and re-prioritize a list of active tasks."""
        if not tasks:
            return []

        system_instruction = (
            "You are a master of agile methodologies and task prioritization. "
            "Evaluate the provided list of tasks based on standard technical dependencies, risks, and business value. "
            "Update their 'priority' field strictly using 'Low', 'Medium', or 'High'. "
            "Preserve the original titles and descriptions while returning the prioritized list."
        )
        prompt = f"Tasks to prioritize: {json.dumps(tasks)}"

        raw_json = await self._generate_content(
            contents=prompt,
            system_instruction=system_instruction,
            response_schema=TaskListSchema,
        )

        try:
            parsed = json.loads(raw_json)
            tasks_data = parsed.get("tasks", []) if isinstance(parsed, dict) else parsed
            if isinstance(tasks_data, list):
                result = []
                for item in tasks_data:
                    task_dict = {
                        "title": item.get("title", "").strip() or "Untitled Task",
                        "description": item.get("description", "").strip(),
                        "status": item.get("status", "Todo") or "Todo",
                        "priority": item.get("priority", "Medium") or "Medium",
                    }
                    result.append(task_dict)
                return result
            raise GeminiServiceError("Gemini returned an unexpected JSON structure for task prioritization.")
        except (json.JSONDecodeError, ValueError) as err:
            logger.error("Failed to parse prioritization JSON from Gemini: %s. Raw: %s", err, raw_json)
            raise GeminiServiceError(f"Failed to parse prioritized tasks from Gemini: {err}")

    async def get_productivity_suggestions(self, projects: int, tasks: int, completed_tasks: int) -> str:
        """Provide an encouraging, data-driven productivity insight based on workload metrics."""
        system_instruction = (
            "You are an AI productivity coach and agile mentor. "
            "Provide exactly one short, encouraging, and actionable tip (max 2 sentences) "
            "based strictly on the user's workload metrics."
        )
        prompt = f"Metrics: {projects} projects, {tasks} total tasks, {completed_tasks} completed tasks."
        return await self._generate_content(contents=prompt, system_instruction=system_instruction)

    async def test_connection(self) -> str:
        """Health check probe making a minimal Gemini request."""
        prompt = "Respond with exactly: GEMINI_CONNECTION_OK"
        response = await self._generate_content(contents=prompt, temperature=0.0)
        return response

gemini_service = GeminiService()
