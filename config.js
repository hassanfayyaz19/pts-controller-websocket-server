module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    
    // WebSocket configuration
    wsPath: process.env.WS_PATH || '/ptsWebSocket',
    
    // PTS Controller specific settings
    pts: {
        // Maximum packet ID value (as per documentation: 1-65535)
        maxPacketId: 65535,
        
        // Ping interval in milliseconds (30 seconds as per documentation)
        pingInterval: 30000,
        
        // Connection timeout in milliseconds
        connectionTimeout: 30000,
        
        // Maximum PTS ID length (24 hexadecimal digits as per documentation)
        maxPtsIdLength: 24
    },
    
    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: false
    },
    
    // CORS configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
}; 