# WebSocket Close Code 1006 Troubleshooting Guide

## 🚨 Problem Description

Your PTS controller is repeatedly connecting and immediately disconnecting with **Close Code 1006** (abnormal closure). This indicates the connection is being terminated without a proper WebSocket close frame, usually due to protocol or configuration issues.

## 🔍 What Close Code 1006 Means

- **1006**: Abnormal closure - connection was closed without sending a close frame
- **Duration**: 0 seconds (immediate disconnection)
- **Messages**: 0 (no data exchanged)
- **Pattern**: Rapid reconnection attempts every ~1 second

## ⚠️ Root Causes

### 1. WebSocket Configuration Issues
- **Wrong WebSocket path** in PTS controller
- **Incorrect protocol version** (should be WebSocket v13)
- **Missing or wrong headers** in the handshake

### 2. Network/Firewall Issues
- **Firewall blocking** WebSocket connections
- **Proxy interference** with WebSocket upgrade
- **Network timeout** during handshake

### 3. PTS Controller Issues
- **Firmware compatibility** problems
- **WebSocket implementation** bugs in PTS controller
- **Configuration mismatch** between PTS and server

## 🔧 Step-by-Step Solutions

### Step 1: Verify PTS Controller Configuration

In your PTS controller's GUI:

1. **Server IP**: `192.168.1.100` (your server's IP)
2. **Port**: `3000` (or your custom port)
3. **Server request URI**: `ptsWebSocket` ⚠️ **WITHOUT starting slash**
4. **Protocol**: `WebSocket` or `WS`
5. **Connection Type**: `Client`

### Step 2: Check Network Connectivity

```bash
# Test basic connectivity
ping 192.168.1.100

# Test port connectivity
telnet 192.168.1.100 3000

# Check if WebSocket endpoint responds
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://192.168.1.100:3000/ptsWebSocket
```

### Step 3: Review Server Logs

Look for these patterns in your server console:

```
✅ Good signs:
- "Verifying WebSocket client" with proper headers
- "PTS Controller attempting connection"
- "connection established successfully"

❌ Bad signs:
- "Close code 1006 (abnormal closure)"
- "Rate limiting" messages
- Missing headers in verification logs
```

### Step 4: Test with Different Settings

Try these WebSocket server modifications:

1. **Disable all extensions**:
   ```javascript
   perMessageDeflate: false
   ```

2. **Accept any protocol**:
   ```javascript
   handleProtocols: () => false
   ```

3. **Skip validation**:
   ```javascript
   skipUTF8Validation: true
   ```

### Step 5: Firewall Configuration

Ensure these ports are open:

```bash
# For Ubuntu/Debian
sudo ufw allow 3000/tcp

# For CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Check if port is listening
netstat -tlnp | grep 3000
```

## 🧪 Testing Solutions

### Test 1: Manual WebSocket Connection

Use a WebSocket testing tool:

```javascript
// Browser console test
const ws = new WebSocket('ws://192.168.1.100:3000/ptsWebSocket');
ws.onopen = () => console.log('Connected!');
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
ws.onerror = (e) => console.log('Error:', e);
```

### Test 2: Check Server Response

```bash
# Test HTTP upgrade
curl -v \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "X-Pts-Id: TEST123" \
  http://192.168.1.100:3000/ptsWebSocket
```

Expected response:
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

### Test 3: Run Connection Diagnostics

```bash
# Run the diagnostic script
node debug-connection.js
```

## 🎯 Specific Fixes for PTS Controllers

### Fix 1: Alternative WebSocket Path
If `ptsWebSocket` doesn't work, try:
- `pts` 
- `websocket`
- Empty path (just the IP and port)

### Fix 2: Different Port
Try alternative ports:
- `8080` (common WebSocket port)
- `8443` (secure WebSocket)
- `9001` (WebSocket testing port)

### Fix 3: HTTP First, Then Upgrade
Some PTS controllers need HTTP first:

1. Set up HTTP endpoint
2. Return upgrade instructions
3. Let PTS controller initiate WebSocket upgrade

## 🚀 Advanced Solutions

### Solution 1: WebSocket Proxy
Use nginx as WebSocket proxy:

```nginx
location /ptsWebSocket {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Solution 2: Alternative WebSocket Library
Try using `ws` with different options:

```javascript
const wss = new WebSocket.Server({
    port: 3000,
    path: '/ptsWebSocket',
    perMessageDeflate: false,
    maxPayload: 16 * 1024,
    handshakeTimeout: 10000
});
```

### Solution 3: Custom Handshake
Implement custom WebSocket handshake for PTS compatibility.

## 📊 Monitoring

### Check Connection Patterns
```bash
# Monitor connection attempts
tail -f logs/ShortConnection_$(date +%Y-%m-%d).log

# Check for rate limiting
grep "Rate limiting" server.log
```

### Success Indicators
- Connection duration > 0 seconds
- Messages received > 0
- Close code != 1006
- No rapid reconnection loops

## 🆘 If Nothing Works

1. **Contact PTS Support**: Get WebSocket implementation details
2. **Firmware Update**: Check if newer firmware fixes WebSocket issues
3. **Alternative Protocol**: Consider HTTP polling instead of WebSocket
4. **Packet Capture**: Use Wireshark to analyze the handshake failure

## 📞 Getting Help

When asking for help, provide:

1. **PTS Controller Model & Firmware Version**
2. **Server Console Logs** (connection attempts)
3. **Network Configuration** (IP, ports, firewall)
4. **WebSocket Test Results** (browser/curl tests)
5. **Diagnostic Script Output** (`node debug-connection.js`)

---

**Remember**: Close code 1006 means the WebSocket handshake is failing at the protocol level. Focus on configuration and network connectivity first! 