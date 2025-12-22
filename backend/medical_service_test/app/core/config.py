from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str
    app_env: str
    app_port: int

    # JWT
    jwt_secret: str
    jwt_algorithm: str

    # MongoDB
    mongo_uri: str
    mongo_db: str

    # Encryption
    field_encryption_key: str

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
