module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    
    // WebSocket configuration
    wsPath: process.env.WS_PATH || '/ptsWebSocket',
    
    // PTS Controller specific settings
    pts: {
        // Maximum packet ID value (as per documentation: 1-65535)
        maxPacketId: parseInt(process.env.PTS_MAX_PACKET_ID) || 65535,
        
        // Ping interval in milliseconds (30 seconds as per documentation)
        pingInterval: parseInt(process.env.PTS_PING_INTERVAL) || 30000,
        
        // Connection timeout in milliseconds
        connectionTimeout: parseInt(process.env.PTS_CONNECTION_TIMEOUT) || 30000,
        
        // Maximum PTS ID length (24 hexadecimal digits as per documentation)
        maxPtsIdLength: parseInt(process.env.PTS_MAX_ID_LENGTH) || 24
    },
    
    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: process.env.LOG_ENABLE_FILE !== 'false',
        directory: process.env.LOG_DIR || 'logs',
        retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
        enableRotation: process.env.ENABLE_LOG_ROTATION !== 'false',
        rotationSizeMB: parseInt(process.env.LOG_ROTATION_SIZE) || 100
    },
    
    // CORS configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS !== 'false'
    },
    
    // Security configuration
    security: {
        enableAuth: process.env.ENABLE_AUTH === 'true',
        jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
        maxConnectionsPerIP: parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 10,
        maxMessagesPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || 100
    },
    
    // Database configuration (optional)
    database: {
        type: process.env.DB_TYPE || null,
        connectionString: process.env.DB_CONNECTION_STRING || null,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 27017,
        name: process.env.DB_NAME || 'pts_controller',
        username: process.env.DB_USERNAME || null,
        password: process.env.DB_PASSWORD || null
    },
    
    // Monitoring and metrics
    monitoring: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
        enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
    },
    
    // Notification configuration (optional)
    notifications: {
        enableEmail: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            username: process.env.SMTP_USERNAME || null,
            password: process.env.SMTP_PASSWORD || null
        },
        recipients: process.env.NOTIFICATION_EMAILS ? 
            process.env.NOTIFICATION_EMAILS.split(',').map(email => email.trim()) : []
    },
    
    // Production settings
    production: {
        environment: process.env.NODE_ENV || 'development',
        enableHttps: process.env.ENABLE_HTTPS === 'true',
        ssl: {
            certPath: process.env.SSL_CERT_PATH || null,
            keyPath: process.env.SSL_KEY_PATH || null
        }
    },
    
    // Debug and development
    debug: {
        enabled: process.env.DEBUG === 'true',
        verboseLogging: process.env.VERBOSE_LOGGING === 'true',
        logRequests: process.env.LOG_REQUESTS === 'true'
    },
    
    // Performance tuning
    performance: {
        maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
        wsBufferSize: parseInt(process.env.WS_BUFFER_SIZE) || 65536,
        httpTimeout: parseInt(process.env.HTTP_TIMEOUT) || 30000
    },
    
    // Backup and maintenance
    maintenance: {
        enableBackup: process.env.ENABLE_BACKUP === 'true',
        backupDir: process.env.BACKUP_DIR || 'backups',
        backupRetentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7
    },
    
    // Helper methods
    isDevelopment: () => process.env.NODE_ENV === 'development',
    isProduction: () => process.env.NODE_ENV === 'production',
    isTest: () => process.env.NODE_ENV === 'test',
    
    // Get full WebSocket URL for a given host and port
    getWebSocketUrl: (host, port) => {
        const protocol = process.env.ENABLE_HTTPS === 'true' ? 'wss' : 'ws';
        return `${protocol}://${host}:${port}${process.env.WS_PATH || '/ptsWebSocket'}`;
    },
    
    // Get server request URI (without starting slash for PTS controller GUI)
    getServerRequestUri: () => {
        const wsPath = process.env.WS_PATH || '/ptsWebSocket';
        return wsPath.startsWith('/') ? wsPath.substring(1) : wsPath;
    }
}; 