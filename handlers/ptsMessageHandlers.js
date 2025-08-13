const config = require('../config');

class PTSMessageHandlers {
    constructor(controller) {
        this.controller = controller;
    }
    
    /**
     * Handle pump transaction upload
     * This is sent when a pump transaction is completed
     */
    handlePumpTransaction(message) {
        const { packetId, data } = message;
        console.log(`Pump transaction from ${this.controller.ptsId}:`, data);
        
        // Validate required fields
        if (!this.validatePumpTransaction(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid pump transaction data');
        }
        
        // Process pump transaction data
        // This is where you would:
        // - Save to database
        // - Update inventory
        // - Send notifications
        // - Generate reports
        
        const transactionData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            pumpId: data.pumpId,
            nozzleId: data.nozzleId,
            fuelType: data.fuelType,
            volume: data.volume,
            amount: data.amount,
            tagId: data.tagId,
            transactionId: data.transactionId
        };
        
        console.log('Processing pump transaction:', transactionData);
        
        // Send confirmation response
        this.controller.sendConfirmationResponse(packetId, 'PumpTransaction');
        
        // Emit event for other parts of your application
        this.emitEvent('pumpTransaction', transactionData);
    }
    
    /**
     * Handle tank measurement upload
     * This provides real-time tank level and temperature data
     */
    handleTankMeasurement(message) {
        const { packetId, data } = message;
        console.log(`Tank measurement from ${this.controller.ptsId}:`, data);
        
        if (!this.validateTankMeasurement(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid tank measurement data');
        }
        
        const measurementData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            tankId: data.tankId,
            fuelType: data.fuelType,
            level: data.level,
            volume: data.volume,
            temperature: data.temperature,
            waterLevel: data.waterLevel,
            ullage: data.ullage
        };
        
        console.log('Processing tank measurement:', measurementData);
        
        this.controller.sendConfirmationResponse(packetId, 'TankMeasurement');
        this.emitEvent('tankMeasurement', measurementData);
    }
    
    /**
     * Handle in-tank delivery upload
     * This is sent when fuel is delivered to a tank
     */
    handleInTankDelivery(message) {
        const { packetId, data } = message;
        console.log(`In-tank delivery from ${this.controller.ptsId}:`, data);
        
        if (!this.validateInTankDelivery(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid in-tank delivery data');
        }
        
        const deliveryData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            tankId: data.tankId,
            fuelType: data.fuelType,
            deliveredVolume: data.deliveredVolume,
            deliveryNumber: data.deliveryNumber,
            driverId: data.driverId,
            supplierId: data.supplierId,
            temperature: data.temperature
        };
        
        console.log('Processing in-tank delivery:', deliveryData);
        
        this.controller.sendConfirmationResponse(packetId, 'InTankDelivery');
        this.emitEvent('inTankDelivery', deliveryData);
    }
    
    /**
     * Handle GPS record upload
     * This provides location tracking for the PTS controller
     */
    handleGpsRecord(message) {
        const { packetId, data } = message;
        console.log(`GPS record from ${this.controller.ptsId}:`, data);
        
        if (!this.validateGpsRecord(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid GPS record data');
        }
        
        const gpsData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            speed: data.speed,
            heading: data.heading,
            accuracy: data.accuracy,
            satellites: data.satellites
        };
        
        console.log('Processing GPS record:', gpsData);
        
        this.controller.sendConfirmationResponse(packetId, 'GpsRecord');
        this.emitEvent('gpsRecord', gpsData);
    }
    
    /**
     * Handle alert record upload
     * This provides real-time alerts and notifications
     */
    handleAlertRecord(message) {
        const { packetId, data } = message;
        console.log(`Alert record from ${this.controller.ptsId}:`, data);
        
        if (!this.validateAlertRecord(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid alert record data');
        }
        
        const alertData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            alertType: data.alertType,
            severity: data.severity,
            message: data.message,
            component: data.component,
            value: data.value,
            threshold: data.threshold
        };
        
        console.log('Processing alert record:', alertData);
        
        this.controller.sendConfirmationResponse(packetId, 'AlertRecord');
        this.emitEvent('alertRecord', alertData);
    }
    
    /**
     * Handle status upload
     * This provides real-time monitoring of controller and peripheral status
     */
    handleStatus(message) {
        const { packetId, data } = message;
        console.log(`Status update from ${this.controller.ptsId}:`, data);
        
        if (!this.validateStatus(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid status data');
        }
        
        const statusData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            systemStatus: data.systemStatus,
            pumps: data.pumps || [],
            tanks: data.tanks || [],
            readers: data.readers || [],
            priceBoards: data.priceBoards || [],
            gpsStatus: data.gpsStatus,
            communicationStatus: data.communicationStatus,
            batteryLevel: data.batteryLevel,
            temperature: data.temperature
        };
        
        console.log('Processing status update:', statusData);
        
        this.controller.sendConfirmationResponse(packetId, 'Status');
        this.emitEvent('statusUpdate', statusData);
    }
    
    /**
     * Handle configuration upload
     * This is sent when configuration changes
     */
    handleConfiguration(message) {
        const { packetId, data } = message;
        console.log(`Configuration update from ${this.controller.ptsId}:`, data);
        
        if (!this.validateConfiguration(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid configuration data');
        }
        
        const configData = {
            ptsId: this.controller.ptsId,
            timestamp: new Date().toISOString(),
            configVersion: data.configVersion,
            configData: data.configData,
            changeReason: data.changeReason
        };
        
        console.log('Processing configuration update:', configData);
        
        this.controller.sendConfirmationResponse(packetId, 'Configuration');
        this.emitEvent('configurationUpdate', configData);
    }
    
    /**
     * Handle tag balance request
     * This is for payment validation
     */
    handleTagBalanceRequest(message) {
        const { packetId, data } = message;
        console.log(`Tag balance request from ${this.controller.ptsId}:`, data);
        
        if (!this.validateTagBalanceRequest(data)) {
            return this.controller.sendErrorResponse(packetId, 'Invalid tag balance request');
        }
        
        // This is where you would validate the tag and get balance from your system
        // For now, we'll simulate a response
        
        const tagBalance = this.getTagBalance(data.tagId);
        
        const response = {
            type: 'TagBalanceResponse',
            packetId: packetId,
            success: true,
            data: {
                tagId: data.tagId,
                balance: tagBalance.balance,
                isValid: tagBalance.isValid,
                cardType: tagBalance.cardType,
                expiryDate: tagBalance.expiryDate
            }
        };
        
        this.controller.sendMessage(response);
        this.emitEvent('tagBalanceRequest', { tagId: data.tagId, response });
    }
    
    /**
     * Handle ping message
     * This is for connection health monitoring
     */
    handlePing(message) {
        const { packetId } = message;
        console.log(`Ping from ${this.controller.ptsId} (packet ${packetId})`);
        
        const response = {
            type: 'Pong',
            packetId: packetId,
            timestamp: new Date().toISOString(),
            serverTime: new Date().toISOString()
        };
        
        this.controller.sendMessage(response);
    }
    
    // Validation methods
    validatePumpTransaction(data) {
        return data && data.pumpId && data.nozzleId && data.fuelType && 
               typeof data.volume === 'number' && typeof data.amount === 'number';
    }
    
    validateTankMeasurement(data) {
        return data && data.tankId && data.fuelType && 
               typeof data.level === 'number' && typeof data.volume === 'number';
    }
    
    validateInTankDelivery(data) {
        return data && data.tankId && data.fuelType && 
               typeof data.deliveredVolume === 'number';
    }
    
    validateGpsRecord(data) {
        return data && typeof data.latitude === 'number' && 
               typeof data.longitude === 'number';
    }
    
    validateAlertRecord(data) {
        return data && data.alertType && data.severity && data.message;
    }
    
    validateStatus(data) {
        return data && data.systemStatus;
    }
    
    validateConfiguration(data) {
        return data && data.configVersion && data.configData;
    }
    
    validateTagBalanceRequest(data) {
        return data && data.tagId;
    }
    
    // Helper methods
    getTagBalance(tagId) {
        // This would typically query your database or external system
        // For demonstration purposes, returning mock data
        return {
            balance: Math.random() * 1000,
            isValid: true,
            cardType: 'FLEET',
            expiryDate: '2025-12-31'
        };
    }
    
    emitEvent(eventName, data) {
        // This would typically emit events for other parts of your application
        // You could use EventEmitter, Redis pub/sub, or other messaging systems
        console.log(`Event emitted: ${eventName}`, data);
    }
}

module.exports = PTSMessageHandlers; 