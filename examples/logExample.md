# PTS Controller Log File Examples

This document shows examples of what the log files will look like when the PTS controller server is running and receiving data.

## Log Directory Structure

```
logs/
├── Connection_2024-01-15.log
├── Disconnection_2024-01-15.log
├── UploadPumpTransaction_2024-01-15.log
├── UploadTankMeasurement_2024-01-15.log
├── UploadStatus_2024-01-15.log
├── UploadGpsRecord_2024-01-15.log
├── UploadAlertRecord_2024-01-15.log
├── UploadConfiguration_2024-01-15.log
├── RequestTagBalance_2024-01-15.log
└── Ping_2024-01-15.log
```

## Example Log Entries

### 1. Connection Log (`Connection_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "Connection",
  "data": {
    "firmwareVersion": "2021-11-12T08:05:41",
    "configIdentifier": "CONFIG_001",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
{
  "timestamp": "2024-01-15T10:35:00.000Z",
  "ptsId": "0041001C524E500420323442",
  "messageType": "Connection",
  "data": {
    "firmwareVersion": "2021-11-12T08:05:41",
    "configIdentifier": "CONFIG_002",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 2. Pump Transaction Log (`UploadPumpTransaction_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:32:15.123Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadPumpTransaction",
  "data": {
    "packetId": 1001,
    "pumpId": 1,
    "nozzleId": 1,
    "fuelType": "DIESEL",
    "volume": 45.5,
    "amount": 89.10,
    "tagId": "TAG_123",
    "transactionId": "TXN_001",
    "timestamp": "2024-01-15T10:32:15.123Z"
  }
}
--------------------------------------------------------------------------------
{
  "timestamp": "2024-01-15T10:45:30.456Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadPumpTransaction",
  "data": {
    "packetId": 1002,
    "pumpId": 2,
    "nozzleId": 2,
    "fuelType": "GASOLINE",
    "volume": 32.8,
    "amount": 67.45,
    "tagId": "TAG_456",
    "transactionId": "TXN_002",
    "timestamp": "2024-01-15T10:45:30.456Z"
  }
}
--------------------------------------------------------------------------------
```

### 3. Tank Measurement Log (`UploadTankMeasurement_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadTankMeasurement",
  "data": {
    "packetId": 2001,
    "tankId": 1,
    "fuelType": "DIESEL",
    "level": 75.5,
    "volume": 1510.0,
    "temperature": 22.5,
    "waterLevel": 2.1,
    "ullage": 490.0,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadTankMeasurement",
  "data": {
    "packetId": 2002,
    "tankId": 2,
    "fuelType": "GASOLINE",
    "level": 60.2,
    "volume": 1204.0,
    "temperature": 24.1,
    "waterLevel": 1.8,
    "ullage": 796.0,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 4. Status Update Log (`UploadStatus_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadStatus",
  "data": {
    "packetId": 3001,
    "systemStatus": "OPERATIONAL",
    "pumps": [
      {
        "id": 1,
        "status": "IDLE",
        "fuelType": "DIESEL"
      },
      {
        "id": 2,
        "status": "BUSY",
        "fuelType": "GASOLINE"
      }
    ],
    "tanks": [
      {
        "id": 1,
        "fuelType": "DIESEL",
        "level": 75.5,
        "volume": 1510.0
      },
      {
        "id": 2,
        "fuelType": "GASOLINE",
        "level": 60.2,
        "volume": 1204.0
      }
    ],
    "readers": [
      {
        "id": 1,
        "status": "ONLINE",
        "type": "RFID"
      }
    ],
    "priceBoards": [
      {
        "id": 1,
        "status": "ONLINE",
        "fuelType": "DIESEL",
        "price": 3.99
      }
    ],
    "gpsStatus": "ONLINE",
    "communicationStatus": "ONLINE",
    "batteryLevel": 92.5,
    "temperature": 23.8,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 5. GPS Record Log (`UploadGpsRecord_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadGpsRecord",
  "data": {
    "packetId": 4001,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 12.5,
    "speed": 0.0,
    "heading": 0.0,
    "accuracy": 2.5,
    "satellites": 9,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 6. Alert Record Log (`UploadAlertRecord_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:35:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "UploadAlertRecord",
  "data": {
    "packetId": 5001,
    "alertType": "LOW_FUEL_LEVEL",
    "severity": "WARNING",
    "message": "Tank 2 fuel level below 20%",
    "component": "TANK_2",
    "value": 15.2,
    "threshold": 20.0,
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 7. Tag Balance Request Log (`RequestTagBalance_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:32:15.123Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "RequestTagBalance",
  "data": {
    "packetId": 6001,
    "tagId": "TAG_123",
    "timestamp": "2024-01-15T10:32:15.123Z"
  }
}
--------------------------------------------------------------------------------
```

### 8. Ping Log (`Ping_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "Ping",
  "data": {
    "packetId": 7001,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ptsId": "0041001C524E500420323442",
  "messageType": "Ping",
  "data": {
    "packetId": 7002,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
--------------------------------------------------------------------------------
```

### 9. Disconnection Log (`Disconnection_2024-01-15.log`)

```json
{
  "timestamp": "2024-01-15T18:00:00.000Z",
  "ptsId": "0041001C524E500420323441",
  "messageType": "Disconnection",
  "data": {
    "timestamp": "2024-01-15T18:00:00.000Z",
    "firmwareVersion": "2021-11-12T08:05:41",
    "configIdentifier": "CONFIG_001"
  }
}
--------------------------------------------------------------------------------
```

## Log File Benefits

1. **Real-time Data Capture**: Every message from PTS controllers is immediately logged
2. **Easy Debugging**: Separate files make it easy to troubleshoot specific message types
3. **Historical Analysis**: Daily log files provide historical data for analysis
4. **Compliance**: Complete audit trail of all controller communications
5. **Performance Monitoring**: Track message frequency and timing
6. **Error Tracking**: Identify and resolve communication issues quickly

## Log File Management

- **Daily Rotation**: New log file created each day
- **Automatic Cleanup**: Logs older than 30 days are automatically removed
- **Size Monitoring**: Monitor log file sizes to prevent disk space issues
- **Backup**: Consider backing up important log files for compliance 