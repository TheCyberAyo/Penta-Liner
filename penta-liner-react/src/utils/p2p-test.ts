// Simple test for P2P multiplayer functionality
// This file can be used to test the peer-to-peer connection

import { p2pClient } from './p2pMultiplayer';

export async function testP2PConnection() {
  console.log('🧪 Testing P2P Multiplayer...');
  
  try {
    // Test room creation
    console.log('📝 Testing room creation...');
    const roomId = await p2pClient.createRoom('TestPlayer');
    console.log('✅ Room created successfully:', roomId);
    
    // Test getting current player ID
    const playerId = p2pClient.getCurrentPlayerId();
    console.log('✅ Player ID generated:', playerId);
    
    // Test getting current room
    const room = p2pClient.getCurrentRoom();
    console.log('✅ Room info:', room);
    
    // Test connection status
    const isConnected = p2pClient.isConnected();
    console.log('📡 Connection status:', isConnected);
    
    console.log('🎉 P2P tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ P2P test failed:', error);
    return false;
  }
}

// Export for manual testing in browser console
(window as any).testP2P = testP2PConnection;
