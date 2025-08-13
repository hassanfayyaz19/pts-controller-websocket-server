const fs = require('fs');
const path = require('path');

class LogViewer {
    constructor() {
        this.logDir = 'logs';
    }
    
    // List all available log files
    listLogFiles() {
        try {
            if (!fs.existsSync(this.logDir)) {
                console.log('No logs directory found. Run the server first to generate logs.');
                return [];
            }
            
            const files = fs.readdirSync(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            if (logFiles.length === 0) {
                console.log('No log files found yet.');
                return [];
            }
            
            console.log('\n📁 Available Log Files:');
            console.log('========================');
            logFiles.forEach((file, index) => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                const size = (stats.size / 1024).toFixed(2); // KB
                console.log(`${index + 1}. ${file} (${size} KB) - Last modified: ${stats.mtime.toLocaleString()}`);
            });
            
            return logFiles;
        } catch (error) {
            console.error('Error listing log files:', error);
            return [];
        }
    }
    
    // View recent entries from a specific log file
    viewRecentLogs(messageType, limit = 10) {
        try {
            const logFiles = this.listLogFiles();
            const targetFile = logFiles.find(file => file.startsWith(messageType));
            
            if (!targetFile) {
                console.log(`\n❌ No log file found for message type: ${messageType}`);
                return;
            }
            
            const filePath = path.join(this.logDir, targetFile);
            const content = fs.readFileSync(filePath, 'utf8');
            const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
            
            console.log(`\n📋 Recent ${messageType} Logs (showing last ${limit} entries):`);
            console.log('='.repeat(80));
            
            const recentEntries = entries.slice(-limit);
            recentEntries.forEach((entry, index) => {
                try {
                    const logData = JSON.parse(entry.trim());
                    console.log(`\n${index + 1}. [${logData.timestamp}] PTS: ${logData.ptsId}`);
                    console.log(`   Data: ${JSON.stringify(logData.data, null, 2)}`);
                } catch (e) {
                    console.log(`\n${index + 1}. Raw entry: ${entry.trim()}`);
                }
            });
            
        } catch (error) {
            console.error('Error viewing logs:', error);
        }
    }
    
    // View all log files summary
    viewSummary() {
        try {
            const logFiles = this.listLogFiles();
            
            if (logFiles.length === 0) return;
            
            console.log('\n📊 Log Summary:');
            console.log('================');
            
            logFiles.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
                
                console.log(`\n📄 ${file}:`);
                console.log(`   Entries: ${entries.length}`);
                console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log(`   Last modified: ${stats.mtime.toLocaleString()}`);
                
                if (entries.length > 0) {
                    try {
                        const lastEntry = JSON.parse(entries[entries.length - 1].trim());
                        console.log(`   Last entry: ${lastEntry.timestamp}`);
                    } catch (e) {
                        console.log(`   Last entry: Unable to parse`);
                    }
                }
            });
            
        } catch (error) {
            console.error('Error viewing summary:', error);
        }
    }
    
    // Search logs for specific content
    searchLogs(searchTerm, messageType = null) {
        try {
            const logFiles = this.listLogFiles();
            const results = [];
            
            logFiles.forEach(file => {
                if (messageType && !file.startsWith(messageType)) return;
                
                const filePath = path.join(this.logDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
                
                entries.forEach(entry => {
                    if (entry.toLowerCase().includes(searchTerm.toLowerCase())) {
                        try {
                            const logData = JSON.parse(entry.trim());
                            results.push({
                                file,
                                ...logData
                            });
                        } catch (e) {
                            results.push({
                                file,
                                raw: entry.trim()
                            });
                        }
                    }
                });
            });
            
            if (results.length === 0) {
                console.log(`\n🔍 No results found for search term: "${searchTerm}"`);
                return;
            }
            
            console.log(`\n🔍 Search Results for "${searchTerm}" (${results.length} matches):`);
            console.log('='.repeat(80));
            
            results.slice(0, 20).forEach((result, index) => {
                console.log(`\n${index + 1}. File: ${result.file}`);
                if (result.timestamp) {
                    console.log(`   Time: ${result.timestamp}`);
                    console.log(`   PTS: ${result.ptsId}`);
                    console.log(`   Type: ${result.messageType}`);
                    if (result.data) {
                        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
                    }
                } else {
                    console.log(`   Raw: ${result.raw}`);
                }
            });
            
            if (results.length > 20) {
                console.log(`\n... and ${results.length - 20} more results.`);
            }
            
        } catch (error) {
            console.error('Error searching logs:', error);
        }
    }
    
    // Clear all logs
    clearAllLogs() {
        try {
            const logFiles = this.listLogFiles();
            
            if (logFiles.length === 0) {
                console.log('No log files to clear.');
                return;
            }
            
            logFiles.forEach(file => {
                const filePath = path.join(this.logDir, file);
                fs.unlinkSync(filePath);
                console.log(`Deleted: ${file}`);
            });
            
            console.log(`\n✅ Cleared ${logFiles.length} log files.`);
            
        } catch (error) {
            console.error('Error clearing logs:', error);
        }
    }
}

// Command line interface
if (require.main === module) {
    const viewer = new LogViewer();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('PTS Controller Log Viewer');
        console.log('=========================');
        console.log('\nUsage:');
        console.log('  node utils/logViewer.js list                    - List all log files');
        console.log('  node utils/logViewer.js summary                 - Show log summary');
        console.log('  node utils/logViewer.js view <messageType>      - View recent logs for message type');
        console.log('  node utils/logViewer.js search <term>           - Search all logs');
        console.log('  node utils/logViewer.js clear                   - Clear all logs');
        console.log('\nMessage Types:');
        console.log('  UploadPumpTransaction, UploadTankMeasurement, UploadInTankDelivery');
        console.log('  UploadGpsRecord, UploadAlertRecord, UploadStatus, UploadConfiguration');
        console.log('  RequestTagBalance, Ping, Connection, Disconnection');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'list':
            viewer.listLogFiles();
            break;
        case 'summary':
            viewer.viewSummary();
            break;
        case 'view':
            if (args[1]) {
                viewer.viewRecentLogs(args[1], 20);
            } else {
                console.log('Please specify a message type to view.');
            }
            break;
        case 'search':
            if (args[1]) {
                viewer.searchLogs(args[1]);
            } else {
                console.log('Please specify a search term.');
            }
            break;
        case 'clear':
            viewer.clearAllLogs();
            break;
        default:
            console.log(`Unknown command: ${command}`);
    }
}

module.exports = LogViewer; 