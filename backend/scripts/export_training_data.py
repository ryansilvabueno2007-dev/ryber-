"""Exporta um dataset de fine-tuning a partir das análises que você corrigiu manualmente.

Cada análise com uma correção salva (feita no dashboard, botão "Corrigir leitura") vira um
exemplo de treino: os frames + a transcrição (o que a IA viu/ouviu) como input, e a sua
correção como o resultado certo (o "gabarito"). É esse par input/gabarito que, no futuro,
alimenta o fine-tuning de um modelo próprio.

Uso:
    cd backend
    .venv\\Scripts\\python scripts\\export_training_data.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import storage  # noqa: E402


def main() -> None:
    trainable_ids = storage.list_trainable_ids()
    if not trainable_ids:
        print("Nenhuma análise corrigida ainda. Corrija uma leitura no dashboard primeiro.")
        return

    out_path = storage.DATA_DIR / "training_export.jsonl"
    written = 0

    with open(out_path, "w", encoding="utf-8") as out:
        for analysis_id in trainable_ids:
            raw_dir = storage.raw_dir(analysis_id)
            transcript_path = raw_dir / "transcript.json"
            frames = sorted((raw_dir / "frames").glob("frame_*.jpg"))

            if not frames or not transcript_path.exists():
                print(f"[aviso] pulando {analysis_id}: dados brutos incompletos")
                continue

            transcript = json.loads(transcript_path.read_text(encoding="utf-8"))
            correction = storage.load_correction(analysis_id)
            original = storage.load_result(analysis_id)

            example = {
                "id": analysis_id,
                "frames": [str(f.resolve()) for f in frames],
                "transcript": transcript,
                "original_ai_output": json.loads(original.model_dump_json()),
                "target": json.loads(correction.model_dump_json()),
            }
            out.write(json.dumps(example, ensure_ascii=False) + "\n")
            written += 1

    print(f"Exportado {written} exemplo(s) para {out_path}")


if __name__ == "__main__":
    main()
