# PTS Controller WebSocket Setup Guide

This guide explains how to configure your PTS-2 controller to connect to the WebSocket server.

## Prerequisites

1. **WebSocket Server Running**: Ensure the Node.js server is running on your network
2. **Network Access**: PTS controller must be able to reach the server IP address
3. **PTS Controller GUI Access**: You need access to the PTS controller's configuration interface

## Server Information

Before configuring the PTS controller, note down these details:

- **Server IP Address**: The IP address where your WebSocket server is running
- **Port**: 3000 (default) or your custom port
- **WebSocket Path**: `ptsWebSocket`

## PTS Controller Configuration Steps

### Step 1: Access PTS Controller GUI

1. Open your web browser
2. Navigate to your PTS controller's IP address
3. Log in with appropriate credentials

### Step 2: Navigate to WebSocket Configuration

1. Look for **Communication** or **Network** settings
2. Find **WebSocket** or **Remote Server** configuration
3. Look for **Server request URI** or similar field

### Step 3: Configure Connection Settings

Fill in the following fields:

| Field | Value | Notes |
|-------|-------|-------|
| **Server IP/Hostname** | `192.168.1.100` | Replace with your actual server IP |
| **Port** | `3000` | Or your custom port if different |
| **Server request URI** | `ptsWebSocket` | **IMPORTANT: No starting slash** |
| **Protocol** | `WebSocket` or `WS` | Select WebSocket protocol |
| **Connection Type** | `Client` | PTS controller connects as client |

### Step 4: Save Configuration

1. Click **Save** or **Apply** button
2. Wait for configuration to be applied
3. Check for success message

### Step 5: Test Connection

1. Look for **Test Connection** or **Connect** button
2. Click to test the WebSocket connection
3. Check for connection status indicators

## Example Configuration

Here's what your configuration should look like:

```
Server Configuration:
├── Server IP: 192.168.1.100
├── Port: 3000
├── Server request URI: ptsWebSocket
├── Protocol: WebSocket
└── Connection Type: Client
```

**Full WebSocket URL**: `ws://192.168.1.100:3000/ptsWebSocket`

## Connection Status Indicators

After configuration, look for these indicators:

- ✅ **Connected**: Green light or "ONLINE" status
- ❌ **Disconnected**: Red light or "OFFLINE" status
- 🔄 **Connecting**: Yellow light or "CONNECTING" status
- ⚠️ **Error**: Red light with error message

## Troubleshooting

### Connection Issues

1. **Cannot Connect**
   - Verify server IP address is correct
   - Check if server is running on port 3000
   - Ensure firewall allows connections
   - Verify network connectivity

2. **Wrong URI Error**
   - Ensure URI is `ptsWebSocket` (no starting slash)
   - Check for typos in the URI field
   - Verify server is configured for this path

3. **Authentication Issues**
   - Check if server requires authentication
   - Verify PTS controller credentials
   - Check server logs for authentication errors

### Common Mistakes

- ❌ **Wrong URI**: `/ptsWebSocket` (with slash)
- ❌ **Wrong Port**: Using HTTP port 80 instead of 3000
- ❌ **Wrong Protocol**: Selecting HTTP instead of WebSocket
- ❌ **Wrong IP**: Using localhost instead of actual server IP

## Verification

### Server Side

Check your server logs for successful connections:

```bash
# View server logs
node utils/logViewer.js view Connection

# Check server status
curl http://localhost:3000/health
curl http://localhost:3000/controllers
```

### PTS Controller Side

1. **Status Page**: Check connection status
2. **Logs**: View connection logs if available
3. **Test Messages**: Send test data to verify communication

## Advanced Configuration

### Custom Port

If using a different port (e.g., 8080):

```
Server IP: 192.168.1.100
Port: 8080
Server request URI: ptsWebSocket
```

**Full URL**: `ws://192.168.1.100:8080/ptsWebSocket`

### SSL/TLS (Production)

For production environments, use secure WebSocket:

```
Protocol: WSS (Secure WebSocket)
Port: 443 (or your SSL port)
Server request URI: ptsWebSocket
```

**Full URL**: `wss://yourdomain.com/ptsWebSocket`

## Testing the Connection

Once configured, the PTS controller should:

1. **Automatically Connect** when powered on
2. **Send Status Updates** every few seconds
3. **Upload Data** for pump transactions, tank measurements, etc.
4. **Receive Responses** from the server

## Monitoring

Monitor the connection through:

- **Server Logs**: Check `./logs/` directory for incoming data
- **REST API**: Use `/health` and `/controllers` endpoints
- **PTS Controller GUI**: Monitor connection status
- **Network Tools**: Use `netstat` or similar to verify connections

## Support

If you encounter issues:

1. Check server logs for error messages
2. Verify network connectivity
3. Test with the provided test client
4. Review this configuration guide
5. Check server and PTS controller documentation

## Quick Reference

**Server Configuration:**
- IP: `[YOUR_SERVER_IP]`
- Port: `3000`
- URI: `ptsWebSocket`

**PTS Controller:**
- Server request URI: `ptsWebSocket` (no slash)
- Protocol: WebSocket
- Connection: Client mode 