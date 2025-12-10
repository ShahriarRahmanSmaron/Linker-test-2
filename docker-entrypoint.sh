#!/bin/bash
set -e

echo "========================================"
echo "LinkER Backend - Container Startup"
echo "========================================"

# Check if Supabase environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "ERROR: Supabase environment variables not set!"
    echo "Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "[1/3] Verifying Supabase connection..."
# Test Supabase connection by checking if we can access the API
if ! python -c "from supabase import create_client; import os; client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY')); print('Supabase connection OK')" 2>/dev/null; then
    echo "  WARNING: Could not verify Supabase connection"
    echo "  Continuing anyway - database setup will be handled by Supabase SQL scripts"
else
    echo "  Supabase connection verified!"
fi

# Note: Database schema should be set up via Supabase SQL Editor
# Run supabase_setup_complete.sql and supabase_security_fixes.sql in Supabase Dashboard
echo "[2/3] Database setup..."
echo "  NOTE: Database schema should be set up via Supabase SQL Editor"
echo "  Run these files in Supabase Dashboard → SQL Editor:"
echo "    - supabase_setup_complete.sql"
echo "    - supabase_security_fixes.sql"
echo "  Skipping local database initialization (using Supabase)"

# Create admin user if it doesn't exist (for admin login)
echo "[3/3] Creating admin user (if needed)..."
python -c "
from api_server import app, db
from models import User
from werkzeug.security import generate_password_hash
import os

with app.app_context():
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@linker.app')
    admin_password = os.getenv('ADMIN_PASSWORD')
    
    if not admin_password:
        print('  WARNING: ADMIN_PASSWORD not set, skipping admin creation')
    else:
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=generate_password_hash(admin_password),
                role='admin',
                approval_status='approved',
                is_verified_buyer=False
            )
            db.session.add(admin)
            db.session.commit()
            print(f'  Admin user created: {admin_email}')
        else:
            print(f'  Admin user already exists: {admin_email}')
" || echo "  Admin user creation skipped (may already exist or error occurred)"

echo "========================================"
echo "Starting Gunicorn server..."
echo "========================================"

# Execute the main command (gunicorn)
exec "$@"

