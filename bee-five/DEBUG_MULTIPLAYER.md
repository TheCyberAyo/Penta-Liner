# 🐛 Bee-Five Multiplayer Debug Guide

## Current Issue: "Connecting..." Screen Hangs

### What I've Fixed:
1. ✅ **Simplified Connection Flow**: Removed complex WebRTC polling
2. ✅ **Immediate Progression**: Calls `onRoomJoined` immediately after room validation
3. ✅ **Enhanced Debugging**: Added detailed console logs throughout the process
4. ✅ **Error Handling**: Better error messages and state management

### Debug Steps:

#### Step 1: Open Browser Console
1. Open the game in two browser windows
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab

#### Step 2: Test Room Creation
**Window 1 (Host):**
1. Click "🌐 Online Play"
2. Enter name: "Player1"
3. Click "🏠 Create Room"
4. **Check console for these logs:**
   ```
   🏠 Creating room: ABC123
   📋 Room created successfully: {roomId: "ABC123", ...}
   ```

#### Step 3: Test Room Joining
**Window 2 (Guest):**
1. Click "🌐 Online Play"
2. Enter name: "Player2"
3. Click "🚪 Join Room"
4. Enter room code from Window 1
5. Click "🚪 Join Room"
6. **Check console for these logs:**
   ```
   🖱️ Join room button clicked
   🔄 Setting joining state and clearing errors...
   🔄 Attempting to join room: ABC123
   🔄 Calling p2pClient.joinRoom...
   🔄 Starting room join process...
   📋 Found room data: {roomId: "ABC123", ...}
   🏠 Created room info: {roomId: "ABC123", players: [...]}
   🚀 Calling onRoomJoined callback...
   ✅ onRoomJoined callback called successfully
   🎉 Room joined successfully: {roomId: "ABC123", ...}
   🔄 Setting lobby mode to waiting...
   ✅ State updated - should show waiting room now
   ```

### Expected Behavior:
- **Before**: Stuck on "🔄 Connecting to Room..." screen
- **After**: Should show waiting room with both players listed

### If Still Hanging:

#### Check 1: Callback Registration
In console, run:
```javascript
// Check if callbacks are registered
console.log('onRoomJoined callback:', p2pClient.onRoomJoined);
console.log('onConnected callback:', p2pClient.onConnected);
```

#### Check 2: State Values
In console, run:
```javascript
// Check current state (if you can access React DevTools)
// Or look for these logs in console
```

#### Check 3: localStorage Data
In console, run:
```javascript
// Check if room data exists
Object.keys(localStorage).filter(key => key.startsWith('bee5_'))
```

### Common Issues & Solutions:

#### Issue: "onRoomJoined callback is not set!"
**Solution**: The callback isn't being registered properly. Check if `useEffect` is running.

#### Issue: Console shows success but UI doesn't update
**Solution**: React state update issue. The callback is called but `setLobbyMode('waiting')` isn't working.

#### Issue: "Room not found" error
**Solution**: Make sure both windows are on the same domain and localStorage is enabled.

### Quick Fix Test:
If the issue persists, try this in the browser console:
```javascript
// Force trigger the room joined callback
if (window.p2pClient) {
  const mockRoom = {
    roomId: "TEST123",
    players: [
      {id: "host", name: "Host", playerNumber: 1, isHost: true},
      {id: "guest", name: "Guest", playerNumber: 2, isHost: false}
    ],
    isGameStarted: true,
    hostId: "host"
  };
  window.p2pClient.onRoomJoined(mockRoom);
}
```

### Next Steps:
1. **Test with console open** and check the logs
2. **Report which logs appear** and which are missing
3. **Check if the UI updates** after the logs appear
4. **Try the quick fix test** if the issue persists

The key is to see exactly where the process is failing by following the console logs step by step.
