"""Central AI Service wrapper delegating exclusively to the Google Gemini AI Service."""
from app.services.gemini_service import (
    gemini_service,
    GeminiService,
    GeminiServiceError,
    AIServiceError,
    TaskItemSchema,
    TaskListSchema,
)

# Canonical aliases for backward compatibility across the application
ai_service = gemini_service
AIService = GeminiService

__all__ = [
    "ai_service",
    "AIService",
    "gemini_service",
    "GeminiService",
    "AIServiceError",
    "GeminiServiceError",
    "TaskItemSchema",
    "TaskListSchema",
]
