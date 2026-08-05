"""Ajuste pontual: define plan_started_at = hoje pra uma conta cujo plano foi
confirmado antes dessa coluna existir (senão a cota mensal continua contando a
análise do teste grátis feita antes de assinar).

Uso:
    cd backend
    $env:DATABASE_URL="connection string do Render"
    .venv\\Scripts\\python scripts\\set_plan_started_at.py email@exemplo.com
"""

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal  # noqa: E402
from app.db_models import User  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        print("Uso: python scripts/set_plan_started_at.py <email>")
        sys.exit(1)

    email = sys.argv[1].lower()

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"Nenhuma conta encontrada com o e-mail {email}.")
            return
        if not user.plan:
            print(f"Conta {email} não tem plano confirmado no momento.")
            return

        now = datetime.now(timezone.utc)
        print(f"Plano atual: {user.plan} | plan_started_at antes: {user.plan_started_at}")
        user.plan_started_at = now
        db.commit()
        print(f"plan_started_at atualizado pra agora ({now.isoformat()}).")


if __name__ == "__main__":
    main()
