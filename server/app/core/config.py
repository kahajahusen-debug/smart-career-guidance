import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Career Guidance System"
    API_V1_STR: str = "/api/v1"

    MONGODB_URL: str = os.getenv(
        "MONGODB_URL",
        "mongodb://localhost:27017"
    )

    MONGODB_DB_NAME: str = os.getenv(
        "MONGODB_DB_NAME",
        "smart_career_guidance"
    )

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "smart-career-guidance-super-secret-key-2026"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "1440"
    ))


    CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",

    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:5178",
    "http://127.0.0.1:5179",
    "http://127.0.0.1:5180",

    "http://localhost:3000",
    ]

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development"
    )

    AI_PROVIDER: str = os.getenv(
        "AI_PROVIDER",
        "gemini"
    )

    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY",
        ""
    )

    OPENAI_API_KEY: str = os.getenv(
        "OPENAI_API_KEY",
        ""
    )

    AI_API_KEY: str = os.getenv(
        "AI_API_KEY",
        ""
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()