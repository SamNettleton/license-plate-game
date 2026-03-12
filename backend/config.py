from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    enable_metrics: bool = False
    
    # This tells Pydantic to look for a file named .env in the same directory
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()