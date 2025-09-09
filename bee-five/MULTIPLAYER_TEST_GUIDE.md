# 🐝 Bee-Five Multiplayer Test Guide

## How to Test Peer-to-Peer Multiplayer

### Prerequisites
- Two different browser windows/tabs (or different browsers)
- Both should be running the same Bee-Five application

### Step-by-Step Testing

#### 1. **Host Player (Window/Tab 1)**
1. Open the game in your first browser window
2. Click "🌐 Online Play"
3. Enter your name (e.g., "Player1")
4. Click "🏠 Create Room"
5. **Copy the room code** that appears (e.g., "ABC123")

#### 2. **Guest Player (Window/Tab 2)**
1. Open the game in a second browser window/tab
2. Click "🌐 Online Play" 
3. Enter your name (e.g., "Player2")
4. Click "🚪 Join Room"
5. **Enter the room code** from step 1
6. Click "🚪 Join Room"

### Expected Behavior

#### ✅ **Successful Connection**
- Guest sees "🔄 Connecting to Room..." screen
- After 1-3 seconds, both players should see the waiting room
- Host sees: "Room: ABC123" with both player names
- Guest sees the same room information
- Game should start automatically when both players are connected

#### ❌ **Common Issues & Solutions**

**Issue**: "Room not found" error
- **Solution**: Double-check the room code is entered correctly
- **Solution**: Make sure the host window is still open and active

**Issue**: "Connection timeout" error  
- **Solution**: Both players should be on the same network or have good internet
- **Solution**: Try refreshing both windows and creating a new room

**Issue**: Nothing happens when clicking "Join Room"
- **Solution**: Check the browser console (F12) for error messages
- **Solution**: Make sure localStorage is enabled in your browser

### Debug Information

#### Browser Console Logs
Open browser console (F12) to see detailed logs:
- `🔄 Attempting to join room: ABC123`
- `✅ Successfully initiated room join process`
- `Connection state: connected`

#### LocalStorage Check
In browser console, check if room data exists:
```javascript
// Check for rooms
Object.keys(localStorage).filter(key => key.startsWith('bee5_room_'))

// Check for connections  
Object.keys(localStorage).filter(key => key.startsWith('bee5_connection_'))
```

### Troubleshooting Commands

#### Clear All P2P Data
```javascript
// Run in browser console to clear all multiplayer data
Object.keys(localStorage)
  .filter(key => key.startsWith('bee5_'))
  .forEach(key => localStorage.removeItem(key));
```

### Test Scenarios

1. **Basic Connection**: Host creates room, guest joins successfully
2. **Room Expiration**: Wait 30+ minutes, try to join expired room
3. **Multiple Guests**: Try joining the same room with multiple guests (should fail gracefully)
4. **Host Leaves**: Host closes window, guest should see disconnection
5. **Network Issues**: Disconnect internet briefly, test reconnection

### Success Criteria

- ✅ Room creation generates unique codes
- ✅ Room joining works within 5 seconds
- ✅ Both players see each other's names
- ✅ Game starts automatically when connected
- ✅ Real-time game moves sync between players
- ✅ Proper error messages for invalid scenarios

### Performance Notes

- Connection typically takes 1-5 seconds
- Works best on same network (LAN)
- May take longer on different networks due to NAT traversal
- Uses Google's free STUN servers for connection assistance
