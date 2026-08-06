#!/bin/sh
set -e
# Sem alembic aqui de propósito — só o serviço web roda migração, pra não ter dois
# serviços disputando a migração ao mesmo tempo na subida.
exec python worker_entry.py
