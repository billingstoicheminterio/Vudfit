# Vudfit Production Deployment Guide

This guide outlines the steps to host the **Vudfit Inventory Management System** on your custom domain (e.g., `vudfit.com` or `inventory.vudfit.com`). 

We recommend deploying the application on a **Linux Virtual Private Server (VPS)** (e.g., DigitalOcean, AWS EC2, Linode, or Hetzner) running **Ubuntu 22.04 LTS / 24.04 LTS**.

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │    DNS (Godaddy/etc.)    │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   Nginx (Port 80/443)    │
                          └──────┬────────────┬──────┘
                                 │            │
             (Routes /api/*)     ▼            ▼     (Routes /*)
             ┌───────────────────────┐    ┌───────────────────────┐
             │ FastAPI (Port 8000)   │    │ Static React Frontend │
             └───────────┬───────────┘    └───────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  SQLite Database file │
             └───────────────────────┘
```

---

## Step 1: Prepare the Server (VPS)

1. Connect to your VPS via SSH:
   ```bash
   ssh root@your_server_ip
   ```
2. Update the system packages and install dependencies (Python, Node.js, and Nginx):
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install git python3-pip python3-venv nginx sqlite3 curl -y
   ```

---

## Step 2: Set up the Backend (FastAPI)

1. Clone or upload your project files to `/var/www/vudfit` on the server.
2. Create a virtual environment and install backend requirements:
   ```bash
   cd /var/www/vudfit/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. Run the database seed script to initialize users and categories:
   ```bash
   python3 app/seed.py
   ```
4. Create a systemd service file to keep FastAPI running in the background:
   ```bash
   sudo nano /etc/systemd/system/vudfit-backend.service
   ```
5. Paste the following configuration:
   ```ini
   [Unit]
   Description=Vudfit FastAPI Backend Service
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/vudfit/backend
   ExecStart=/var/www/vudfit/backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
6. Start and enable the backend service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start vudfit-backend
   sudo systemctl enable vudfit-backend
   ```
   *Verify status using: `sudo systemctl status vudfit-backend`*

---

## Step 3: Set up the Frontend (React Build)

1. On your local machine, open the `frontend` folder and build the application:
   ```bash
   npm run build
   ```
   *This compiles everything into a `dist/` directory (optimized static HTML, JS, and CSS files).*
2. Upload the `frontend/dist` directory to your server at `/var/www/vudfit/frontend/dist` using SFTP or SCP:
   ```bash
   scp -r dist/* root@your_server_ip:/var/www/vudfit/frontend/dist
   ```

---

## Step 4: Configure DNS & Nginx

1. Log into your Domain Registrar (GoDaddy, Namecheap, Cloudflare, etc.).
2. Add an **A Record** pointing to your VPS Server IP:
   - Host: `@` (or `inventory` if you want `inventory.vudfit.com`)
   - Value: `your_server_ip`
3. Create an Nginx site configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/vudfit
   ```
4. Paste the Nginx configuration block (replacing `yourdomain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend - Serve static compiled React files
       location / {
           root /var/www/vudfit/frontend/dist;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
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
5. Enable the site configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vudfit /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Step 5: Secure with SSL (HTTPS)

It is critical to encrypt your connection so usernames, passwords, and API tokens are not sent in plain text.

1. Install Certbot (Let's Encrypt client):
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. Request a free SSL certificate for your domain:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
3. Follow the prompts (enter email and agree to terms). Certbot will automatically rewrite your Nginx file to enable SSL redirection (`HTTP` to `HTTPS`) and generate certificate files.

---

## Maintenance & Database Backups
Since the database is SQLite, it is contained in a single file located at `/var/www/vudfit/backend/storage/inventory.db`.
- To back up your data, simply copy this `inventory.db` file to a secure cloud backup once a day.
- To upgrade your application code in the future, just pull updates via Git and run `sudo systemctl restart vudfit-backend` and rebuild the frontend.
