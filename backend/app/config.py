from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "CareBridge Emergency Backend"
    ENVIRONMENT: str = "development"
    
    # Supabase Credentials
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Bhashini / Translation API
    BHASHINI_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    BHASHINI_PIPELINE_ID: str = ""
    BHASHINI_ENDPOINT: str = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    
    # Enable Antigravity Agent or fallback mode for local testing
    USE_MOCK_FALLBACK_ON_ERROR: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
