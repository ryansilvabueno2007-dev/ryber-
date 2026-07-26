import ipaddress
import mimetypes
import shutil
import socket
from pathlib import Path
from typing import BinaryIO
from urllib.parse import urljoin, urlparse

import requests
import yt_dlp


def save_upload(fileobj: BinaryIO, dest_dir: Path, analysis_id: str, suffix: str) -> Path:
    dest = dest_dir / f"{analysis_id}{suffix}"
    with open(dest, "wb") as out:
        shutil.copyfileobj(fileobj, out)
    return dest


def _is_public_host(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False
    return True


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise RuntimeError("Link inválido.")
    if not _is_public_host(parsed.hostname):
        raise RuntimeError("Link inválido.")


def download_from_link(url: str, dest_dir: Path, analysis_id: str) -> Path:
    _validate_url(url)
    try:
        return _download_video(url, dest_dir, analysis_id)
    except yt_dlp.utils.DownloadError:
        image_path = _try_download_image(url, dest_dir, analysis_id)
        if image_path:
            return image_path
        raise RuntimeError(
            "Não foi possível baixar este link. Se for uma foto do Instagram, o Instagram "
            "bloqueia esse tipo de acesso direto — baixe a imagem e envie por upload."
        ) from None


def _download_video(url: str, dest_dir: Path, analysis_id: str) -> Path:
    outtmpl = str(dest_dir / f"{analysis_id}.%(ext)s")
    ydl_opts = {
        "outtmpl": outtmpl,
        "format": "mp4/best",
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        # Evita ficar travado pra sempre se a rede ou o Instagram engasgarem
        "socket_timeout": 20,
        "retries": 3,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    matches = list(dest_dir.glob(f"{analysis_id}.*"))
    if not matches:
        raise RuntimeError("Falha ao baixar o vídeo do link fornecido.")
    return matches[0]


def _try_download_image(url: str, dest_dir: Path, analysis_id: str) -> Path | None:
    # Segue redirects manualmente, revalidando cada host contra IPs privados/internos
    # (o requests, por padrão, segue redirects sem revalidar, o que abriria uma brecha
    # de SSRF: um redirect poderia apontar para a rede interna do servidor).
    session = requests.Session()
    current_url = url
    resp = None
    for _ in range(5):
        _validate_url(current_url)
        try:
            resp = session.get(
                current_url,
                timeout=15,
                headers={"User-Agent": "Mozilla/5.0"},
                allow_redirects=False,
            )
        except requests.RequestException:
            return None
        if resp.is_redirect or resp.is_permanent_redirect:
            location = resp.headers.get("location")
            if not location:
                return None
            current_url = urljoin(current_url, location)
            continue
        break
    else:
        return None

    if resp is None or resp.status_code >= 400:
        return None

    content_type = resp.headers.get("content-type", "").split(";")[0].strip()
    if not content_type.startswith("image/"):
        return None

    ext = mimetypes.guess_extension(content_type) or ".jpg"
    path = dest_dir / f"{analysis_id}{ext}"
    path.write_bytes(resp.content)
    return path
