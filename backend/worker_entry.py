"""Ponto de entrada do worker RQ. Existe só pra inicializar o Sentry antes de subir
o worker — é aqui que os erros reais de processamento acontecem (chamada à Anthropic,
upload/download no R2, transcrição, etc), não no serviço web. A CLI do RQ 2.x não tem
mais a flag --sentry-dsn que versões antigas tinham, por isso o worker programático."""
from rq import Worker

from app.config import settings
from app.queue import queue, redis_conn

if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.rq import RqIntegration

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[RqIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

if __name__ == "__main__":
    Worker([queue], connection=redis_conn).work()
