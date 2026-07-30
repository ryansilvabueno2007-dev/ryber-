from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.config import Config

from app.config import settings


def is_configured() -> bool:
    return bool(
        settings.r2_account_id
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket
    )


def _client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_file(key: str, path: Path, content_type: str = "application/octet-stream") -> None:
    _client().upload_file(str(path), settings.r2_bucket, key, ExtraArgs={"ContentType": content_type})


def upload_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    _client().put_object(Bucket=settings.r2_bucket, Key=key, Body=data, ContentType=content_type)


def upload_fileobj(key: str, fileobj: BinaryIO, content_type: str = "application/octet-stream") -> None:
    _client().upload_fileobj(fileobj, settings.r2_bucket, key, ExtraArgs={"ContentType": content_type})


def download_to_path(key: str, dest_path: Path) -> None:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    _client().download_file(settings.r2_bucket, key, str(dest_path))


def find_key_by_prefix(prefix: str) -> str | None:
    resp = _client().list_objects_v2(Bucket=settings.r2_bucket, Prefix=prefix, MaxKeys=1)
    contents = resp.get("Contents")
    return contents[0]["Key"] if contents else None


def presigned_url(key: str, expires: int = 3600) -> str:
    return _client().generate_presigned_url(
        "get_object", Params={"Bucket": settings.r2_bucket, "Key": key}, ExpiresIn=expires
    )
