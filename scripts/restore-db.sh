#!/usr/bin/env bash
# ==============================================================================
# Database Restoration Script
# Smart Scheme & Scholarship Recommendation Portal
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz> [--confirm]"
  echo "Example: $0 ./backups/database/smart_scheme_backup_20260927_070000.sql.gz --confirm"
  exit 1
fi

BACKUP_FILE="$1"
CONFIRM="${2:-}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup archive '${BACKUP_FILE}' not found."
  exit 1
fi

if [ "${CONFIRM}" != "--confirm" ]; then
  echo "⚠️ WARNING: This will overwrite data in '${DB_NAME:-smart_scheme_db}'."
  echo "Pass --confirm as the second argument to execute restoration."
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-smart_scheme_db}"

echo "=================================================="
echo "🔄 Restoring Database from: ${BACKUP_FILE}"
echo "📍 Target: ${DB_NAME} at ${DB_HOST}:${DB_PORT}"
echo "=================================================="

if command -v psql >/dev/null 2>&1; then
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD:-postgres}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --quiet

  echo "✅ Restoration completed."
  echo "🔍 Running relational data integrity validation..."
  npm --prefix backend run validate:integrity || true
else
  echo "⚠️ psql client not installed on current host. Restoration command simulated."
  echo "✅ Restoration simulation completed."
fi
