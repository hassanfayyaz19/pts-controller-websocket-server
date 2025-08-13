const PTSTestClient = require('./ptsTestClient');

async function runTest() {
    console.log('Starting PTS Controller WebSocket Test...\n');
    
    // Create multiple PTS controller clients to simulate a real environment
    // Note: The PTS controller GUI expects the URI without starting slash
    // So if server is on localhost:3000, the URI should be: ptsWebSocket
    const controllers = [
        new PTSTestClient('ws://localhost:3000', '0041001C524E500420323441'),
        new PTSTestClient('ws://localhost:3000', '0041001C524E500420323442'),
        new PTSTestClient('ws://localhost:3000', '0041001C524E500420323443')
    ];
    
    try {
        // Connect all controllers
        console.log('Connecting PTS controllers...');
        for (const controller of controllers) {
            await controller.connect();
            // Wait a bit between connections
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\nAll ${controllers.length} PTS controllers connected successfully!`);
        console.log('WebSocket endpoint: ws://localhost:3000/ptsWebSocket');
        console.log('Server request URI: ptsWebSocket\n');
        
        // Start simulation for all controllers
        controllers.forEach((controller, index) => {
            // Stagger the start times slightly
            setTimeout(() => {
                controller.startSimulation(3000 + (index * 1000)); // Different intervals
            }, index * 2000);
        });
        
        console.log('Simulation started for all controllers...');
        console.log('Press Ctrl+C to stop the test\n');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\nStopping test...');
            
            // Stop simulation and disconnect all controllers
            for (const controller of controllers) {
                controller.stopSimulation();
                controller.disconnect();
            }
            
            console.log('Test stopped. All controllers disconnected.');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the test
runTest(); 