# Environment Variables Quick Reference

This guide provides a quick reference for the most important environment variables used by the PTS Controller WebSocket Server.

## 🚀 Quick Start

1. **Copy the example file**:
   ```bash
   cp env.example .env
   ```

2. **Edit .env file** with your values
3. **Start the server**: `npm start`

## 🔧 Essential Configuration

### Server Settings
```bash
# Server port (default: 3000)
PORT=3000

# Server host (default: 0.0.0.0 - all interfaces)
HOST=0.0.0.0

# WebSocket path (default: /ptsWebSocket)
WS_PATH=/ptsWebSocket
```

### PTS Controller Settings
```bash
# Ping interval in milliseconds (default: 30000)
PTS_PING_INTERVAL=30000

# Connection timeout (default: 30000)
PTS_CONNECTION_TIMEOUT=30000
```

### Logging
```bash
# Log level: debug, info, warn, error (default: info)
LOG_LEVEL=info

# Enable file logging (default: true)
LOG_ENABLE_FILE=true

# Log retention in days (default: 30)
LOG_RETENTION_DAYS=30
```

## 🏭 Production Settings

### Security
```bash
# Enable authentication (default: false)
ENABLE_AUTH=true

# JWT secret (change this!)
JWT_SECRET=your-super-secure-secret-key

# Rate limiting
MAX_CONNECTIONS_PER_IP=10
MAX_MESSAGES_PER_MINUTE=100
```

### HTTPS/WSS
```bash
# Enable HTTPS (default: false)
ENABLE_HTTPS=true

# SSL certificate paths
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Environment
```bash
# Set to production
NODE_ENV=production

# Disable debug features
DEBUG=false
VERBOSE_LOGGING=false
```

## 🗄️ Database Configuration (Optional)

```bash
# Database type
DB_TYPE=mongodb

# Connection details
DB_HOST=localhost
DB_PORT=27017
DB_NAME=pts_controller
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Or use connection string
DB_CONNECTION_STRING=mongodb://user:pass@host:port/db
```

## 📧 Email Notifications (Optional)

```bash
# Enable email notifications
ENABLE_EMAIL_NOTIFICATIONS=true

# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Recipients (comma-separated)
NOTIFICATION_EMAILS=admin@company.com,ops@company.com
```

## 📊 Monitoring (Optional)

```bash
# Enable metrics collection
ENABLE_METRICS=true
METRICS_PORT=9090

# Health check settings
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_INTERVAL=30000
```

## 🔍 Debug & Development

```bash
# Debug mode
DEBUG=true

# Verbose logging
VERBOSE_LOGGING=true

# Log all requests
LOG_REQUESTS=true
```

## ⚡ Performance Tuning

```bash
# Maximum connections
MAX_CONNECTIONS=1000

# Buffer sizes
WS_BUFFER_SIZE=65536
HTTP_TIMEOUT=30000
```

## 📁 File Management

```bash
# Log directory
LOG_DIR=logs

# Log rotation
ENABLE_LOG_ROTATION=true
LOG_ROTATION_SIZE=100

# Backup settings
ENABLE_BACKUP=true
BACKUP_DIR=backups
BACKUP_RETENTION_DAYS=7
```

## 🌐 CORS Settings

```bash
# CORS origin (use * for development)
CORS_ORIGIN=*

# Enable credentials
CORS_CREDENTIALS=true
```

## 📋 Configuration Examples

### Development Environment
```bash
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
VERBOSE_LOGGING=true
CORS_ORIGIN=*
```

### Production Environment
```bash
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false
VERBOSE_LOGGING=false
ENABLE_AUTH=true
ENABLE_HTTPS=true
CORS_ORIGIN=https://yourdomain.com
```

### Local Network Only
```bash
HOST=192.168.1.100
PORT=3000
CORS_ORIGIN=*
LOG_LEVEL=info
```

## 🚨 Important Notes

1. **JWT_SECRET**: Always change this in production
2. **CORS_ORIGIN**: Use specific domains in production, not `*`
3. **ENABLE_AUTH**: Set to `true` for production security
4. **NODE_ENV**: Set to `production` for production deployments
5. **SSL Certificates**: Required for HTTPS/WSS in production

## 🔧 Setup Script

Use the provided setup script to create your `.env` file:

```bash
./setup-env.sh
```

This will:
- Copy `env.example` to `.env`
- Preserve existing `.env` files (with confirmation)
- Provide next steps guidance

## 📖 Full Documentation

For complete environment variable documentation, see `env.example` file.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: Change `PORT` value
2. **Permission denied**: Check file permissions on `.env`
3. **Invalid values**: Ensure numeric values are valid numbers
4. **Missing variables**: Check `env.example` for required variables

### Validation

The server will validate environment variables on startup. Check console output for any configuration warnings or errors. 