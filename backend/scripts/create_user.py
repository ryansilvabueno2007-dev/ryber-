"""Cria uma conta manualmente, sem passar pelo convite (uso do administrador).

Uso:
    cd backend
    .venv\\Scripts\\python scripts\\create_user.py novo@email.com "senha-temporaria"
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import auth  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.db_models import User  # noqa: E402


def main() -> None:
    if len(sys.argv) != 3:
        print("Uso: python scripts/create_user.py <email> <senha>")
        sys.exit(1)
    email, password = sys.argv[1].lower(), sys.argv[2]

    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first():
            print(f"Já existe uma conta com o e-mail {email}.")
            return
        user = User(email=email, password_hash=auth.hash_password(password))
        db.add(user)
        db.commit()
        print(f"Conta criada: {email}")


if __name__ == "__main__":
    main()
