from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator, field_validator
from typing import List, Union
import json
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
    
    cors_origins: Union[List[str], str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="after")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def resolve_mongo_url(self):
        # Fallback to aliases if mongodb_url is default or empty
        if not self.mongodb_url or self.mongodb_url == "mongodb://localhost:27017":
            alias = (
                os.getenv("MONGODB_URL")
                or os.getenv("MONGODB_URI")
                or os.getenv("DATABASE_URL")
                or os.getenv("MONGO_URL")
            )
            if alias:
                self.mongodb_url = alias
        
        # Clean any surrounding quotes or spaces
        self.mongodb_url = self.mongodb_url.strip().strip('"').strip("'")
        return self

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

