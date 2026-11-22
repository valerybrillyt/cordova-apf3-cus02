#!/bin/zsh
# Arranque del binario oficial MySQL 8.0.40 usado en esta máquina.
# En Windows se usa el servicio MySQL Server 8 ya instalado; no hace falta este script.
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
BIN="$BASE/mysql-local/bin/mysqld"
DATOS="$BASE/mysql-data"
if [[ ! -x "$BIN" ]]; then
  echo "No está el binario local. Instale MySQL Server 8 y use backend/.env." >&2
  exit 1
fi
if [[ -f "$DATOS/mysqld.pid" ]] && kill -0 "$(cat "$DATOS/mysqld.pid")" 2>/dev/null; then
  echo "MySQL ya está en ejecución."
  exit 0
fi
"$BIN" \
  --datadir="$DATOS" \
  --basedir="$BASE/mysql-local" \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --socket="$DATOS/mysql.sock" \
  --mysqlx=0 \
  --innodb-buffer-pool-size=64M \
  --pid-file="$DATOS/mysqld.pid" \
  --log-error="$DATOS/error.log" &
echo "MySQL iniciado. Revise $DATOS/error.log"
