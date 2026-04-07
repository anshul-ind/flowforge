#!/usr/bin/env bash
# PostgreSQL logical backup (custom format). Requires pg_dump on PATH.
# Usage: DATABASE_URL="postgresql://..." ./scripts/backup-postgres.sh [output-dir]
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${OUT_DIR}/flowforge-${STAMP}.dump"

pg_dump "$DATABASE_URL" -Fc -f "$FILE"
echo "Wrote ${FILE}"
