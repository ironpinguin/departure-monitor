# Apache Installation Guide for Departure Monitor

This guide provides essential instructions for deploying the Departure Monitor application using Apache HTTP Server as a web server and reverse proxy.

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

- **Apache HTTP Server**: Version 2.4+ (recommended 2.4.41+)
- **Firewall**: UFW, iptables, or similar for security

### Apache Installation

#### Ubuntu/Debian

```bash
# Update package index
sudo apt update

# Install Apache
sudo apt install apache2

# Start and enable Apache
sudo systemctl start apache2
sudo systemctl enable apache2

# Verify installation
apache2 -v
```

#### CentOS/RHEL/Rocky Linux

```bash
# Install Apache (httpd)
sudo dnf install httpd

# Start and enable Apache
sudo systemctl start httpd
sudo systemctl enable httpd

# Verify installation
httpd -v
```

#### Verify Apache is Running

```bash
# Check service status
sudo systemctl status apache2  # Ubuntu/Debian
sudo systemctl status httpd    # CentOS/RHEL

# Test configuration
sudo apache2ctl configtest     # Ubuntu/Debian
sudo httpd -t                  # CentOS/RHEL

# Check if Apache is listening on port 80
sudo netstat -tlnp | grep :80
```

### Required Apache Modules

Enable necessary modules for the Departure Monitor application:

```bash
# Ubuntu/Debian
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate

# CentOS/RHEL (modules are typically enabled by default)
# Verify modules are loaded
httpd -M | grep -E "(rewrite|proxy|headers|expires|deflate)"
```

## Installation Steps

### Step 1: Download and Extract Application

1. **Download the latest release archive:**

```bash
# Create application directory
sudo mkdir -p /var/www/html/departure-monitor

# Download the latest release (replace with actual URL)
wget https://github.com/ironpinguin/departure-monitor/releases/latest/download/departure-monitor-v1.0.1.tar.gz

# Extract to web directory
sudo tar -xzf departure-monitor-v1.0.1.tar.gz -C /var/www/html/departure-monitor --strip-components=1
```

2. **Alternative: Extract from zip archive:**

```bash
# If using zip archive
unzip departure-monitor-v1.0.1.zip
sudo cp -r departure-monitor/* /var/www/html/departure-monitor/
```

### Step 2: Set Proper Permissions

```bash
# Set ownership to Apache user
# Ubuntu/Debian
sudo chown -R www-data:www-data /var/www/html/departure-monitor

# CentOS/RHEL
sudo chown -R apache:apache /var/www/html/departure-monitor

# Set appropriate permissions
sudo chmod -R 755 /var/www/html/departure-monitor
sudo find /var/www/html/departure-monitor -type f -exec chmod 644 {} \;
```

### Step 3: Backup Default Configuration

```bash
# Ubuntu/Debian
sudo cp /etc/apache2/apache2.conf /etc/apache2/apache2.conf.backup
sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.backup

# CentOS/RHEL
sudo cp /etc/httpd/conf/httpd.conf /etc/httpd/conf/httpd.conf.backup
```

### Step 4: Create Virtual Host Configuration

#### Ubuntu/Debian

Create `/etc/apache2/sites-available/departure-monitor.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/html/departure-monitor
    
    # Enable rewrite engine for SPA routing
    RewriteEngine On
    
    # Handle SPA routing - redirect all non-file requests to index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/(wuerzburg-api|mvv-api)/
    RewriteRule ^(.*)$ /index.html [QSA,L]
    
    # API Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Würzburg public transport API
    ProxyPass /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
    ProxyPassReverse /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
    
    # Munich MVV API
    ProxyPass /mvv-api/ https://www.mvv-muenchen.de/
    ProxyPassReverse /mvv-api/ https://www.mvv-muenchen.de/
    
    # Set proxy headers
    <Location "/wuerzburg-api/">
        RequestHeader set Host "whitelabel.bahnland-bayern.de"
        RequestHeader set X-Forwarded-Proto "https"
    </Location>
    
    <Location "/mvv-api/">
        RequestHeader set Host "www.mvv-muenchen.de"
        RequestHeader set X-Forwarded-Proto "https"
    </Location>
    
    # Cache static assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 30 days"
        Header append Cache-Control "public, no-transform"
    </LocationMatch>
    
    # Never cache HTML files (for SPA routing)
    <LocationMatch "\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 0 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
    </LocationMatch>
    
    # Basic security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/departure-monitor_error.log
    CustomLog ${APACHE_LOG_DIR}/departure-monitor_access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite departure-monitor.conf
sudo a2dissite 000-default.conf
```

#### CentOS/RHEL

Add to `/etc/httpd/conf.d/departure-monitor.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/html/departure-monitor
    
    # Enable rewrite engine for SPA routing
    RewriteEngine On
    
    # Handle SPA routing - redirect all non-file requests to index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/(wuerzburg-api|mvv-api)/
    RewriteRule ^(.*)$ /index.html [QSA,L]
    
    # API Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Würzburg public transport API
    ProxyPass /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
    ProxyPassReverse /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
    
    # Munich MVV API
    ProxyPass /mvv-api/ https://www.mvv-muenchen.de/
    ProxyPassReverse /mvv-api/ https://www.mvv-muenchen.de/
    
    # Set proxy headers
    <Location "/wuerzburg-api/">
        RequestHeader set Host "whitelabel.bahnland-bayern.de"
        RequestHeader set X-Forwarded-Proto "https"
    </Location>
    
    <Location "/mvv-api/">
        RequestHeader set Host "www.mvv-muenchen.de"
        RequestHeader set X-Forwarded-Proto "https"
    </Location>
    
    # Cache static assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 30 days"
        Header append Cache-Control "public, no-transform"
    </LocationMatch>
    
    # Never cache HTML files (for SPA routing)
    <LocationMatch "\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 0 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
    </LocationMatch>
    
    # Basic security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logging
    ErrorLog /var/log/httpd/departure-monitor_error.log
    CustomLog /var/log/httpd/departure-monitor_access.log combined
</VirtualHost>
```

### Step 5: Test and Reload Configuration

```bash
# Test Apache configuration
# Ubuntu/Debian
sudo apache2ctl configtest

# CentOS/RHEL
sudo httpd -t

# If test passes, reload Apache
# Ubuntu/Debian
sudo systemctl reload apache2

# CentOS/RHEL
sudo systemctl reload httpd

# Check status
# Ubuntu/Debian
sudo systemctl status apache2

# CentOS/RHEL
sudo systemctl status httpd
```

### Step 6: Configure Firewall

#### Using UFW (Ubuntu/Debian)

```bash
# Allow HTTP traffic
sudo ufw allow 'Apache'

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

### Understanding the Apache Configuration

The Apache configuration for the Departure Monitor application includes three essential components:

#### 1. SPA Routing with mod_rewrite

```apache
# Enable rewrite engine
RewriteEngine On

# Handle SPA routing - redirect all non-file requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f          # Not a file
RewriteCond %{REQUEST_FILENAME} !-d          # Not a directory
RewriteCond %{REQUEST_URI} !^/(wuerzburg-api|mvv-api)/  # Not API endpoints
RewriteRule ^(.*)$ /index.html [QSA,L]       # Redirect to index.html
```

This ensures that React Router can handle client-side navigation properly.

#### 2. API Proxy Configuration with mod_proxy

The application requires proxying to external APIs to avoid CORS issues:

```apache
# Enable proxy modules
ProxyPreserveHost On
ProxyRequests Off

# Würzburg public transport API
ProxyPass /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
ProxyPassReverse /wuerzburg-api/ https://whitelabel.bahnland-bayern.de/

# Munich MVV API
ProxyPass /mvv-api/ https://www.mvv-muenchen.de/
ProxyPassReverse /mvv-api/ https://www.mvv-muenchen.de/

# Set appropriate headers for proxied requests
<Location "/wuerzburg-api/">
    RequestHeader set Host "whitelabel.bahnland-bayern.de"
    RequestHeader set X-Forwarded-Proto "https"
</Location>

<Location "/mvv-api/">
    RequestHeader set Host "www.mvv-muenchen.de"
    RequestHeader set X-Forwarded-Proto "https"
</Location>
```

#### 3. Static Asset Caching with mod_expires and mod_headers

```apache
# Cache static assets for 30 days
<LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 30 days"
    Header append Cache-Control "public, no-transform"
</LocationMatch>

# Never cache HTML files (important for SPA routing)
<LocationMatch "\.html$">
    ExpiresActive On
    ExpiresDefault "access plus 0 seconds"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
</LocationMatch>
```

### Subdirectory Deployment

If deploying to a subdirectory (e.g., `https://example.com/departure-monitor/`):

```apache
Alias /departure-monitor /var/www/html/departure-monitor

<Directory "/var/www/html/departure-monitor">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    
    # SPA routing for subdirectory
    RewriteEngine On
    RewriteBase /departure-monitor/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/departure-monitor/(wuerzburg-api|mvv-api)/
    RewriteRule ^(.*)$ /departure-monitor/index.html [QSA,L]
</Directory>

# API proxies for subdirectory deployment
ProxyPass /departure-monitor/wuerzburg-api/ https://whitelabel.bahnland-bayern.de/
ProxyPassReverse /departure-monitor/wuerzburg-api/ https://whitelabel.bahnland-bayern.de/

ProxyPass /departure-monitor/mvv-api/ https://www.mvv-muenchen.de/
ProxyPassReverse /departure-monitor/mvv-api/ https://www.mvv-muenchen.de/
```

### .htaccess for Shared Hosting

If you're using shared hosting without access to virtual host configuration, create a `.htaccess` file in the application root:

```apache
# .htaccess for Departure Monitor on shared hosting

# Enable rewrite engine
RewriteEngine On

# Handle SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/(wuerzburg-api|mvv-api)/
RewriteRule ^(.*)$ /index.html [QSA,L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 30 days"
    ExpiresByType application/javascript "access plus 30 days"
    ExpiresByType image/png "access plus 30 days"
    ExpiresByType image/jpg "access plus 30 days"
    ExpiresByType image/jpeg "access plus 30 days"
    ExpiresByType image/gif "access plus 30 days"
    ExpiresByType image/svg+xml "access plus 30 days"
    ExpiresByType font/woff "access plus 30 days"
    ExpiresByType font/woff2 "access plus 30 days"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Note: API proxying requires server-level configuration
# Contact your hosting provider for proxy setup
```

## Additional Configuration

For advanced features like SSL/TLS setup, performance optimization, monitoring, and troubleshooting, please refer to the official Apache documentation:

- **SSL/TLS Configuration**: [Apache SSL/TLS Encryption](https://httpd.apache.org/docs/2.4/ssl/)
- **Performance Tuning**: [Apache Performance Tuning](https://httpd.apache.org/docs/2.4/misc/perf-tuning.html)
- **Rate Limiting**: [Apache mod_evasive](https://github.com/jzdziarski/mod_evasive)
- **Monitoring**: [Apache Log Files](https://httpd.apache.org/docs/2.4/logs.html)
- **Troubleshooting**: [Apache Error Messages](https://httpd.apache.org/docs/2.4/faq/error.html)

For SSL certificates, we recommend using [Let's Encrypt with Certbot](https://certbot.eff.org/instructions?ws=apache).

## Conclusion

This guide provides the essential setup for deploying the Departure Monitor application with Apache HTTP Server. The configuration supports SPA routing with mod_rewrite, API proxying with mod_proxy, and basic static asset caching.

Key benefits of the Apache deployment:
- **Flexible configuration** with virtual hosts and .htaccess support
- **Robust proxy capabilities** for API integration
- **Comprehensive caching strategies** for optimal performance
- **Excellent shared hosting compatibility**

For additional support or questions, refer to the project's [GitHub repository](https://github.com/ironpinguin/departure-monitor) or the official [Apache HTTP Server documentation](https://httpd.apache.org/docs/).