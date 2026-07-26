from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"
    whisper_model_size: str = "base"
    max_frames: int = 40
    cors_origin: str = "http://localhost:5173"

    data_dir: str = "data"
    database_url: str = "sqlite:///./data/ryber.db"

    max_upload_mb: int = 500
    max_concurrent_analyses: int = 2
    rate_limit_per_minute: int = 5

    session_cookie_name: str = "ryber_session"
    session_ttl_days: int = 30
    session_cookie_secure: bool = True
    signup_invite_code: str = ""

    # E-mails (separados por vírgula) promovidos a admin automaticamente na
    # inicialização — permite dar acesso de admin sem precisar de shell no servidor.
    admin_emails: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""
    frontend_url: str = "http://localhost:5173"


settings = Settings()
