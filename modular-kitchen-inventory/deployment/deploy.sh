#!/bin/bash

# VUDFIT Automatic VPS Deployment Script
# Run this on your Ubuntu VPS as root: sudo bash deploy.sh

set -e

echo "=== Starting VUDFIT Production Deployment ==="

# 1. Update and install packages
echo "--> Installing system packages..."
apt update
apt install -y git python3-pip python3-venv nginx sqlite3 postgresql postgresql-contrib curl certbot python3-certbot-nginx

# 2. Setup server directory permissions
echo "--> Adjusting permissions for /var/www/vudfit..."
mkdir -p /var/www/vudfit/storage/uploads
chown -R root:www-data /var/www/vudfit
chmod -R 775 /var/www/vudfit/storage

# 3. Setup PostgreSQL database and user
echo "--> Configuring PostgreSQL database..."
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql -c "CREATE USER vudfit_user WITH PASSWORD 'vudfit_secure_pass';" || true
sudo -u postgres psql -c "ALTER USER vudfit_user WITH PASSWORD 'vudfit_secure_pass';"
sudo -u postgres psql -c "CREATE DATABASE vudfit_db OWNER vudfit_user;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vudfit_db TO vudfit_user;"
sudo -u postgres psql -d vudfit_db -c "GRANT ALL ON SCHEMA public TO vudfit_user;" || true

# 4. Setup Python backend virtual environment
echo "--> Setting up Python Virtual Environment..."
cd /var/www/vudfit/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. Seed Database or Migrate from SQLite
echo "--> Initializing database..."
export DATABASE_URL=postgresql://vudfit_user:vudfit_secure_pass@localhost/vudfit_db
if [ -f "/var/www/vudfit/storage/inventory.db" ]; then
    echo "--> Existing SQLite database found! Running data migration to PostgreSQL..."
    python3 app/migrate_sqlite_to_pg.py || { echo "Migration script failed. Seeding new database..."; python3 app/seed.py; }
else
    echo "--> No existing SQLite database found. Seeding default data to PostgreSQL..."
    python3 app/seed.py
fi

# 5. Configure Systemd Service
echo "--> Configuring systemd service..."
cp /var/www/vudfit/deployment/vudfit-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable vudfit-backend
systemctl restart vudfit-backend

# 6. Configure Nginx
echo "--> Configuring Nginx reverse proxy..."
cp /var/www/vudfit/deployment/nginx.conf /etc/nginx/sites-available/vudfit

# Check if Nginx configuration already linked, if not link it
if [ ! -f /etc/nginx/sites-enabled/vudfit ]; then
    ln -s /etc/nginx/sites-available/vudfit /etc/nginx/sites-enabled/
fi

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
nginx -t

# Restart Nginx
systemctl restart nginx

echo "=== Deployment script complete! ==="
echo ""
echo "Next steps remaining:"
echo "1. Run local build: 'npm run build' inside frontend/"
echo "2. SFTP upload frontend/dist/* files to VPS path: /var/www/vudfit/frontend/dist"
echo "3. Run SSL setup: 'sudo certbot --nginx -d yourdomain.com'"
