#!/bin/bash
set -e

echo "========================================"
echo "LinkER Backend - Container Startup"
echo "========================================"

# Wait for PostgreSQL to be ready (in case depends_on timing is off)
echo "[1/3] Waiting for PostgreSQL..."
while ! pg_isready -h postgres -U "${POSTGRES_USER:-linker}" -d "${POSTGRES_DB:-linker_db}" -q 2>/dev/null; do
    echo "  PostgreSQL is unavailable - sleeping 2s"
    sleep 2
done
echo "  PostgreSQL is ready!"

# Initialize database tables
echo "[2/3] Initializing database tables..."
python init_db.py

# Fix password_hash column size for scrypt hashes (~200 chars)
echo "[3/3] Ensuring password_hash column is VARCHAR(256)..."
PGPASSWORD="${POSTGRES_PASSWORD:-linker_secure_password}" psql \
    -h postgres \
    -U "${POSTGRES_USER:-linker}" \
    -d "${POSTGRES_DB:-linker_db}" \
    -c "ALTER TABLE \"user\" ALTER COLUMN password_hash TYPE VARCHAR(256);" 2>/dev/null || true

echo "========================================"
echo "Starting Gunicorn server..."
echo "========================================"

# Execute the main command (gunicorn)
exec "$@"

