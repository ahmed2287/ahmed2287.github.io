# HamdyTech — Deployment Guide
## Ubuntu VPS + Nginx (copy-paste ready)

---

## Prerequisites
- Ubuntu 20.04 / 22.04 / 24.04 LTS
- Root or sudo access
- Domain pointed at your server IP

---

## Step 1 — Install Nginx

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx ufw
```

---

## Step 2 — Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
sudo ufw status
```

---

## Step 3 — Upload Site Files

Option A — Git clone (recommended):
```bash
cd /var/www/html
sudo git clone https://github.com/youruser/my-devops.git
sudo chown -R www-data:www-data /var/www/html/my-devops
```

Option B — rsync from local machine:
```bash
rsync -avz --delete /var/www/html/my-devops/ user@YOUR_SERVER_IP:/var/www/html/my-devops/
```

Set correct permissions:
```bash
sudo chown -R www-data:www-data /var/www/html/my-devops
sudo chmod -R 755 /var/www/html/my-devops
```

---

## Step 4 — Configure Nginx

```bash
# Copy the nginx config
sudo cp /var/www/html/my-devops/nginx.conf /etc/nginx/sites-available/hamdy.tech

# Enable the site
sudo ln -s /etc/nginx/sites-available/hamdy.tech /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## Step 5 — SSL Certificate (Let's Encrypt)

```bash
# Replace hamdy.tech with your actual domain
sudo certbot --nginx -d hamdy.tech -d www.hamdy.tech \
  --non-interactive --agree-tos --email your@email.com \
  --redirect

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Step 6 — Auto-renewal Cron

```bash
# Add certbot renewal cron (runs twice daily)
echo "0 0,12 * * * root /usr/bin/certbot renew --quiet" | sudo tee /etc/cron.d/certbot-renew

# Verify nginx starts on boot
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## Step 7 — Final Verification

```bash
# Check nginx is running
sudo systemctl status nginx

# Check site is live
curl -I https://hamdy.tech

# Check SSL
curl -vI https://hamdy.tech 2>&1 | grep "SSL"

# Watch logs
sudo tail -f /var/log/nginx/hamdy.tech.access.log
```

---

## Optional: Deploy via Git Hook (zero-downtime updates)

```bash
# On server — create bare repo
mkdir -p ~/repos/my-devops.git && cd ~/repos/my-devops.git
git init --bare

# Create post-receive hook
cat > hooks/post-receive << 'EOF'
#!/bin/bash
GIT_WORK_TREE=/var/www/html/my-devops git checkout -f main
chown -R www-data:www-data /var/www/html/my-devops
echo "[deploy] Site updated at $(date)"
EOF

chmod +x hooks/post-receive

# On local machine — add remote
git remote add production ssh://user@YOUR_SERVER_IP/~/repos/my-devops.git
# Deploy with:
git push production main
```

---

## Troubleshooting

```bash
# Nginx config test
sudo nginx -t

# Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Check port 80/443 is listening
sudo ss -tlnp | grep nginx

# Reload after config change
sudo systemctl reload nginx

# File permission issues
sudo chown -R www-data:www-data /var/www/html/my-devops
sudo chmod -R 755 /var/www/html/my-devops
```

---

## Production Tailwind CSS Build (optional optimization)

The site uses Tailwind CDN by default, which is fine for production.
For maximum performance, compile Tailwind locally:

```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Tailwind CLI
cd /var/www/html/my-devops
npm install -D tailwindcss

# Create config
npx tailwindcss init

# Add to tailwind.config.js content array:
# content: ["./*.html", "./js/**/*.js"]

# Build optimized CSS
npx tailwindcss -i ./css/custom.css -o ./css/output.css --minify

# In index.html, replace the Tailwind CDN <script> with:
# <link rel="stylesheet" href="css/output.css">
```
