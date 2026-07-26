from concurrent.futures import ThreadPoolExecutor

from app.config import settings

executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_analyses)
