"""Cria o usuário dono e associa as análises antigas (de antes da autenticação) a ele.

As análises feitas antes do banco de dados existir ficaram soltas em data/analyses/*.json
(formato antigo). Esse script cria (ou reaproveita) uma conta e importa essas análises pra
dentro do banco, associadas a essa conta, em vez de ficarem órfãs.

Uso:
    cd backend
    .venv\\Scripts\\python scripts\\migrate_existing_data.py seu@email.com "sua-senha"
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import auth, storage  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.db_models import Analysis, User  # noqa: E402
from app.models import AnalysisResult  # noqa: E402


def main() -> None:
    if len(sys.argv) != 3:
        print("Uso: python scripts/migrate_existing_data.py <email> <senha>")
        sys.exit(1)
    email, password = sys.argv[1].lower(), sys.argv[2]

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(email=email, password_hash=auth.hash_password(password), is_admin=True)
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Usuário criado: {email}")
        else:
            print(f"Usuário já existia: {email}")

        old_analyses_dir = storage.DATA_DIR / "analyses"
        if not old_analyses_dir.exists():
            print("Nenhuma pasta data/analyses/ encontrada, nada para migrar.")
            return

        migrated = 0
        for path in sorted(old_analyses_dir.glob("*.json")):
            if path.stem.endswith("_correction"):
                continue
            analysis_id = path.stem
            if db.get(Analysis, analysis_id) is not None:
                continue

            result = AnalysisResult.model_validate(json.loads(path.read_text(encoding="utf-8")))
            correction_path = old_analyses_dir / f"{analysis_id}_correction.json"
            correction_json = None
            if correction_path.exists():
                correction_json = json.loads(correction_path.read_text(encoding="utf-8"))

            db.add(
                Analysis(
                    id=analysis_id,
                    user_id=user.id,
                    media_type=result.media_type,
                    stage="done",
                    detail="Análise concluída",
                    result_json=json.loads(result.model_dump_json()),
                    correction_json=correction_json,
                )
            )
            migrated += 1

        db.commit()
        print(f"{migrated} análise(s) antiga(s) migrada(s) para o usuário {email}.")


if __name__ == "__main__":
    main()
