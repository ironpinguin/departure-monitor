# Nginx Installation Guide for Departure Monitor

This guide provides essential instructions for deploying the Departure Monitor application using Nginx as a web server and reverse proxy.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Configuration](#configuration)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+, or similar)
- **RAM**: Minimum 512MB, recommended 1GB+
- **Storage**: At least 100MB free space for the application
- **Network**: Internet access for API proxying

### Required Software

- **Nginx**: Version 1.18+ (recommended 1.20+)
- **Firewall**: UFW, iptables, or similar for security

### Nginx Installation

#### Ubuntu/Debian

```bash
# Update package index
sudo apt update

# Install Nginx
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

#### CentOS/RHEL/Rocky Linux

```bash
# Install EPEL repository (if not already installed)
sudo dnf install epel-release

# Install Nginx
sudo dnf install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

#### Verify Nginx is Running

```bash
# Check service status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check if Nginx is listening on port 80
sudo netstat -tlnp | grep :80
```

## Installation Steps

### Step 1: Download and Extract Application

1. **Download the latest release archive:**

```bash
# Create application directory
sudo mkdir -p /var/www/departure-monitor

# Download the latest release (replace with actual URL)
wget https://github.com/ironpinguin/departure-monitor/releases/latest/download/departure-monitor-v1.0.1.tar.gz

# Extract to web directory
sudo tar -xzf departure-monitor-v1.0.1.tar.gz -C /var/www/departure-monitor --strip-components=1
```

2. **Alternative: Extract from zip archive:**

```bash
# If using zip archive
unzip departure-monitor-v1.0.1.zip
sudo cp -r departure-monitor/* /var/www/departure-monitor/
```

### Step 2: Set Proper Permissions

```bash
# Set ownership to nginx user
sudo chown -R nginx:nginx /var/www/departure-monitor

# Set appropriate permissions
sudo chmod -R 755 /var/www/departure-monitor
sudo chmod -R 644 /var/www/departure-monitor/*
```

### Step 3: Backup Default Configuration

```bash
# Backup default nginx configuration
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Backup default site configuration (if exists)
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || true
```

### Step 4: Deploy Nginx Configuration

Create `/etc/nginx/sites-available/departure-monitor.conf` (Ubuntu/Debian) or add to `/etc/nginx/conf.d/departure-monitor.conf` (CentOS/RHEL):

```nginx
server {
    listen 80;
    # Replace with your actual domain name
    server_name your-domain.com www.your-domain.com;
    root /var/www/departure-monitor;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/plain;

    # Single Page Application routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Never cache HTML files (for SPA routing)
    location ~* \.html$ {
        expires epoch;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    # Würzburg public transport API proxy
    location /wuerzburg-api/ {
        rewrite ^/wuerzburg-api/(.*)$ /$1 break;
        proxy_pass https://whitelabel.bahnland-bayern.de/;
        proxy_set_header Host whitelabel.bahnland-bayern.de;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Munich MVV API proxy
    location /mvv-api/ {
        rewrite ^/mvv-api/(.*)$ /$1 break;
        proxy_pass https://www.mvv-muenchen.de/;
        proxy_set_header Host www.mvv-muenchen.de;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Basic security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Ensure 404 errors redirect to index.html for client-side routing
    error_page 404 /index.html;
}
```

### Step 5: Enable Site and Test Configuration

#### Ubuntu/Debian

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/departure-monitor.conf /etc/nginx/sites-enabled/

# Disable default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

#### Test and Reload Configuration

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Step 6: Configure Firewall

#### Using UFW (Ubuntu/Debian)

```bash
# Allow HTTP traffic
sudo ufw allow 'Nginx HTTP'

# Enable firewall if not already enabled
sudo ufw enable

# Check status
sudo ufw status
```

#### Using firewalld (CentOS/RHEL)

```bash
# Allow HTTP traffic
sudo firewall-cmd --permanent --add-service=http

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## Configuration

### Understanding the Nginx Configuration

The Nginx configuration for the Departure Monitor application includes three essential components:

#### 1. SPA Routing Support

```nginx
# Single Page Application routing
location / {
    try_files $uri $uri/ /index.html;
}

# Ensure 404 errors redirect to index.html for client-side routing
error_page 404 /index.html;
```

This ensures that React Router can handle client-side navigation properly.

#### 2. API Proxy Configuration

The application requires proxying to external APIs to avoid CORS issues:

```nginx
# Würzburg public transport API
location /wuerzburg-api/ {
    rewrite ^/wuerzburg-api/(.*)$ /$1 break;
    proxy_pass https://whitelabel.bahnland-bayern.de/;
    proxy_set_header Host whitelabel.bahnland-bayern.de;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Munich MVV API
location /mvv-api/ {
    rewrite ^/mvv-api/(.*)$ /$1 break;
    proxy_pass https://www.mvv-muenchen.de/;
    proxy_set_header Host www.mvv-muenchen.de;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 3. Static Asset Caching

```nginx
# Cache static assets for 30 days
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}

# Never cache HTML files (important for SPA routing)
location ~* \.html$ {
    expires epoch;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
}
```

### Subdirectory Deployment

If deploying to a subdirectory (e.g., `https://example.com/departure-monitor/`):

```nginx
location /departure-monitor {
    alias /var/www/departure-monitor;
    try_files $uri $uri/ /departure-monitor/index.html;
}

location /departure-monitor/wuerzburg-api/ {
    rewrite ^/departure-monitor/wuerzburg-api/(.*)$ /$1 break;
    proxy_pass https://whitelabel.bahnland-bayern.de/;
    # ... proxy headers
}

location /departure-monitor/mvv-api/ {
    rewrite ^/departure-monitor/mvv-api/(.*)$ /$1 break;
    proxy_pass https://www.mvv-muenchen.de/;
    # ... proxy headers
}
```

## Additional Configuration

For advanced features like SSL/TLS setup, performance optimization, monitoring, and troubleshooting, please refer to the official Nginx documentation:

- **SSL/TLS Configuration**: [Nginx SSL Module Documentation](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- **Performance Tuning**: [Nginx Performance Tuning Guide](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- **Rate Limiting**: [Nginx Rate Limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- **Monitoring**: [Nginx Logging](https://nginx.org/en/docs/http/ngx_http_log_module.html)
- **Troubleshooting**: [Nginx Debugging](https://nginx.org/en/docs/debugging_log.html)

For SSL certificates, we recommend using [Let's Encrypt with Certbot](https://certbot.eff.org/instructions?ws=nginx).

## Conclusion

This guide provides the essential setup for deploying the Departure Monitor application with Nginx. The configuration supports SPA routing, API proxying, and basic static asset caching.

For additional support or questions, refer to the project's [GitHub repository](https://github.com/ironpinguin/departure-monitor) or the official [Nginx documentation](https://nginx.org/en/docs/).