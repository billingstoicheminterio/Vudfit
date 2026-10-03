# Hostinger Deployment Guide

This guide details how to host the **VUDFIT Modular Kitchen Inventory Management System** using **Hostinger**.

Since the application uses a **FastAPI (Python) backend** and a **React (Vite) frontend**, it requires running a persistent background process (Uvicorn). Therefore, **Hostinger VPS Hosting** (running Ubuntu 22.04 or 24.04 LTS) is the recommended hosting plan. Standard shared hosting does not support persistent background services.

---

## Phase 1: DNS & VPS Initialization (Hostinger hPanel)

### 1. Set Up Your VPS
1. Log into your **Hostinger hPanel**.
2. Purchase or select your **VPS Hosting Plan** (e.g., VPS 1 or VPS 2).
3. Set the operating system to **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS**.
4. Save your **VPS IP Address** and set your **SSH Root Password**.

### 2. Configure DNS Records
To connect your domain (e.g., `inventory.vudfit.com` or `vudfit.com`) to the Hostinger VPS:
1. In hPanel, go to **Domains** -> Select your domain -> **DNS / Nameservers**.
2. Add an **A Record**:
   - **Type**: `A`
   - **Name**: `inventory` (for `inventory.yourdomain.com`) or `@` (for root `yourdomain.com`)
   - **Points to**: `YOUR_VPS_IP_ADDRESS`
   - **TTL**: `14400` (or default)
3. Click **Add Record**. (DNS propagation may take 5–15 minutes).

---

## Phase 2: Server Configuration (SSH)

Connect to your VPS from your local Windows command prompt or PowerShell:
```bash
ssh root@YOUR_VPS_IP_ADDRESS
```
*(Enter the SSH root password you set in hPanel)*

### 1. Update Packages & Dependencies
Run the following commands to install Python, Node.js, and Nginx:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git python3-pip python3-venv nginx sqlite3 curl -y
```

### 2. Upload and Prepare Project Directory
Create the application directory:
```bash
sudo mkdir -p /var/www/vudfit
sudo chown -R root:www-data /var/www/vudfit
```
Using an SFTP client (like FileZilla, WinSCP, or Git), upload your backend files and frontend folder to the server:
- Backend files go into: `/var/www/vudfit/backend`
- Frontend files go into: `/var/www/vudfit/frontend`

---

## Phase 3: Backend Deployment (FastAPI)

### 1. Setup Python Virtual Environment
Navigate to the backend directory, create a virtual environment, and install dependencies:
```bash
cd /var/www/vudfit/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Run Database Seeding
Ensure the initial admin accounts, default brands, and categories are populated:
```bash
python3 app/seed.py
```

### 3. Create Systemd Service (Keep Backend Running)
To ensure the FastAPI backend starts automatically on boot and recovers from crashes:
```bash
sudo nano /etc/systemd/system/vudfit-backend.service
```
Paste this configuration:
```ini
[Unit]
Description=VUDFIT FastAPI Backend Service
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/vudfit/backend
ExecStart=/var/www/vudfit/backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```
*Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit.*

Start and enable the backend service:
```bash
sudo systemctl daemon-reload
sudo systemctl start vudfit-backend
sudo systemctl enable vudfit-backend
```
To verify that the backend is running:
```bash
sudo systemctl status vudfit-backend
```

---

## Phase 4: Frontend Deployment (React Static Build)

On your local machine, compile the production-ready static bundle inside the `frontend` folder:
```bash
npm run build
```
This outputs all compiled assets to the `frontend/dist/` directory.

Upload the contents of `frontend/dist/` to the server at:
`/var/www/vudfit/frontend/dist`

---

## Phase 5: Reverse Proxy (Nginx Setup)

Create an Nginx configuration file to serve the static frontend and route API requests:
```bash
sudo nano /etc/nginx/sites-available/vudfit
```
Paste the following server block (replace `inventory.yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name inventory.yourdomain.com;

    # Frontend - Serve static compiled React files
    location / {
        root /var/www/vudfit/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Serve static uploaded product images
    location /static/uploads/ {
        alias /var/www/vudfit/backend/storage/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Backend API proxy redirection
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/vudfit /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Phase 6: Secure with SSL (HTTPS)

Install Let's Encrypt Certbot to configure auto-renewing SSL certificates:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d inventory.yourdomain.com
```
Follow the prompts (enter email and agree to terms). Certbot will automatically redirect all `HTTP` requests to secure `HTTPS` traffic.

---

## Maintenance & Database Backups
- The database is a single file located at `/var/www/vudfit/backend/storage/inventory.db`.
- Back up this file daily.
- When pushing software updates, pull/upload files and run:
  ```bash
  sudo systemctl restart vudfit-backend
  ```
