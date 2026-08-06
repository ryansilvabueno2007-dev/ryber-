from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("*", mode="before")
    @classmethod
    def _strip_strings(cls, v):
        # Env vars coladas no painel do Render/etc. às vezes carregam um "\n" ou
        # espaço no final — a lib do Anthropic rejeita isso como header HTTP inválido.
        if isinstance(v, str):
            return v.strip()
        return v

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

    # E-mails (separados por vírgula) promovidos a admin automaticamente na
    # inicialização — permite dar acesso de admin sem precisar de shell no servidor.
    admin_emails: str = ""

    # Login com Google — Client ID do OAuth (público, vai pro frontend também).
    # Criado em console.cloud.google.com > APIs e Serviços > Credenciais > Client ID OAuth.
    google_client_id: str = ""

    # E-mail transacional (recuperação de senha etc.) via Resend — resend.com.
    # Sem a API key, o link de reset só é logado no console (útil em dev local).
    resend_api_key: str = ""
    email_from: str = "Ryber <naoresponda@ryber.com.br>"

    # Asaas (cobrança/assinatura) — ambiente controla a base URL da API (sandbox/produção).
    asaas_api_key: str = ""
    asaas_env: str = "sandbox"  # "sandbox" ou "production"
    # Token que a própria Asaas envia de volta no header "asaas-access-token" de cada
    # webhook — configurado por você no painel deles ao criar o webhook, não é a API key.
    asaas_webhook_token: str = ""
    frontend_url: str = "http://localhost:5173"

    # Cloudflare R2 (armazenamento de vídeos/imagens/frames — S3-compatible).
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""

    # Fila de processamento (RQ + Redis do Upstash em produção).
    redis_url: str = "redis://localhost:6379/0"


settings = Settings()
