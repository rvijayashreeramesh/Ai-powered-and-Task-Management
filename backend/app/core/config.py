from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from typing import List
import os

class Settings(BaseSettings):
    api_port: int = 8000
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "project_db"

    jwt_secret: str = "default_secret_key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.8-flash", validation_alias="GEMINI_MODEL")
    
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def resolve_api_key(self):
        if not self.gemini_api_key:
            self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY") or ""
        
        if not self.gemini_api_key or self.gemini_api_key in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"):
            # Check backend/.env and root .env
            env_paths = [
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")),
            ]
            for p in env_paths:
                if os.path.exists(p):
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            for line in f:
                                if line.strip().startswith("GEMINI_API_KEY="):
                                    val = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                                    if val and val not in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"):
                                        self.gemini_api_key = val
                                        break
                    except Exception:
                        pass
                if self.gemini_api_key and self.gemini_api_key not in ("YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"):
                    break
        return self

settings = Settings()

