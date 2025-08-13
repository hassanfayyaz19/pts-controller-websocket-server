const WebSocket = require('ws');

class PTSTestClient {
    constructor(serverUrl, ptsId) {
        this.serverUrl = serverUrl;
        this.ptsId = ptsId;
        this.ws = null;
        this.isConnected = false;
        this.packetId = 1;
        this.firmwareVersion = '2021-11-12T08:05:41';
        this.configIdentifier = 'CONFIG_001';
        
        // Simulate PTS controller data
        this.simulatedData = {
            pumps: [
                { id: 1, status: 'IDLE', fuelType: 'DIESEL' },
                { id: 2, status: 'IDLE', fuelType: 'GASOLINE' }
            ],
            tanks: [
                { id: 1, fuelType: 'DIESEL', level: 75.5, volume: 1500.0 },
                { id: 2, fuelType: 'GASOLINE', level: 60.2, volume: 1200.0 }
            ]
        };
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Create WebSocket connection with PTS-specific headers
                // Note: The PTS controller GUI expects the URI without starting slash
                // So if server is on localhost:3000, the URI should be: ptsWebSocket
                this.ws = new WebSocket(this.serverUrl + '/ptsWebSocket', {
                    headers: {
                        'X-Pts-Id': this.ptsId,
                        'X-Pts-Firmware-Version-DateTime': this.firmwareVersion,
                        'X-Pts-Configuration-Identifier': this.configIdentifier
                    }
                });
                
                this.ws.on('open', () => {
                    console.log(`PTS Controller ${this.ptsId} connected to server`);
                    this.isConnected = true;
                    resolve();
                });
                
                this.ws.on('message', (data) => {
                    this.handleServerMessage(data);
                });
                
                this.ws.on('close', () => {
                    console.log(`PTS Controller ${this.ptsId} disconnected from server`);
                    this.isConnected = false;
                });
                
                this.ws.on('error', (error) => {
                    console.error(`WebSocket error for ${this.ptsId}:`, error);
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
    
    handleServerMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log(`Received from server:`, message);
            
            // Handle different response types
            switch (message.type) {
                case 'Welcome':
                    console.log('Server welcomed us:', message.message);
                    break;
                case 'Confirmation':
                    console.log(`Request ${message.requestType} confirmed with packet ${message.packetId}`);
                    break;
                case 'Error':
                    console.error(`Error response for packet ${message.packetId}:`, message.error);
                    break;
                case 'Pong':
                    console.log(`Pong received for packet ${message.packetId}`);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing server message:', error);
        }
    }
    
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket not connected');
        }
    }
    
    // Simulate pump transaction
    simulatePumpTransaction(pumpId = 1, nozzleId = 1, fuelType = 'DIESEL') {
        const message = {
            type: 'UploadPumpTransaction',
            packetId: this.getNextPacketId(),
            data: {
                pumpId: pumpId,
                nozzleId: nozzleId,
                fuelType: fuelType,
                volume: Math.random() * 50 + 10, // 10-60 liters
                amount: Math.random() * 100 + 20, // $20-120
                tagId: `TAG_${Math.floor(Math.random() * 1000)}`,
                transactionId: `TXN_${Date.now()}`,
                timestamp: new Date().toISOString()
            }
        };
        
        this.sendMessage(message);
        return message;
    }
    
    // Simulate tank measurement
    simulateTankMeasurement(tankId = 1) {
        const tank = this.simulatedData.tanks.find(t => t.id === tankId);
        if (!tank) return;
        
        // Simulate some variation in measurements
        const variation = (Math.random() - 0.5) * 2; // ±1%
        const newLevel = Math.max(0, Math.min(100, tank.level + variation));
        const newVolume = (newLevel / 100) * 2000; // Assuming 2000L capacity
        
        const message = {
            type: 'UploadTankMeasurement',
            packetId: this.getNextPacketId(),
            data: {
                tankId: tankId,
                fuelType: tank.fuelType,
                level: newLevel,
                volume: newVolume,
                temperature: 20 + (Math.random() - 0.5) * 10, // 15-25°C
                waterLevel: Math.random() * 5, // 0-5mm
                ullage: 2000 - newVolume,
                timestamp: new Date().toISOString()
            }
        };
        
        this.sendMessage(message);
        return message;
    }
    
    // Simulate GPS record
    simulateGpsRecord() {
        // Simulate movement around a fixed point
        const baseLat = 40.7128;
        const baseLng = -74.0060;
        const variation = 0.001; // Small variation
        
        const message = {
            type: 'UploadGpsRecord',
            packetId: this.getNextPacketId(),
            data: {
                latitude: baseLat + (Math.random() - 0.5) * variation,
                longitude: baseLng + (Math.random() - 0.5) * variation,
                altitude: 10 + Math.random() * 5,
                speed: Math.random() * 5, // 0-5 m/s
                heading: Math.random() * 360,
                accuracy: 2 + Math.random() * 3, // 2-5 meters
                satellites: 8 + Math.floor(Math.random() * 4), // 8-11 satellites
                timestamp: new Date().toISOString()
            }
        };
        
        this.sendMessage(message);
        return message;
    }
    
    // Simulate status update
    simulateStatusUpdate() {
        // Update simulated data with some random variations
        this.simulatedData.pumps.forEach(pump => {
            if (Math.random() < 0.1) { // 10% chance to change status
                pump.status = Math.random() < 0.5 ? 'IDLE' : 'BUSY';
            }
        });
        
        const message = {
            type: 'UploadStatus',
            packetId: this.getNextPacketId(),
            data: {
                systemStatus: 'OPERATIONAL',
                pumps: this.simulatedData.pumps,
                tanks: this.simulatedData.tanks,
                readers: [
                    { id: 1, status: 'ONLINE', type: 'RFID' },
                    { id: 2, status: 'ONLINE', type: 'BARCODE' }
                ],
                priceBoards: [
                    { id: 1, status: 'ONLINE', fuelType: 'DIESEL', price: 3.99 },
                    { id: 2, status: 'ONLINE', fuelType: 'GASOLINE', price: 4.29 }
                ],
                gpsStatus: 'ONLINE',
                communicationStatus: 'ONLINE',
                batteryLevel: 85 + Math.random() * 15, // 85-100%
                temperature: 25 + (Math.random() - 0.5) * 10, // 20-30°C
                timestamp: new Date().toISOString()
            }
        };
        
        this.sendMessage(message);
        return message;
    }
    
    // Simulate ping
    simulatePing() {
        const message = {
            type: 'Ping',
            packetId: this.getNextPacketId(),
            timestamp: new Date().toISOString()
        };
        
        this.sendMessage(message);
        return message;
    }
    
    // Simulate tag balance request
    simulateTagBalanceRequest(tagId = 'TAG_001') {
        const message = {
            type: 'RequestTagBalance',
            packetId: this.getNextPacketId(),
            data: {
                tagId: tagId,
                timestamp: new Date().toISOString()
            }
        };
        
        this.sendMessage(message);
        return message;
    }
    
    getNextPacketId() {
        const id = this.packetId;
        this.packetId = (this.packetId % 65535) + 1;
        return id;
    }
    
    // Start automatic simulation
    startSimulation(interval = 5000) {
        console.log(`Starting simulation for PTS Controller ${this.ptsId} with ${interval}ms interval`);
        
        this.simulationInterval = setInterval(() => {
            if (!this.isConnected) return;
            
            // Randomly choose what to simulate
            const actions = [
                () => this.simulateStatusUpdate(),
                () => this.simulateTankMeasurement(1),
                () => this.simulateTankMeasurement(2),
                () => this.simulateGpsRecord(),
                () => this.simulatePing()
            ];
            
            // Pump transactions are less frequent
            if (Math.random() < 0.1) { // 10% chance
                actions.push(() => this.simulatePumpTransaction());
            }
            
            // Tag balance requests are also less frequent
            if (Math.random() < 0.05) { // 5% chance
                actions.push(() => this.simulateTagBalanceRequest());
            }
            
            // Execute random action
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            randomAction();
            
        }, interval);
    }
    
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
            console.log(`Simulation stopped for PTS Controller ${this.ptsId}`);
        }
    }
}

module.exports = PTSTestClient; 