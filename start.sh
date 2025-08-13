#!/bin/bash

echo "Starting PTS Controller WebSocket Server..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies."
        exit 1
    fi
fi

# Start the server
echo "Starting server on port 3000..."
echo "WebSocket endpoint: ws://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo "Controllers status: http://localhost:3000/controllers"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 