#!/bin/bash

# ========================================================
# PRODUCTION SERVER STARTUP SCRIPT
# Usage: ./start_server.sh
# ========================================================

# 1. Activate Virtual Environment (adjust path if needed)
# source venv/bin/activate 

# 2. Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# 3. Install Production Dependencies (Gunicorn)
# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "Installing Gunicorn..."
    pip install gunicorn
fi

# 4. Run the Server
# -w 4: Uses 4 worker processes (good for t3.micro)
# -b 0.0.0.0:5000: Binds to all network interfaces on port 5000
# --timeout 120: Gives workers 120 seconds to finish (crucial for image generation/mockups)
# --access-logfile -: Logs access to console (useful for debugging via systemd logs)

echo "Starting Fab-Ai Production Server..."
exec gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --access-logfile - api_server:app
