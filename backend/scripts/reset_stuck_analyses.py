"""Remove análises que nunca terminaram (travadas, sem "done") de uma conta — usado quando
um deploy no meio do processamento mata o worker e a análise fica presa pra sempre, o que
também consome indevidamente a análise grátis de quem ainda não assinou.

Por padrão só MOSTRA o que seria apagado (dry-run). Passe --confirm pra apagar de verdade.

Uso:
    cd backend
    # contra o banco local (padrão, sqlite):
    .venv\\Scripts\\python scripts\\reset_stuck_analyses.py email@exemplo.com

    # contra produção (Supabase) — defina DATABASE_URL antes, com a connection string
    # que está no painel do Render (ryber-backend > Environment > DATABASE_URL):
    set DATABASE_URL=postgresql://...   (Windows cmd)
    $env:DATABASE_URL="postgresql://..." (PowerShell)
    .venv\\Scripts\\python scripts\\reset_stuck_analyses.py email@exemplo.com --confirm
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal  # noqa: E402
from app.db_models import Analysis, User  # noqa: E402


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    confirm = "--confirm" in sys.argv
    if len(args) != 1:
        print("Uso: python scripts/reset_stuck_analyses.py <email> [--confirm]")
        sys.exit(1)

    email = args[0].lower()

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"Nenhuma conta encontrada com o e-mail {email}.")
            return

        stuck = db.query(Analysis).filter(Analysis.user_id == user.id, Analysis.stage != "done").all()
        if not stuck:
            print(f"Nenhuma análise travada (stage != 'done') encontrada pra {email}.")
            return

        print(f"Análises travadas encontradas pra {email}:")
        for a in stuck:
            print(f"  - id={a.id} stage={a.stage} criada_em={a.created_at}")

        if not confirm:
            print("\nDry-run — nada foi apagado. Rode de novo com --confirm pra apagar de verdade.")
            return

        for a in stuck:
            db.delete(a)
        db.commit()
        print(f"\n{len(stuck)} análise(s) apagada(s). A conta volta a ter a análise grátis disponível.")


if __name__ == "__main__":
    main()
