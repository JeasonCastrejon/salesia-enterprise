from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://salesia:salesia@localhost:5432/salesia"
    SECRET_KEY: str = "dev-secret-change-me"
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
