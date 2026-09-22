import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.config import settings
from app.services.gemini_service import GeminiService, GeminiServiceError
from google.genai.errors import APIError

def test_gemini_configuration_defaults():
    """Verify Gemini configuration defaults and model settings."""
    assert settings.gemini_model == "gemini-3.8-flash"
    assert hasattr(settings, "gemini_api_key")

def test_gemini_missing_api_key():
    """Verify that unconfigured API key raises a clear GeminiServiceError."""
    service = GeminiService()
    with patch.object(settings, "gemini_api_key", ""):
        service._client = None
        with pytest.raises(GeminiServiceError) as exc_info:
            _ = service.client
        assert "Gemini API key is not configured" in str(exc_info.value)

def test_generate_project_description():
    """Verify project description generation parses response correctly."""
    async def _run():
        service = GeminiService()
        mock_response = MagicMock()
        mock_response.text = "This is a comprehensive and scalable platform for agile management."

        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_response.text
            result = await service.generate_project_description("NextGen CRM")
            assert "scalable platform" in result
            mock_gen.assert_called_once()
    asyncio.run(_run())

def test_generate_project_description_empty_title():
    """Verify empty title raises a validation error."""
    async def _run():
        service = GeminiService()
        with pytest.raises(GeminiServiceError) as exc:
            await service.generate_project_description("   ")
        assert "Project title must not be empty" in str(exc.value)
    asyncio.run(_run())

def test_generate_tasks_structured():
    """Verify structured tasks generation correctly parses JSON schema output."""
    async def _run():
        service = GeminiService()
        mock_json = '{"tasks": [{"title": "Setup Database", "description": "Configure MongoDB collections and indexes", "status": "Todo", "priority": "High"}]}'

        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_json
            tasks = await service.generate_tasks("Cloud Migration", "Migrate legacy DB")
            assert len(tasks) == 1
            assert tasks[0]["title"] == "Setup Database"
            assert tasks[0]["status"] == "Todo"
            assert tasks[0]["priority"] == "High"
    asyncio.run(_run())

def test_prioritize_tasks_structured():
    """Verify task prioritization updates priorities correctly."""
    async def _run():
        service = GeminiService()
        mock_json = '{"tasks": [{"title": "Deploy API", "description": "Deploy to prod", "status": "Todo", "priority": "High"}]}'

        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_json
            input_tasks = [{"title": "Deploy API", "description": "Deploy to prod", "status": "Todo", "priority": "Low"}]
            prioritized = await service.prioritize_tasks(input_tasks)
            assert len(prioritized) == 1
            assert prioritized[0]["priority"] == "High"
    asyncio.run(_run())

def test_productivity_suggestions():
    """Verify productivity suggestions generation."""
    async def _run():
        service = GeminiService()
        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "Great progress! Consider focusing on the highest priority task next."
            tip = await service.get_productivity_suggestions(3, 15, 10)
            assert "Great progress" in tip
    asyncio.run(_run())

def test_test_connection_probe():
    """Verify the minimal health check probe requesting GEMINI_CONNECTION_OK."""
    async def _run():
        service = GeminiService()
        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "GEMINI_CONNECTION_OK"
            result = await service.test_connection()
            assert result == "GEMINI_CONNECTION_OK"
    asyncio.run(_run())

def test_gemini_api_rate_limit_handling():
    """Verify rate limit (RESOURCE_EXHAUSTED / 429) returns clean user-friendly error."""
    async def _run():
        service = GeminiService()
        mock_client = MagicMock()
        err = APIError.__new__(APIError)
        err.code = 429
        err.args = ("RESOURCE_EXHAUSTED: Rate limit exceeded",)
        mock_client.aio.models.generate_content = AsyncMock(side_effect=err)

        with patch.object(service, "_client", mock_client), \
             patch.object(settings, "gemini_api_key", "test-key"):
            with pytest.raises(GeminiServiceError) as exc:
                await service._generate_content("Hello")
            assert "rate limit or quota exceeded" in str(exc.value)
    asyncio.run(_run())

def test_gemini_empty_response_handling():
    """Verify empty response from Gemini is handled without crashing."""
    async def _run():
        service = GeminiService()
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = ""
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_resp)

        with patch.object(service, "_client", mock_client), \
             patch.object(settings, "gemini_api_key", "test-key"):
            with pytest.raises(GeminiServiceError) as exc:
                await service._generate_content("Hello")
            assert "Empty response" in str(exc.value)
    asyncio.run(_run())

def test_gemini_malformed_json_handling():
    """Verify malformed JSON from Gemini is safely caught and raised as GeminiServiceError."""
    async def _run():
        service = GeminiService()
        with patch.object(service, "_generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "This is not json {["
            with pytest.raises(GeminiServiceError) as exc:
                await service.generate_tasks("Test", "Desc")
            assert "Failed to parse tasks response from Gemini" in str(exc.value)
    asyncio.run(_run())

def test_gemini_auto_model_switching_on_quota_exhausted():
    """Verify that when a model encounters a 429 quota exhaustion, it automatically switches to the next model in cascade."""
    async def _run():
        service = GeminiService()
        mock_client = MagicMock()

        # Simulate 429 on first model, success on second model
        err_429 = APIError.__new__(APIError)
        err_429.code = 429
        err_429.args = ("RESOURCE_EXHAUSTED: Rate limit or quota reached",)

        mock_resp_success = MagicMock()
        mock_resp_success.text = "Success from fallback model"

        call_count = 0
        async def mock_generate(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if kwargs.get("model") == "gemini-3.8-flash":
                raise err_429
            return mock_resp_success

        mock_client.aio.models.generate_content = AsyncMock(side_effect=mock_generate)

        with patch.object(service, "_client", mock_client), \
             patch.object(settings, "gemini_api_key", "test-key"):
            result = await service._generate_content("Hello")
            assert result == "Success from fallback model"
            # Verify active model was auto-switched to the working fallback model
            assert service.model_name != "gemini-3.8-flash"
            # Verify gemini-3.8-flash was marked exhausted
            assert "gemini-3.8-flash" in service._exhausted_models
    asyncio.run(_run())

def test_gemini_update_api_key_and_model_status():
    """Verify dynamic API key updating and model status structure."""
    service = GeminiService()
    service.update_api_key("test-new-gemini-key-123456789")
    status = service.get_model_status()

    assert status["provider"] == "Google Gemini"
    assert status["auto_switch_enabled"] is True
    assert status["api_key_configured"] is True
    assert "test-n" in status["masked_key"]
    assert "gemini-3.8-flash" in status["cascade_models"]

