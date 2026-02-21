from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_password: str = "changeme"
    jwt_secret: str = "change-this-to-a-random-secret-key"
    jwt_ttl_hours: int = 24
    database_url: str = "sqlite+aiosqlite:///../data/resursmodell.db"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
