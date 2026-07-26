from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pass


def is_image(path: Path) -> bool:
    """Detecta pelo conteúdo do arquivo, não pela extensão — aceita qualquer formato
    que o Pillow (+ HEIC/HEIF) souber abrir."""
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False


def normalize_image(path: Path, out_path: Path) -> Path:
    """Converte qualquer formato de imagem (HEIC, WEBP, PNG com transparência, etc.)
    para um JPEG padrão, já com a orientação EXIF corrigida — pronto pra enviar ao Claude."""
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, format="JPEG", quality=92)
    return out_path
