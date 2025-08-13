const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const PTSLogger = require('./utils/logger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create WebSocket server with specific path for PTS controllers
const wss = new WebSocket.Server({ 
    server,
    path: '/ptsWebSocket'  // This is the URI path PTS controllers will use
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
        
        // Log connection
        logger.logConnection(ptsId, {
            firmwareVersion,
            configIdentifier,
            timestamp: new Date().toISOString()
        });
        
        // Set up ping/pong handling
        this.ws.on('pong', () => {
            this.isAlive = true;
            this.lastPing = Date.now();
        });
        
        // Set up message handling
        this.ws.on('message', (data) => {
            this.handleMessage(data);
        });
        
        // Set up connection close handling
        this.ws.on('close', () => {
            this.handleDisconnect();
        });
        
        console.log(`PTS Controller ${ptsId} connected (Firmware: ${firmwareVersion}, Config: ${configIdentifier})`);
    }
    
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
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
            console.error(`Error parsing message from ${this.ptsId}:`, error);
            this.sendErrorResponse(0, 'Invalid message format');
        }
    }
    
    handlePumpTransaction(message) {
        const { packetId, data } = message;
        console.log(`Pump transaction from ${this.ptsId}:`, data);
        
        // Log the pump transaction data
        logger.logPumpTransaction(this.ptsId, {
            packetId,
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            ...data,
            timestamp: new Date().toISOString()
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
            packetId,
            timestamp: new Date().toISOString()
        });
        
        // Respond with Pong
        const response = {
            type: 'Pong',
            packetId: packetId,
            timestamp: new Date().toISOString()
        };
        
        this.sendMessage(response);
    }
    
    sendConfirmationResponse(packetId, requestType) {
        const response = {
            type: 'Confirmation',
            packetId: packetId,
            requestType: requestType,
            success: true,
            timestamp: new Date().toISOString()
        };
        
        this.sendMessage(response);
    }
    
    sendErrorResponse(packetId, errorMessage) {
        const response = {
            type: 'Error',
            packetId: packetId,
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString()
        };
        
        this.sendMessage(response);
    }
    
    sendMessage(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    handleDisconnect() {
        console.log(`PTS Controller ${this.ptsId} disconnected`);
        
        // Log disconnection
        logger.logDisconnection(this.ptsId, {
            timestamp: new Date().toISOString(),
            firmwareVersion: this.firmwareVersion,
            configIdentifier: this.configIdentifier
        });
        
        connectedControllers.delete(this.ptsId);
    }
    
    // Method to send requests to the PTS controller
    sendRequest(request) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage(request);
        }
    }
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    // Extract PTS-specific headers from the upgrade request
    const ptsId = req.headers['x-pts-id'];
    const firmwareVersion = req.headers['x-pts-firmware-version-datetime'];
    const configIdentifier = req.headers['x-pts-configuration-identifier'];
    
    if (!ptsId) {
        console.error('Connection rejected: Missing X-Pts-Id header');
        ws.close(1008, 'Missing PTS ID');
        return;
    }
    
    // Create PTS controller instance
    const controller = new PTSController(ws, ptsId, firmwareVersion, configIdentifier);
    connectedControllers.set(ptsId, controller);
    
    // Send welcome message
    controller.sendMessage({
        type: 'Welcome',
        message: 'PTS Controller connected successfully',
        timestamp: new Date().toISOString()
    });
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
        lastPing: connectedControllers.get(ptsId).lastPing
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
            data: data || {},
            timestamp: new Date().toISOString()
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
            ws.ping();
        }
    });
}, 30000);

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
    console.log(`Log files will be saved in: ./logs/`);
}); 