#!/usr/bin/env node

/**
 * PTS Controller Connection Debug Script
 * 
 * This script helps debug connection issues with PTS controllers,
 * particularly the 0s connection duration problem.
 */

const fs = require('fs');
const path = require('path');

class ConnectionDebugger {
    constructor() {
        this.logDir = 'logs';
    }
    
    // Check for recent connection issues
    checkRecentConnections() {
        console.log('🔍 Checking recent connection logs...\n');
        
        try {
            const files = fs.readdirSync(this.logDir);
            const connectionFiles = files.filter(file => 
                file.includes('Connection') || 
                file.includes('ShortConnection') || 
                file.includes('ConnectionIssue')
            );
            
            if (connectionFiles.length === 0) {
                console.log('❌ No connection log files found');
                return;
            }
            
            connectionFiles.forEach(file => {
                console.log(`📁 ${file}:`);
                this.analyzeConnectionFile(file);
                console.log('');
            });
            
        } catch (error) {
            console.error('Error reading logs:', error.message);
        }
    }
    
    // Analyze a specific connection log file
    analyzeConnectionFile(filename) {
        try {
            const filePath = path.join(this.logDir, filename);
            const content = fs.readFileSync(filePath, 'utf8');
            const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
            
            console.log(`  Total entries: ${entries.length}`);
            
            if (entries.length > 0) {
                // Show the most recent entry
                const lastEntry = entries[entries.length - 1];
                try {
                    const parsed = JSON.parse(lastEntry.trim());
                    console.log(`  Last entry timestamp: ${parsed.timestamp}`);
                    console.log(`  PTS ID: ${parsed.ptsId}`);
                    
                    if (parsed.data) {
                        if (parsed.data.connectionDuration) {
                            console.log(`  Connection duration: ${parsed.data.connectionDuration}`);
                        }
                        if (parsed.data.duration) {
                            console.log(`  Duration: ${parsed.data.duration}s`);
                        }
                        if (parsed.data.messageCount !== undefined) {
                            console.log(`  Messages received: ${parsed.data.messageCount}`);
                        }
                        if (parsed.data.closeCode) {
                            console.log(`  Close code: ${parsed.data.closeCode}`);
                        }
                        if (parsed.data.closeReason) {
                            console.log(`  Close reason: ${parsed.data.closeReason}`);
                        }
                    }
                } catch (e) {
                    console.log(`  Could not parse last entry: ${e.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  Error reading file: ${error.message}`);
        }
    }
    
    // Check for protocol violations
    checkProtocolViolations() {
        console.log('🚨 Checking for protocol violations...\n');
        
        try {
            const files = fs.readdirSync(this.logDir);
            const violationFiles = files.filter(file => 
                file.includes('ProtocolViolation') || 
                file.includes('WebSocketError')
            );
            
            if (violationFiles.length === 0) {
                console.log('✅ No protocol violation logs found');
                return;
            }
            
            violationFiles.forEach(file => {
                console.log(`📁 ${file}:`);
                this.analyzeViolationFile(file);
                console.log('');
            });
            
        } catch (error) {
            console.error('Error reading violation logs:', error.message);
        }
    }
    
    // Analyze protocol violation logs
    analyzeViolationFile(filename) {
        try {
            const filePath = path.join(this.logDir, filename);
            const content = fs.readFileSync(filePath, 'utf8');
            const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
            
            console.log(`  Total violations: ${entries.length}`);
            
            if (entries.length > 0) {
                // Show the most recent violations
                const recentEntries = entries.slice(-3);
                recentEntries.forEach((entry, index) => {
                    try {
                        const parsed = JSON.parse(entry.trim());
                        console.log(`  Violation ${index + 1}:`);
                        console.log(`    PTS ID: ${parsed.ptsId}`);
                        console.log(`    Type: ${parsed.data?.violationType || parsed.data?.errorType || 'Unknown'}`);
                        console.log(`    Timestamp: ${parsed.timestamp}`);
                        
                        if (parsed.data?.errorCode) {
                            console.log(`    Error Code: ${parsed.data.errorCode}`);
                        }
                        if (parsed.data?.errorMessage) {
                            console.log(`    Error Message: ${parsed.data.errorMessage}`);
                        }
                    } catch (e) {
                        console.log(`    Could not parse entry: ${e.message}`);
                    }
                });
            }
            
        } catch (error) {
            console.log(`  Error reading file: ${error.message}`);
        }
    }
    
    // Generate connection health report
    generateHealthReport() {
        console.log('📊 Generating connection health report...\n');
        
        try {
            const files = fs.readdirSync(this.logDir);
            const allLogs = {};
            
            files.forEach(file => {
                if (file.endsWith('.log')) {
                    const messageType = file.split('_')[0];
                    if (!allLogs[messageType]) {
                        allLogs[messageType] = 0;
                    }
                    
                    try {
                        const filePath = path.join(this.logDir, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        const entries = content.split('-'.repeat(80)).filter(entry => entry.trim());
                        allLogs[messageType] += entries.length;
                    } catch (e) {
                        // Skip files that can't be read
                    }
                }
            });
            
            console.log('📈 Log Summary:');
            Object.entries(allLogs).forEach(([type, count]) => {
                console.log(`  ${type}: ${count} entries`);
            });
            
            // Check for potential issues
            console.log('\n⚠️  Potential Issues:');
            
            if (allLogs['ShortConnection'] > 0) {
                console.log(`  ❌ ${allLogs['ShortConnection']} short connections detected`);
                console.log('     This indicates connection stability problems');
            }
            
            if (allLogs['ProtocolViolation'] > 0) {
                console.log(`  ⚠️  ${allLogs['ProtocolViolation']} protocol violations detected`);
                console.log('     This is common with PTS controllers but should be monitored');
            }
            
            if (allLogs['WebSocketError'] > 0) {
                console.log(`  ⚠️  ${allLogs['WebSocketError']} WebSocket errors detected`);
                console.log('     Check network stability and PTS controller configuration');
            }
            
            if (allLogs['Connection'] > 0 && allLogs['Disconnection'] > 0) {
                const connectionRatio = allLogs['Disconnection'] / allLogs['Connection'];
                if (connectionRatio > 0.8) {
                    console.log(`  ⚠️  High disconnection rate: ${(connectionRatio * 100).toFixed(1)}%`);
                    console.log('     This suggests connection stability issues');
                }
            }
            
        } catch (error) {
            console.error('Error generating health report:', error.message);
        }
    }
    
    // Run all diagnostic checks
    runDiagnostics() {
        console.log('🚀 PTS Controller Connection Diagnostics\n');
        console.log('=' .repeat(50));
        
        this.checkRecentConnections();
        this.checkProtocolViolations();
        this.generateHealthReport();
        
        console.log('\n💡 Recommendations:');
        console.log('  1. Check PTS controller WebSocket configuration');
        console.log('  2. Verify network connectivity and firewall settings');
        console.log('  3. Review PTS controller logs for errors');
        console.log('  4. Ensure WebSocket path is correctly set to "ptsWebSocket"');
        console.log('  5. Check for protocol compatibility issues');
        
        console.log('\n🔧 For more detailed debugging:');
        console.log('  - Run the server with DEBUG=true');
        console.log('  - Check server console output for connection details');
        console.log('  - Monitor the logs directory for real-time updates');
    }
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
    const debuggerInstance = new ConnectionDebugger();
    debuggerInstance.runDiagnostics();
}

module.exports = ConnectionDebugger; 