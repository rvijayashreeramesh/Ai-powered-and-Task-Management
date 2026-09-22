from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    
    # Sanitize the errors to not expose raw values
    sanitized_errors = []
    for error in exc.errors():
        sanitized_errors.append({
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Input validation error", "errors": sanitized_errors},
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )
