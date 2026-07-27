#!/bin/bash

# ── Credenciais do application.properties ──
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="satell1tE"
POSTGRES_DB="estudoos"
HOST="localhost"
PORT="5432"

# ── Configuração de Diretório ──
BACKUP_DIR="./backups"
RETENTION_DAYS=7

# ── Localiza o pg_dump na instalação do PostgreSQL no Mac ──
PG_DUMP_PATH=""

if command -v pg_dump &> /dev/null; then
  PG_DUMP_PATH="pg_dump"
elif [ -f "/Library/PostgreSQL/18/bin/pg_dump" ]; then
  PG_DUMP_PATH="/Library/PostgreSQL/18/bin/pg_dump"
elif [ -f "/Library/PostgreSQL/17/bin/pg_dump" ]; then
  PG_DUMP_PATH="/Library/PostgreSQL/17/bin/pg_dump"
elif [ -f "/Library/PostgreSQL/16/bin/pg_dump" ]; then
  PG_DUMP_PATH="/Library/PostgreSQL/16/bin/pg_dump"
elif [ -f "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump" ]; then
  PG_DUMP_PATH="/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump"
fi

if [ -z "$PG_DUMP_PATH" ]; then
  echo "❌ pg_dump não encontrado. Verifique o caminho da instalação do PostgreSQL."
  exit 1
fi

mkdir -p $BACKUP_DIR

FILE_NAME="backup_${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).sql"
FILE_PATH="${BACKUP_DIR}/${FILE_NAME}"

echo "📦 Iniciando backup do banco '${POSTGRES_DB}' local..."

PGPASSWORD="${POSTGRES_PASSWORD}" "$PG_DUMP_PATH" -h ${HOST} -p ${PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > "${FILE_PATH}"

if [ $? -eq 0 ]; then
  echo "✅ Backup concluído com sucesso: ${FILE_PATH}"
  find ${BACKUP_DIR} -type f -name "*.sql" -mtime +${RETENTION_DAYS} -delete
  echo "🧹 Limpeza de backups antigos concluída."
else
  echo "❌ Erro ao realizar o backup do banco de dados!"
fi