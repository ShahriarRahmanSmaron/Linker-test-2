# Google Cloud Platform (GCP) Deployment Guide

This guide summarizes the steps and configurations required to deploy the Linker application to a Google Cloud VM (Ubuntu).

## 1. Server Preparation (SSH Console)

Run these commands on your fresh Ubuntu VM to install necessary dependencies:

```bash
# 1. Update package lists
sudo apt update

# 2. Install Docker, Docker Compose, Node.js, npm, unzip, and git
sudo apt install -y docker.io docker-compose nodejs npm unzip git
```

## 2. Project Setup

```bash
# 1. Clone the repository
git clone https://github.com/ShahriarRahmanSmaron/Linker-test-2.git

# 2. Enter the project directory
cd Linker-test-2
```

## 3. Configuration Files

The following configuration files are included in the repository. They are shown here for reference.

### `Dockerfile` (Backend with Auto-Init)
```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc libpq-dev libjpeg-dev zlib1g-dev postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "120", "--access-logfile", "-", "api_server:app"]
```

### `docker-entrypoint.sh` (Auto Database Init)
```bash
#!/bin/bash
set -e

echo "========================================"
echo "LinkER Backend - Container Startup"
echo "========================================"

# Wait for PostgreSQL
echo "[1/3] Waiting for PostgreSQL..."
while ! pg_isready -h postgres -U "${POSTGRES_USER:-linker}" -d "${POSTGRES_DB:-linker_db}" -q 2>/dev/null; do
    sleep 2
done

# Initialize database tables (runs db.create_all())
echo "[2/3] Initializing database tables..."
python init_db.py

# Fix password_hash column for scrypt hashes
echo "[3/3] Ensuring password_hash column is VARCHAR(256)..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h postgres -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    -c "ALTER TABLE \"user\" ALTER COLUMN password_hash TYPE VARCHAR(256);" 2>/dev/null || true

echo "Starting Gunicorn server..."
exec "$@"
```

### `Caddyfile` (Static Files Served by Caddy)
```caddyfile
:80 {
    root * /srv
    encode gzip

    # API -> Flask backend
    handle /api/* {
        reverse_proxy backend:5000
    }

    # Static files served directly by Caddy (fast, frees Python workers)
    handle /static/mockups/* { file_server }
    handle /static/mockup-templates/* { file_server }
    handle /static/swatches/* { file_server }
    handle /static/silhouettes/* { file_server }
    handle /images/* { file_server }

    # SPA fallback
    try_files {path} /index.html
    file_server
}
```

### `docker-compose.yml` (Orchestration)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: linker_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-linker}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-linker_secure_password}
      POSTGRES_DB: ${POSTGRES_DB:-linker_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-linker} -d ${POSTGRES_DB:-linker_db}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: linker_backend
    restart: always
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-linker}:${POSTGRES_PASSWORD:-linker_secure_password}@postgres:5432/${POSTGRES_DB:-linker_db}
    volumes:
      - ./instance:/app/instance
      - ./fabric_swatches:/app/fabric_swatches
      - ./mockups:/app/mockups
      - ./masks:/app/masks
      - ./silhouettes:/app/silhouettes
      - ./Excel_files:/app/Excel_files
      - ./generated_mockups:/app/generated_mockups
      - ./generated_techpacks:/app/generated_techpacks
      - ./techpack_templates:/app/techpack_templates
      - ./images:/app/images
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy

  caddy:
    image: caddy:alpine
    container_name: linker_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./dist:/srv
      # Static files served directly by Caddy
      - ./generated_mockups:/srv/static/mockups
      - ./mockups:/srv/static/mockup-templates
      - ./fabric_swatches:/srv/static/swatches
      - ./silhouettes:/srv/static/silhouettes
      - ./images:/srv/images
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

## 4. Manual Data Upload (Required)

Since image/template files are not in Git, you must upload them manually.

1.  **Prepare on Local Machine:**
    Zip the following folders into a single file named `data.zip`:
    *   `fabric_swatches` - Fabric swatch images
    *   `mockups` - Mockup template images
    *   `masks` - Mask files for mockup generation
    *   `silhouettes` - Silhouette images
    *   `techpack_templates` - Templates for PDF techpack generation
    *   `Excel_files` (Optional) - Excel database files
    *   `images` (Optional) - General image assets
    *   `instance` (Only for migration) - Contains `fabric_sourcing.db` if migrating from SQLite
    
    **Note:** For fresh installs, you don't need the `instance` folder. PostgreSQL will store data in a Docker volume.

2.  **Upload to Server (Option A: Web Console):**
    Use the SSH Console "Upload File" button to upload `data.zip` to the `Linker-test-2` directory.

3.  **Upload to Server (Option B: SCP - Faster):**
    Run this command from your **local machine's terminal** (PowerShell or CMD):
    ```bash
    # Replace USER and IP with your VM's username and external IP
    scp data.zip USER@YOUR_VM_IP:~/Linker-test-2/
    ```

4.  **Extract on Server:**
    ```bash
    unzip data.zip
    ```

5.  **Create .env File:**
    ```bash
    nano .env
    ```
    Paste the following template and update the values:
    ```bash
    # ===== REQUIRED - MUST BE SET =====
    SECRET_KEY=your-super-secret-key-change-this-in-production
    ADMIN_EMAIL=admin@yourcompany.com
    ADMIN_PASSWORD=your-secure-admin-password

    # ===== PostgreSQL Database =====
    POSTGRES_USER=linker
    POSTGRES_PASSWORD=your-secure-db-password-change-this
    POSTGRES_DB=linker_db

    # ===== CORS - Add your VM IP =====
    CORS_ALLOWED_ORIGINS=http://localhost:5173,http://YOUR_VM_IP

    # ===== Optional Settings =====
    FLASK_DEBUG=false
    FLASK_HOST=0.0.0.0
    FLASK_PORT=5000
    ```
    **Important:** 
    - Replace `YOUR_VM_IP` with your actual VM's external IP address.
    - Change `POSTGRES_PASSWORD` to a secure password.
    
    Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## 5. Build and Deploy

```bash
# 1. Build the React Frontend
npm install
npm run build

# 2. Start the Services (database init is automatic!)
sudo docker-compose up -d --build
```

The backend container will automatically:
1. Wait for PostgreSQL to be ready
2. Initialize database tables (`db.create_all()`)
3. Fix the `password_hash` column size for scrypt hashes

## 6. Create Admin User

After containers are running, create the admin user:

```bash
sudo docker exec -it linker_backend flask --app api_server create-admin
```

This uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file.

### Migrate from SQLite (Optional)

If you're migrating from an existing SQLite deployment:

```bash
# 1. Make sure SQLite database is in instance/fabric_sourcing.db
ls -la instance/

# 2. Run the migration script
sudo docker exec -it linker_backend python migrate_sqlite_to_postgres.py

# 3. Verify the migration
sudo docker exec -it linker_backend python -c "from api_server import app, db, User; app.app_context().push(); print(f'Users: {User.query.count()}')"
```

## 7. Verification

*   **Frontend:** Visit `http://<YOUR_VM_IP>/`
*   **Backend Health:** Visit `http://<YOUR_VM_IP>/api/health`

## 8. Troubleshooting

### Check Backend Logs

```bash
sudo docker logs linker_backend --tail 100
```

### Restart All Services

```bash
sudo docker-compose restart
```

### Rebuild and Restart (Nuclear Option)

```bash
sudo docker-compose down
sudo docker-compose up -d --build
```
------------------------------------





### Clean Up Docker (Free Disk Space)
Docker images and build cache can consume significant disk space:

```bash
# Check disk usage
df -h
sudo docker system df

# Clean up unused Docker data
sudo docker system prune -a --volumes -f

# Rebuild after cleanup
sudo docker-compose up -d --build
```
# See disk usage by directory
du -sh /* 2>/dev/null | sort -hr | head -20

# See Docker's disk usage specifically
docker system df

Run these commands on your GCP instance to free up space:
# 1. Stop all containers first
docker-compose down

# 2. Remove ALL unused Docker data (images, containers, volumes, build cache)
docker system prune -a --volumes -f

# 3. Check how much space you freed
df -h
---------------------------------------------------------

To deploy these changes to your server, git pull is not enough.
Since we modified the frontend code (src/...), you must rebuild the React application so the changes are compiled into the dist/ folder that Caddy serves.
Here are the steps to deploy on your server:
Option 1: If you have Node.js/npm installed on your server
Run these commands in your project root:
# 1. Get the latest code
git pull

# 2. Install dependencies (just in case)
npm install

# 3. Build the frontend (THIS is the important step)
npm run build
Note: Since your docker-compose.yml maps the ./dist folder directly to Caddy (./dist:/srv), Caddy will serve the new files immediately after the build finishes. You shouldn't even need to restart the containers.

----------------------------------------------------

This PermissionError(13, 'Permission denied') means your current user doesn't have permission to talk to the Docker daemon. You need to use sudo.

sudo docker-compose down
//sudo rm -rf dist
npm run build (Do NOT use sudo here, build as your normal user)//
sudo docker-compose up -d --build
Vite attempts to empty the output directory (dist) before building. Since root likely owned that folder (or a subdirectory like mockup-templates), your standard user was blocked from removing it, causing the EACCES error. Manually deleting it with sudo clears the blockage.

---------

No worries - let me give you the exact commands to run on your GCP server. SSH into your server and run these:
Run These Commands on Your GCP Server
Step 1: Verify SQLite file exists
cd ~/Linker-test-2ls -la instance/fabric_sourcing.db
Step 2: Run the migration
sudo docker exec -it linker_backend python migrate_sqlite_to_postgres.py
Step 3: Verify fabrics were imported
sudo docker exec -it linker_backend python -c "
from api_server import app, db
from models import Fabric
with app.app_context():
    total = Fabric.query.count()
    live = Fabric.query.filter_by(status='LIVE').count()
    print(f'Total fabrics: {total}')
    print(f'LIVE fabrics: {live}')
"
------------------------------------------------------------------

container config failure:
The bug persists because docker-compose is still trying to inspect old container data. Let's do a complete cleanup:
# Stop and remove ALL containers for this project
sudo docker-compose down

# Remove any orphaned containers
sudo docker container prune -f

# Now rebuild fresh
sudo docker-compose up -d --build

If that still fails, nuclear option:
# List all containers (including stopped)
sudo docker ps -a

# Remove the backend image to force complete rebuild
sudo docker rmi linker-test-2_backend

# Then start fresh
sudo docker-compose up -d --build

--------------------------------------------------------------

ERROR 404

The 404 Not Found error means the web server (Caddy) is running, but it cannot find the website files (specifically index.html) to show you.
This is happening because the previous build failed (the EACCES error in your first screenshot). Since the build didn't finish, the dist folder on your server is likely empty or missing the index.html file.
To fix this, you need to clear the blocked folder and rebuild on your server terminal.
Run these commands in your SSH terminal:
    sudo rm -rf dist
        npm run build
            sudo docker-compose restart caddy


----------------------------------------------
