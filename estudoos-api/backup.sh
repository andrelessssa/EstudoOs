#!/bin/bash

# ── Configurações do Banco no Docker ──
# Nome do container onde o PostgreSQL está rodando
CONTAINER_NAME="estudoos-db"  # Ajuste com o nome do seu container no docker-compose.yml
POSTGRES_USER="postgres"
POSTGRES_DB="estudoos"

# ── Configuração de Diretório e Retenção ──
BACKUP_DIR="./backups"
RETENTION_DAYS=7

# Cria a pasta de backups se ela não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo formatado com data e hora
FILE_NAME="backup_${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).sql"
FILE_PATH="${BACKUP_DIR}/${FILE_NAME}"

echo "📦 [VPS] Iniciando backup do banco '${POSTGRES_DB}' via Docker..."

# Executa o pg_dump direto de dentro do container Docker
docker exec -t ${CONTAINER_NAME} pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > "${FILE_PATH}"

if [ $? -eq 0 ]; then
  echo "✅ Backup concluído com sucesso: ${FILE_PATH}"
  
  # Remove backups antigos (com mais de 7 dias)
  find ${BACKUP_DIR} -type f -name "*.sql" -mtime +${RETENTION_DAYS} -delete
  echo "🧹 Limpeza de backups com mais de ${RETENTION_DAYS} dias concluída."
else
  echo "❌ Erro ao realizar o backup no Docker!"
fi

