const fs = require('fs');
const path = require('path');

class PTSLogger {
    constructor() {
        this.logDir = 'logs';
        this.ensureLogDirectory();
    }
    
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    getLogFileName(messageType) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `${messageType}_${timestamp}.log`;
    }
    
    logMessage(messageType, ptsId, data) {
        try {
            const timestamp = new Date().toISOString();
            const logFileName = this.getLogFileName(messageType);
            const logFilePath = path.join(this.logDir, logFileName);
            
            // Create log entry
            const logEntry = {
                timestamp: timestamp,
                ptsId: ptsId,
                messageType: messageType,
                data: data
            };
            
            // Convert to JSON string with pretty formatting
            const logString = JSON.stringify(logEntry, null, 2) + '\n' + '-'.repeat(80) + '\n';
            
            // Append to log file
            fs.appendFileSync(logFilePath, logString);
            
            console.log(`[${timestamp}] ${messageType} logged to ${logFileName} for PTS ${ptsId}`);
        } catch (error) {
            console.error(`Error logging ${messageType} message:`, error);
        }
    }
    
    // Log WebSocket errors
    logWebSocketError(ptsId, error) {
        try {
            const timestamp = new Date().toISOString();
            const logFileName = `WebSocketError_${timestamp.split('T')[0]}.log`;
            const logFilePath = path.join(this.logDir, logFileName);
            
            const errorEntry = {
                timestamp: timestamp,
                ptsId: ptsId,
                errorType: 'WebSocket',
                errorCode: error.code || 'UNKNOWN',
                errorMessage: error.message || 'Unknown error',
                stack: error.stack || null,
                additionalInfo: {
                    name: error.name,
                    code: error.code,
                    statusCode: error['[Symbol(status-code)]']
                }
            };
            
            const logString = JSON.stringify(errorEntry, null, 2) + '\n' + '-'.repeat(80) + '\n';
            fs.appendFileSync(logFilePath, logString);
            
            console.log(`[${timestamp}] WebSocket error logged to ${logFileName} for PTS ${ptsId}`);
        } catch (logError) {
            console.error('Error logging WebSocket error:', logError);
        }
    }
    
    // Log pump transactions
    logPumpTransaction(ptsId, data) {
        this.logMessage('UploadPumpTransaction', ptsId, data);
    }
    
    // Log tank measurements
    logTankMeasurement(ptsId, data) {
        this.logMessage('UploadTankMeasurement', ptsId, data);
    }
    
    // Log in-tank deliveries
    logInTankDelivery(ptsId, data) {
        this.logMessage('UploadInTankDelivery', ptsId, data);
    }
    
    // Log GPS records
    logGpsRecord(ptsId, data) {
        this.logMessage('UploadGpsRecord', ptsId, data);
    }
    
    // Log alert records
    logAlertRecord(ptsId, data) {
        this.logMessage('UploadAlertRecord', ptsId, data);
    }
    
    // Log status updates
    logStatusUpdate(ptsId, data) {
        this.logMessage('UploadStatus', ptsId, data);
    }
    
    // Log configuration updates
    logConfigurationUpdate(ptsId, data) {
        this.logMessage('UploadConfiguration', ptsId, data);
    }
    
    // Log tag balance requests
    logTagBalanceRequest(ptsId, data) {
        this.logMessage('RequestTagBalance', ptsId, data);
    }
    
    // Log ping messages
    logPing(ptsId, data) {
        this.logMessage('Ping', ptsId, data);
    }
    
    // Log connection events
    logConnection(ptsId, data) {
        this.logMessage('Connection', ptsId, data);
    }
    
    // Log disconnection events
    logDisconnection(ptsId, data) {
        this.logMessage('Disconnection', ptsId, data);
    }
    
    // Log protocol violations (like RSV1 errors)
    logProtocolViolation(ptsId, violationType, details) {
        try {
            const timestamp = new Date().toISOString();
            const logFileName = `ProtocolViolation_${timestamp.split('T')[0]}.log`;
            const logFilePath = path.join(this.logDir, logFileName);
            
            const violationEntry = {
                timestamp: timestamp,
                ptsId: ptsId,
                violationType: violationType,
                details: details,
                severity: 'WARNING',
                note: 'This is common with PTS controllers and does not affect functionality'
            };
            
            const logString = JSON.stringify(violationEntry, null, 2) + '\n' + '-'.repeat(80) + '\n';
            fs.appendFileSync(logFilePath, logString);
            
            console.log(`[${timestamp}] Protocol violation logged to ${logFileName} for PTS ${ptsId}`);
        } catch (logError) {
            console.error('Error logging protocol violation:', logError);
        }
    }
    
    // Get log file paths for monitoring
    getLogFiles() {
        try {
            const files = fs.readdirSync(this.logDir);
            return files.filter(file => file.endsWith('.log'));
        } catch (error) {
            return [];
        }
    }
    
    // Get recent log entries from a specific log file
    getRecentLogs(messageType, limit = 50) {
        try {
            const logFileName = this.getLogFileName(messageType);
            const logFilePath = path.join(this.logDir, logFileName);
            
            if (!fs.existsSync(logFilePath)) {
                return [];
            }
            
            const content = fs.readFileSync(logFilePath, 'utf8');
            const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
            
            return entries.slice(-limit).map(entry => {
                try {
                    return JSON.parse(entry.trim());
                } catch (e) {
                    return { raw: entry.trim() };
                }
            });
        } catch (error) {
            console.error(`Error reading logs for ${messageType}:`, error);
            return [];
        }
    }
    
    // Clear old log files (older than specified days)
    clearOldLogs(daysToKeep = 30) {
        try {
            const files = this.getLogFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Error clearing old logs:', error);
        }
    }
}

module.exports = PTSLogger; 