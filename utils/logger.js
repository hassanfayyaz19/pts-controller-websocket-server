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
    
    // Validate log entry structure
    validateLogEntry(logEntry) {
        const requiredFields = ['timestamp', 'ptsId', 'messageType'];
        const missingFields = requiredFields.filter(field => !logEntry.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            console.warn(`Log entry missing required fields: ${missingFields.join(', ')}`);
            return false;
        }
        
        // Check for duplicate timestamp in data
        if (logEntry.data && logEntry.data.timestamp) {
            console.warn(`Log entry has duplicate timestamp in data field for ${logEntry.messageType}`);
            return false;
        }
        
        return true;
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
            
            // Validate log entry structure
            if (!this.validateLogEntry(logEntry)) {
                console.warn(`Log entry validation failed for ${messageType}`);
            }
            
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
        // Use the standard logMessage method for consistency
        this.logMessage('WebSocketError', ptsId, {
            errorType: 'WebSocket',
            errorCode: error.code || 'UNKNOWN',
            errorMessage: error.message || 'Unknown error',
            stack: error.stack || null,
            additionalInfo: {
                name: error.name,
                code: error.code,
                statusCode: error['[Symbol(status-code)]']
            }
        });
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
    
    // Log connection issues and short connections
    logConnectionIssue(ptsId, issueType, details) {
        this.logMessage('ConnectionIssue', ptsId, {
            issueType: issueType,
            details: details,
            severity: 'WARNING',
            timestamp: new Date().toISOString()
        });
    }
    
    // Log short connections (less than 5 seconds)
    logShortConnection(ptsId, duration, details) {
        this.logMessage('ShortConnection', ptsId, {
            duration: duration,
            details: details,
            severity: 'WARNING',
            potentialCauses: [
                'WebSocket protocol mismatch',
                'Authentication failure', 
                'Network instability',
                'PTS controller configuration issue',
                'RSV1 bit errors causing immediate disconnect'
            ],
            recommendations: [
                'Check PTS controller WebSocket configuration',
                'Verify network connectivity',
                'Check for protocol compatibility issues',
                'Review PTS controller logs for errors'
            ]
        });
    }
    
    // Log protocol violations (like RSV1 errors)
    logProtocolViolation(ptsId, violationType, details) {
        // Use the standard logMessage method for consistency
        this.logMessage('ProtocolViolation', ptsId, {
            violationType: violationType,
            details: details,
            severity: 'WARNING',
            note: 'This is common with PTS controllers and does not affect functionality'
        });
    }
    
    // Test logging structure (for development/testing)
    testLogging() {
        console.log('Testing logging structure...');
        
        // Test a protocol violation log
        this.logProtocolViolation('TEST_PTS_ID', 'RSV1_BIT_SET', {
            errorCode: 'WS_ERR_UNEXPECTED_RSV_1',
            errorMessage: 'Test error message',
            description: 'Test protocol violation',
            impact: 'Test impact'
        });
        
        // Test a WebSocket error log
        this.logWebSocketError('TEST_PTS_ID', {
            code: 'TEST_ERROR',
            message: 'Test WebSocket error',
            name: 'TestError'
        });
        
        // Test a connection log
        this.logConnection('TEST_PTS_ID', {
            firmwareVersion: 'TEST_FW',
            configIdentifier: 'TEST_CONFIG',
            connectionTime: new Date().toISOString()
        });
        
        console.log('Logging test completed. Check the logs directory for test entries.');
    }
    
    // Get log statistics and summary
    getLogSummary() {
        try {
            const files = this.getLogFiles();
            const summary = {
                totalLogFiles: files.length,
                messageTypes: {},
                totalEntries: 0,
                lastUpdated: null
            };
            
            files.forEach(file => {
                try {
                    const content = fs.readFileSync(path.join(this.logDir, file), 'utf8');
                    const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
                    
                    // Extract message type from filename
                    const messageType = file.split('_')[0];
                    
                    if (!summary.messageTypes[messageType]) {
                        summary.messageTypes[messageType] = {
                            fileCount: 0,
                            totalEntries: 0,
                            lastEntry: null
                        };
                    }
                    
                    summary.messageTypes[messageType].fileCount++;
                    summary.messageTypes[messageType].totalEntries += entries.length;
                    summary.totalEntries += entries.length;
                    
                    // Get last entry timestamp
                    if (entries.length > 0) {
                        try {
                            const lastEntry = JSON.parse(entries[entries.length - 1].trim());
                            if (lastEntry.timestamp) {
                                const entryTime = new Date(lastEntry.timestamp);
                                if (!summary.lastUpdated || entryTime > summary.lastUpdated) {
                                    summary.lastUpdated = entryTime;
                                }
                                if (!summary.messageTypes[messageType].lastEntry || entryTime > summary.messageTypes[messageType].lastEntry) {
                                    summary.messageTypes[messageType].lastEntry = entryTime;
                                }
                            }
                        } catch (e) {
                            // Skip invalid entries
                        }
                    }
                    
                } catch (error) {
                    console.error(`Error reading log file ${file}:`, error);
                }
            });
            
            return summary;
        } catch (error) {
            console.error('Error getting log summary:', error);
            return {
                totalLogFiles: 0,
                messageTypes: {},
                totalEntries: 0,
                lastUpdated: null,
                error: error.message
            };
        }
    }
    
    // Get all available message types
    getMessageTypes() {
        return [
            'Connection',
            'Disconnection',
            'UploadPumpTransaction',
            'UploadTankMeasurement',
            'UploadInTankDelivery',
            'UploadGpsRecord',
            'UploadAlertRecord',
            'UploadStatus',
            'UploadConfiguration',
            'RequestTagBalance',
            'Ping',
            'WebSocketError',
            'ProtocolViolation',
            'ConnectionIssue',
            'ShortConnection'
        ];
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