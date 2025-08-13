const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const PTSLogger = require('./utils/logger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create WebSocket server with specific path for PTS controllers
// Add perMessageDeflate: false to handle compression issues
const wss = new WebSocket.Server({ 
    server,
    path: '/ptsWebSocket',
    perMessageDeflate: false,  // Disable compression to avoid protocol issues
    maxPayload: 1024 * 1024,  // 1MB max payload
    skipUTF8Validation: true,  // Skip UTF8 validation for binary data
    clientTracking: true       // Enable client tracking
});

// Initialize logger
const logger = new PTSLogger();

// Middleware
app.use(cors());
app.use(express.json());

// Store connected PTS controllers
const connectedControllers = new Map();

// PTS Controller class to manage individual connections
class PTSController {
    constructor(ws, ptsId, firmwareVersion, configIdentifier) {
        this.ws = ws;
        this.ptsId = ptsId;
        this.firmwareVersion = firmwareVersion;
        this.configIdentifier = configIdentifier;
        this.isAlive = true;
        this.lastPing = Date.now();
        this.pendingRequests = new Map();
        this.connectionTime = Date.now();
        this.messageCount = 0;
        this.lastMessageTime = Date.now();
        
        console.log(`PTS Controller ${ptsId} constructor called (Firmware: ${firmwareVersion}, Config: ${configIdentifier})`);
        
        // Log connection
        logger.logConnection(ptsId, {
            firmwareVersion,
            configIdentifier,
            connectionTime: new Date(this.connectionTime).toISOString()
        });
        
        // Set up error handling for WebSocket
        this.ws.on('error', (error) => {
            console.error(`WebSocket error for PTS ${ptsId}:`, error.message);
            console.error(`Error details:`, {
                code: error.code,
                name: error.name,
                stack: error.stack
            });
            
            // Log the error but don't crash
            if (error.code === 'WS_ERR_UNEXPECTED_RSV_1') {
                console.log(`PTS ${ptsId} sent invalid WebSocket frame (RSV1 bit set) - this is common with PTS controllers`);
                // Log protocol violation
                logger.logProtocolViolation(ptsId, 'RSV1_BIT_SET', {
                    errorCode: error.code,
                    errorMessage: error.message,
                    description: 'PTS controller sent WebSocket frame with RSV1 bit set (protocol violation)',
                    impact: 'None - server continues to function normally'
                });
                
                // Don't disconnect for RSV1 errors - this is normal for PTS controllers
                console.log(`PTS ${ptsId} RSV1 error logged but connection maintained`);
            } else if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
                console.log(`PTS ${ptsId} connection reset - this is normal for PTS controllers`);
                // Log connection reset
                logger.logWebSocketError(ptsId, error);
            } else {
                console.error(`Unexpected WebSocket error for PTS ${ptsId}:`, error);
                // Log unexpected errors
                logger.logWebSocketError(ptsId, error);
            }
        });
        
        // Set up ping/pong handling
        this.ws.on('pong', () => {
            this.isAlive = true;
            this.lastPing = Date.now();
            console.log(`PTS ${ptsId} pong received at ${new Date().toISOString()}`);
        });
        
        // Set up message handling
        this.ws.on('message', (data) => {
            try {
                this.messageCount++;
                this.lastMessageTime = Date.now();
                console.log(`PTS ${ptsId} message #${this.messageCount} received at ${new Date().toISOString()}`);
                this.handleMessage(data);
            } catch (error) {
                console.error(`Error handling message from PTS ${ptsId}:`, error.message);
                // Don't disconnect for message handling errors
            }
        });
        
        // Set up connection close handling
        this.ws.on('close', (code, reason) => {
            const duration = Date.now() - this.connectionTime;
            const durationSeconds = Math.round(duration/1000);
            
            console.log(`PTS Controller ${ptsId} disconnected after ${durationSeconds}s (Code: ${code}, Reason: ${reason || 'No reason'})`);
            console.log(`Connection stats: ${this.messageCount} messages received, last message ${Math.round((Date.now() - this.lastMessageTime)/1000)}s ago`);
            
            // If connection was very short, log it as a potential issue
            if (durationSeconds < 5) {
                console.warn(`PTS ${ptsId} had very short connection (${durationSeconds}s) - this might indicate a connection issue`);
                logger.logShortConnection(ptsId, durationSeconds, {
                    messageCount: this.messageCount,
                    closeCode: code,
                    closeReason: reason,
                    firmwareVersion: this.firmwareVersion,
                    configIdentifier: this.configIdentifier,
                    description: 'PTS controller disconnected very quickly after connection'
                });
            }
            
            this.handleDisconnect();
        });
        
        console.log(`PTS Controller ${ptsId} connection setup completed successfully`);
    }
    
    handleMessage(data) {
        try {
            // Handle both string and buffer data
            let messageStr;
            if (Buffer.isBuffer(data)) {
                messageStr = data.toString('utf8');
            } else if (typeof data === 'string') {
                messageStr = data;
            } else {
                messageStr = data.toString();
            }
            
            const message = JSON.parse(messageStr);
            console.log(`Received from ${this.ptsId}:`, message);
            
            // Handle different message types based on the documentation
            switch (message.type) {
                case 'UploadPumpTransaction':
                    this.handlePumpTransaction(message);
                    break;
                case 'UploadTankMeasurement':
                    this.handleTankMeasurement(message);
                    break;
                case 'UploadInTankDelivery':
                    this.handleInTankDelivery(message);
                    break;
                case 'UploadGpsRecord':
                    this.handleGpsRecord(message);
                    break;
                case 'UploadAlertRecord':
                    this.handleAlertRecord(message);
                    break;
                case 'UploadStatus':
                    this.handleStatus(message);
                    break;
                case 'UploadConfiguration':
                    this.handleConfiguration(message);
                    break;
                case 'RequestTagBalance':
                    this.handleTagBalanceRequest(message);
                    break;
                case 'Ping':
                    this.handlePing(message);
                    break;
                default:
                    console.log(`Unknown message type: ${message.type}`);
                    this.sendErrorResponse(message.packetId || 0, 'Unknown message type');
            }
        } catch (error) {
            console.error(`Error parsing message from ${this.ptsId}:`, error.message);
            console.error(`Raw data:`, data);
            this.sendErrorResponse(0, 'Invalid message format');
        }
    }
    
    handlePumpTransaction(message) {
        const { packetId, data } = message;
        console.log(`Pump transaction from ${this.ptsId}:`, data);
        
        // Log the pump transaction data
        logger.logPumpTransaction(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process pump transaction data here
        // This is where you would save to database, trigger notifications, etc.
        
        // Send confirmation response
        this.sendConfirmationResponse(packetId, 'PumpTransaction');
    }
    
    handleTankMeasurement(message) {
        const { packetId, data } = message;
        console.log(`Tank measurement from ${this.ptsId}:`, data);
        
        // Log the tank measurement data
        logger.logTankMeasurement(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process tank measurement data here
        
        this.sendConfirmationResponse(packetId, 'TankMeasurement');
    }
    
    handleInTankDelivery(message) {
        const { packetId, data } = message;
        console.log(`In-tank delivery from ${this.ptsId}:`, data);
        
        // Log the in-tank delivery data
        logger.logInTankDelivery(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process in-tank delivery data here
        
        this.sendConfirmationResponse(packetId, 'InTankDelivery');
    }
    
    handleGpsRecord(message) {
        const { packetId, data } = message;
        console.log(`GPS record from ${this.ptsId}:`, data);
        
        // Log the GPS record data
        logger.logGpsRecord(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process GPS record data here
        
        this.sendConfirmationResponse(packetId, 'GpsRecord');
    }
    
    handleAlertRecord(message) {
        const { packetId, data } = message;
        console.log(`Alert record from ${this.ptsId}:`, data);
        
        // Log the alert record data
        logger.logAlertRecord(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process alert record data here
        
        this.sendConfirmationResponse(packetId, 'AlertRecord');
    }
    
    handleStatus(message) {
        const { packetId, data } = message;
        console.log(`Status update from ${this.ptsId}:`, data);
        
        // Log the status update data
        logger.logStatusUpdate(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process status data here
        // This provides real-time monitoring information
        
        this.sendConfirmationResponse(packetId, 'Status');
    }
    
    handleConfiguration(message) {
        const { packetId, data } = message;
        console.log(`Configuration update from ${this.ptsId}:`, data);
        
        // Log the configuration update data
        logger.logConfigurationUpdate(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process configuration data here
        // This indicates configuration has changed
        
        this.sendConfirmationResponse(packetId, 'Configuration');
    }
    
    handleTagBalanceRequest(message) {
        const { packetId, data } = message;
        console.log(`Tag balance request from ${this.ptsId}:`, data);
        
        // Log the tag balance request data
        logger.logTagBalanceRequest(this.ptsId, {
            packetId,
            ...data
        });
        
        // Process tag balance request here
        // This is for payment validation
        
        // Example response with tag balance
        const response = {
            type: 'TagBalanceResponse',
            packetId: packetId,
            success: true,
            data: {
                tagId: data.tagId,
                balance: 100.50, // This would come from your system
                isValid: true
            }
        };
        
        this.sendMessage(response);
    }
    
    handlePing(message) {
        const { packetId } = message;
        console.log(`Ping from ${this.ptsId} (packet ${packetId})`);
        
        // Log the ping data
        logger.logPing(this.ptsId, {
            packetId
        });
        
        // Respond with Pong
        const response = {
            type: 'Pong',
            packetId: packetId
        };
        
        this.sendMessage(response);
    }
    
    sendConfirmationResponse(packetId, requestType) {
        const response = {
            type: 'Confirmation',
            packetId: packetId,
            requestType: requestType,
            success: true
        };
        
        this.sendMessage(response);
    }
    
    sendErrorResponse(packetId, errorMessage) {
        const response = {
            type: 'Error',
            packetId: packetId,
            success: false,
            error: errorMessage
        };
        
        this.sendMessage(response);
    }
    
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Error sending message to PTS ${this.ptsId}:`, error.message);
            }
        }
    }
    
    handleDisconnect() {
        console.log(`PTS Controller ${this.ptsId} disconnected`);
        
        // Log disconnection
        logger.logDisconnection(this.ptsId, {
            firmwareVersion: this.firmwareVersion,
            configIdentifier: this.configIdentifier,
            connectionDuration: Math.round((Date.now() - this.connectionTime) / 1000) + 's'
        });
        
        connectedControllers.delete(this.ptsId);
    }
    
    // Method to send requests to the PTS controller
    sendRequest(request) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage(request);
        }
    }
}

// WebSocket server error handling
wss.on('error', (error) => {
    console.error('WebSocket server error:', error.message);
    console.error('Error details:', {
        code: error.code,
        name: error.name,
        stack: error.stack
    });
});

// Handle individual WebSocket errors
wss.on('headers', (headers, req) => {
    console.log(`WebSocket upgrade headers for ${req.socket.remoteAddress}:`, headers);
});

// Handle WebSocket connection errors
wss.on('connection', (ws, req) => {
    // Add connection-level error handling
    ws.on('error', (error) => {
        console.error(`Connection-level WebSocket error for ${req.socket.remoteAddress}:`, error.message);
    });
    
    // Add connection-level close handling
    ws.on('close', (code, reason) => {
        console.log(`Connection-level close for ${req.socket.remoteAddress}: Code ${code}, Reason: ${reason || 'No reason'}`);
    });
    
    // Continue with existing connection handling...
    try {
        console.log(`New WebSocket connection attempt from ${req.socket.remoteAddress}`);
        console.log(`Request headers:`, req.headers);
        
        // Extract PTS-specific headers from the upgrade request
        const ptsId = req.headers['x-pts-id'];
        const firmwareVersion = req.headers['x-pts-firmware-version-datetime'];
        const configIdentifier = req.headers['x-pts-configuration-identifier'];
        
        if (!ptsId) {
            console.error('Connection rejected: Missing X-Pts-Id header');
            ws.close(1008, 'Missing PTS ID');
            return;
        }
        
        console.log(`PTS Controller ${ptsId} attempting connection with:`, {
            firmwareVersion,
            configIdentifier,
            remoteAddress: req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        
        // Check if controller is already connected
        if (connectedControllers.has(ptsId)) {
            console.log(`PTS Controller ${ptsId} already connected, closing old connection`);
            const oldController = connectedControllers.get(ptsId);
            oldController.ws.close(1000, 'Replaced by new connection');
        }
        
        // Create PTS controller instance
        const controller = new PTSController(ws, ptsId, firmwareVersion, configIdentifier);
        connectedControllers.set(ptsId, controller);
        
        // Send welcome message
        controller.sendMessage({
            type: 'Welcome',
            message: 'PTS Controller connected successfully'
        });
        
        console.log(`PTS Controller ${ptsId} connection established successfully`);
        
    } catch (error) {
        console.error('Error handling new connection:', error.message);
        console.error('Error stack:', error.stack);
        ws.close(1011, 'Internal server error');
    }
});

// Handle server errors
server.on('error', (error) => {
    console.error('HTTP server error:', error.message);
});

// Handle process errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        connectedControllers: connectedControllers.size,
        timestamp: new Date().toISOString()
    });
});

// Get connected controllers
app.get('/controllers', (req, res) => {
    const controllers = Array.from(connectedControllers.keys()).map(ptsId => ({
        ptsId,
        firmwareVersion: connectedControllers.get(ptsId).firmwareVersion,
        configIdentifier: connectedControllers.get(ptsId).configIdentifier,
        isAlive: connectedControllers.get(ptsId).isAlive,
        lastPing: connectedControllers.get(ptsId).lastPing,
        connectionTime: connectedControllers.get(ptsId).connectionTime
    }));
    
    res.json({
        count: controllers.length,
        controllers
    });
});

// Get log files information
app.get('/logs', (req, res) => {
    try {
        const logFiles = logger.getLogFiles();
        res.json({
            logDirectory: 'logs',
            logFiles: logFiles,
            totalFiles: logFiles.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get log files', details: error.message });
    }
});

// Get log summary and statistics
app.get('/logs/summary', (req, res) => {
    try {
        const summary = logger.getLogSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get log summary', details: error.message });
    }
});

// Get available message types
app.get('/logs/types', (req, res) => {
    try {
        const messageTypes = logger.getMessageTypes();
        res.json({
            messageTypes: messageTypes,
            count: messageTypes.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get message types', details: error.message });
    }
});

// Get recent logs for a specific message type
app.get('/logs/:messageType', (req, res) => {
    try {
        const { messageType } = req.params;
        const { limit = 50 } = req.query;
        
        const logs = logger.getRecentLogs(messageType, parseInt(limit));
        res.json({
            messageType,
            logs,
            count: logs.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get logs', details: error.message });
    }
});

// Send command to specific controller
app.post('/controllers/:ptsId/command', (req, res) => {
    const { ptsId } = req.params;
    const { command, data } = req.body;
    
    const controller = connectedControllers.get(ptsId);
    if (!controller) {
        return res.status(404).json({ error: 'Controller not found' });
    }
    
    try {
        const request = {
            type: command,
            packetId: Math.floor(Math.random() * 65535) + 1,
            data: data || {}
        };
        
        controller.sendRequest(request);
        res.json({ success: true, message: 'Command sent', request });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send command', details: error.message });
    }
});

// Cleanup disconnected controllers
setInterval(() => {
    wss.clients.forEach((ws) => {
        const controller = Array.from(connectedControllers.values()).find(c => c.ws === ws);
        if (controller && !controller.isAlive) {
            console.log(`Terminating inactive connection for ${controller.ptsId}`);
            ws.terminate();
        }
    });
}, 30000);

// Ping all clients to check if they're alive
setInterval(() => {
    wss.clients.forEach((ws) => {
        const controller = Array.from(connectedControllers.values()).find(c => c.ws === ws);
        if (controller) {
            controller.isAlive = false;
            try {
                ws.ping();
                console.log(`Ping sent to PTS ${controller.ptsId}`);
            } catch (error) {
                console.error(`Error pinging PTS ${controller.ptsId}:`, error.message);
            }
        }
    });
}, 30000);

// Connection health monitoring
setInterval(() => {
    const now = Date.now();
    connectedControllers.forEach((controller, ptsId) => {
        const connectionAge = Math.round((now - controller.connectionTime) / 1000);
        const lastMessageAge = Math.round((now - controller.lastMessageTime) / 1000);
        
        console.log(`PTS ${ptsId} health: Age=${connectionAge}s, Messages=${controller.messageCount}, LastMsg=${lastMessageAge}s ago, Alive=${controller.isAlive}`);
        
        // If no messages received for a long time, log a warning
        if (lastMessageAge > 300 && controller.messageCount === 0) { // 5 minutes with no messages
            console.warn(`PTS ${ptsId} has been connected for ${connectionAge}s but received no messages`);
        }
    });
}, 60000); // Check every minute

// Clean up old log files daily
setInterval(() => {
    logger.clearOldLogs(30); // Keep logs for 30 days
}, 24 * 60 * 60 * 1000); // Run daily

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`PTS Controller WebSocket Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ptsWebSocket`);
    console.log(`Server request URI: ptsWebSocket`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Controllers status: http://localhost:${PORT}/controllers`);
    console.log(`Logs endpoint: http://localhost:${PORT}/logs`);
    console.log(`Log summary: http://localhost:${PORT}/logs/summary`);
    console.log(`Message types: http://localhost:${PORT}/logs/types`);
    console.log(`Log files will be saved in: ./logs/`);
    console.log(`Note: Server is configured to handle PTS controller WebSocket protocol variations`);
    console.log(`Error handling: RSV1 bit errors are logged but don't crash the server`);
}); 