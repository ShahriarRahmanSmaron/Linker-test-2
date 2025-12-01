# ========================================================
# WINDOWS PRODUCTION SERVER STARTUP SCRIPT
# Usage: .\start_server.ps1
# ========================================================

Write-Host "Starting LinkER Production Server (Windows/Waitress)..." -ForegroundColor Cyan

# 1. Check for .env
if (-not (Test-Path .env)) {
    Write-Error "ERROR: .env file not found!"
    Write-Host "Please copy .env.example to .env and configure it."
    exit 1
}

# 2. Check/Install Waitress
try {
    python -c "import waitress"
} catch {
    Write-Host "Installing Waitress..."
    pip install waitress
}

# 3. Run Server
# Threads=4: Similar to workers
# Port=5000
Write-Host "Server running on http://0.0.0.0:5000"
waitress-serve --port=5000 --threads=4 api_server:app
