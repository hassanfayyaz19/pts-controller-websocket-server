# PTS-2 Controller WebSocket Server

A Node.js WebSocket server implementation for communicating with PTS-2 fuel station controllers in real-time, based on the official PTS-2 controller documentation.

## Features

- **Real-time Communication**: WebSocket-based communication following RFC6455 protocol
- **PTS-2 Protocol Compliance**: Implements all message types from the official documentation
- **Automatic Reconnection**: Handles controller disconnections and reconnections
- **Health Monitoring**: Built-in ping/pong mechanism for connection health
- **Multiple Controllers**: Supports multiple PTS-2 controllers simultaneously
- **REST API**: HTTP endpoints for monitoring and control
- **Event Handling**: Processes all PTS-2 data types (transactions, measurements, alerts, etc.)
- **Comprehensive Logging**: Automatic logging of all incoming data to separate log files by message type
- **Flexible Configuration**: Environment-based configuration with sensible defaults

## Supported PTS-2 Message Types

### Automatic Uploads (Controller → Server)
- **UploadPumpTransaction**: Fuel pump transaction data
- **UploadTankMeasurement**: Tank level and temperature measurements
- **UploadInTankDelivery**: Fuel delivery records
- **UploadGpsRecord**: GPS location data
- **UploadAlertRecord**: System alerts and notifications
- **UploadStatus**: Real-time system and peripheral status
- **UploadConfiguration**: Configuration changes

### Requests (Controller → Server)
- **RequestTagBalance**: Tag validation and balance checking
- **Ping**: Connection health monitoring

### Responses (Server → Controller)
- **Confirmation**: Success responses for uploads
- **Error**: Error responses with details
- **TagBalanceResponse**: Tag balance information
- **Pong**: Ping response

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pts-controller-websocket-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your settings
nano .env

# Or use the setup script
./setup-env.sh
```

## Configuration

### Environment Variables

The server uses environment variables for configuration. Copy `env.example` to `.env` and modify as needed:

#### Essential Settings
```bash
# Server configuration
PORT=3000
HOST=0.0.0.0
WS_PATH=/ptsWebSocket

# Logging
LOG_LEVEL=info
LOG_ENABLE_FILE=true

# PTS Controller settings
PTS_PING_INTERVAL=30000
PTS_CONNECTION_TIMEOUT=30000
```

#### Production Settings
```bash
NODE_ENV=production
ENABLE_AUTH=true
JWT_SECRET=your-secure-secret
ENABLE_HTTPS=true
CORS_ORIGIN=https://yourdomain.com
```

#### Optional Features
```bash
# Database integration
DB_TYPE=mongodb
DB_HOST=localhost
DB_PORT=27017

# Email notifications
ENABLE_EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

For complete configuration options, see:
- `env.example` - Complete environment variables list
- `ENV_REFERENCE.md` - Quick reference guide
- `config.js` - Configuration structure

### Quick Setup

Use the provided setup script:
```bash
./setup-env.sh
```

This will create your `.env` file and provide guidance on next steps.

## Usage

### Starting the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on the configured port (default: 3000).

### Server Endpoints

- **WebSocket**: `ws://localhost:3000/ptsWebSocket` (PTS controllers connect here)
- **Health Check**: `GET /health`
- **Controllers Status**: `GET /controllers`
- **Send Command**: `POST /controllers/:ptsId/command`
- **Logs Overview**: `GET /logs`
- **Specific Logs**: `GET /logs/:messageType?limit=50`

### PTS Controller Configuration

In your PTS controller's GUI, configure the WebSocket connection with:

- **Server IP/Hostname**: Your server's IP address or hostname
- **Port**: 3000 (or your custom port)
- **Server request URI**: `ptsWebSocket` (without starting slash)

**Example Configuration:**
- Server: `192.168.1.100`
- Port: `3000`
- Server request URI: `ptsWebSocket`

**Full WebSocket URL**: `ws://192.168.1.100:3000/ptsWebSocket`

### Testing with Simulated Controllers

Run the test client to simulate PTS-2 controllers:

```bash
# In a separate terminal
node test/runTest.js
```

This will create 3 simulated PTS controllers that send various data types to test the server.

## Logging System

The server automatically logs all incoming PTS controller data to separate log files organized by message type. Logs are stored in the `./logs/` directory.

### Log File Structure

Each message type gets its own log file with the format:
```
MessageType_YYYY-MM-DD.log
```

Example log files:
- `UploadPumpTransaction_2024-01-15.log`
- `UploadTankMeasurement_2024-01-15.log`
- `UploadStatus_2024-01-15.log`
- `Connection_2024-01-15.log`

### Log Entry Format

Each log entry contains:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadPumpTransaction",
  "data": {
    "packetId": 12345,
    "pumpId": 1,
    "nozzleId": 1,
    "fuelType": "DIESEL",
    "volume": 45.5,
    "amount": 89.10
  }
}
```

### Log Management

#### Viewing Logs via REST API
```bash
# Get list of all log files
curl http://localhost:3000/logs

# Get recent logs for a specific message type
curl http://localhost:3000/logs/UploadPumpTransaction?limit=20
```

#### Command Line Log Viewer
```bash
# List all log files
node utils/logViewer.js list

# Show log summary
node utils/logViewer.js summary

# View recent logs for a specific message type
node utils/logViewer.js view UploadPumpTransaction

# Search logs for specific content
node utils/logViewer.js search "DIESEL"

# Clear all logs
node utils/logViewer.js clear
```

#### Automatic Log Cleanup
- Logs are automatically cleaned up after 30 days (configurable via `LOG_RETENTION_DAYS`)
- This prevents disk space issues in long-running deployments

## PTS-2 Controller Connection

The PTS-2 controller connects to the server using the following handshake:

```
GET /ptsWebSocket HTTP/1.1
Host: your-server:3000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: [base64-key]
Sec-WebSocket-Version: 13
X-Pts-Id: [24-char-hex-id]
X-Pts-Firmware-Version-DateTime: [firmware-version]
X-Pts-Configuration-Identifier: [config-id]
```

### Required Headers

- **X-Pts-Id**: Unique controller identifier (up to 24 hexadecimal digits)
- **X-Pts-Firmware-Version-DateTime**: Controller firmware version
- **X-Pts-Configuration-Identifier**: Configuration identifier for change detection

### Connection Configuration

**Important**: In your PTS controller's GUI, enter the URI **without** the starting slash:

- ✅ **Correct**: `ptsWebSocket`
- ❌ **Wrong**: `/ptsWebSocket`

The server will automatically handle the full path construction.

## Message Format

All messages use JSON format with the following structure:

```json
{
  "type": "MessageType",
  "packetId": 12345,
  "data": {
    // Message-specific data
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Packet ID Requirements

- Range: 1-65535 (configurable via `PTS_MAX_PACKET_ID`)
- Must be unique per message
- Server responses must include the same packet ID
- Controllers will retry messages until confirmed

## Data Processing Examples

### Pump Transaction
```json
{
  "type": "UploadPumpTransaction",
  "packetId": 1001,
  "data": {
    "pumpId": 1,
    "nozzleId": 1,
    "fuelType": "DIESEL",
    "volume": 45.5,
    "amount": 89.10,
    "tagId": "TAG_123",
    "transactionId": "TXN_001"
  }
}
```

### Tank Measurement
```json
{
  "type": "UploadTankMeasurement",
  "packetId": 1002,
  "data": {
    "tankId": 1,
    "fuelType": "DIESEL",
    "level": 75.5,
    "volume": 1510.0,
    "temperature": 22.5,
    "waterLevel": 2.1,
    "ullage": 490.0
  }
}
```

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────────┐
│  PTS-2         │ ◄──────────────► │  Node.js            │
│  Controller    │                  │  WebSocket Server   │
└─────────────────┘                  │  /ptsWebSocket     │
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │  Message Handlers   │
                                    │  - Transactions     │
                                    │  - Measurements     │
                                    │  - Alerts          │
                                    │  - Status          │
                                    └─────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │  Logging System     │
                                    │  - Separate files   │
                                    │  - By message type  │
                                    │  - Daily rotation   │
                                    └─────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │  Event System       │
                                    │  - Database         │
                                    │  - Notifications    │
                                    │  - Reports          │
                                    └─────────────────────┘
```

## Error Handling

The server implements comprehensive error handling:

- **Connection Validation**: Rejects connections without required PTS headers
- **Message Validation**: Validates all incoming message formats
- **Packet ID Tracking**: Ensures proper response correlation
- **Automatic Cleanup**: Removes inactive connections
- **Graceful Degradation**: Continues operation even if individual controllers fail

## Monitoring and Debugging

### Server Logs
The server provides detailed logging for all operations:
- Connection events
- Message processing
- Error conditions
- Performance metrics

### Health Endpoints
- `/health`: Overall server status
- `/controllers`: Connected controller information
- `/controllers/:ptsId/command`: Send commands to specific controllers
- `/logs`: Log file information
- `/logs/:messageType`: Recent logs for specific message type

### Log Files
All incoming PTS controller data is automatically logged to separate files:
- Real-time data capture
- Easy debugging and troubleshooting
- Historical data analysis
- Compliance and audit trails

## Production Considerations

### Security
- Implement authentication for WebSocket connections (`ENABLE_AUTH=true`)
- Validate PTS controller IDs against whitelist
- Use HTTPS/WSS in production (`ENABLE_HTTPS=true`)
- Implement rate limiting (`MAX_CONNECTIONS_PER_IP`, `MAX_MESSAGES_PER_MINUTE`)
- Change default JWT secret (`JWT_SECRET`)

### Scalability
- Use Redis for session management across multiple server instances
- Implement load balancing for high-availability
- Use message queues for asynchronous processing
- Monitor connection limits and resource usage

### Data Persistence
- Store all PTS data in a database (configure `DB_*` variables)
- Implement data archival and cleanup
- Use time-series databases for measurement data
- Implement backup and recovery procedures

### Log Management
- Monitor log file sizes and disk usage
- Implement log rotation and compression
- Consider centralized logging (ELK stack, etc.)
- Set up log retention policies

## Troubleshooting

### Common Issues

1. **Controller Connection Rejected**
   - Check X-Pts-Id header is present
   - Verify WebSocket path configuration (`ptsWebSocket`)
   - Check server firewall settings
   - Ensure URI is entered without starting slash in PTS GUI

2. **Messages Not Processed**
   - Verify message format matches expected schema
   - Check packet ID uniqueness
   - Review server logs for validation errors

3. **High Memory Usage**
   - Check for memory leaks in message handlers
   - Monitor connection cleanup intervals
   - Implement connection limits

4. **Log File Issues**
   - Check disk space availability
   - Verify write permissions for logs directory
   - Monitor log file sizes and rotation

5. **Configuration Issues**
   - Verify `.env` file exists and is readable
   - Check environment variable values
   - Use `./setup-env.sh` to recreate `.env` file

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
DEBUG=true
VERBOSE_LOGGING=true
```

### Log Analysis

Use the built-in log viewer to analyze issues:
```bash
# Check for specific errors
node utils/logViewer.js search "error"

# View recent pump transactions
node utils/logViewer.js view UploadPumpTransaction

# Get overall log summary
node utils/logViewer.js summary
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review server logs
- Open an issue on GitHub
- Consult PTS-2 controller documentation

## Changelog

### v1.0.0
- Initial implementation
- Support for all PTS-2 message types
- WebSocket server with PTS-specific headers
- Test client for simulation
- REST API endpoints for monitoring
- Comprehensive error handling and validation
- Automatic logging system with separate files by message type
- Command-line log viewer utility
- Log management and cleanup features
- Proper WebSocket URI path configuration (`/ptsWebSocket`)
- Environment-based configuration system
- Comprehensive environment variables support
- Production-ready security and performance options 