import { useState, useEffect } from 'react';
import { p2pClient, type RoomInfo } from '../utils/p2pMultiplayer';
import { demoSupabaseMultiplayerClient, DemoSupabaseMultiplayerClient } from '../utils/demoSupabaseMultiplayer';
import { soundManager } from '../utils/sounds';

interface MultiplayerLobbyProps {
  onGameStart: (roomInfo: RoomInfo, playerNumber: 1 | 2) => void;
  onBackToMenu: () => void;
}

export function MultiplayerLobby({ onGameStart, onBackToMenu }: MultiplayerLobbyProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  // PlayerInfo is used in the component logic
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [lobbyMode, setLobbyMode] = useState<'menu' | 'create' | 'join' | 'waiting' | 'connecting'>('menu');
  const [useCrossDevice, setUseCrossDevice] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string>('');

  useEffect(() => {
    // Check if we're joining from a URL
    const roomFromUrl = DemoSupabaseMultiplayerClient.getRoomFromUrl();
    if (roomFromUrl) {
      setRoomCode(roomFromUrl);
      setUseCrossDevice(true);
      setLobbyMode('join');
    }
  }, []);

  useEffect(() => {
    // Set up P2P client event handlers
    p2pClient.onConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    };

    p2pClient.onDisconnected = () => {
      setIsConnected(false);
      setConnectionError('Connection lost');
    };

    p2pClient.onRoomJoined = (roomInfo: RoomInfo) => {
      console.log('🎉 Room joined successfully:', roomInfo);
      console.log('🔄 Setting lobby mode to waiting...');
      setCurrentRoom(roomInfo);
      setLobbyMode('waiting');
      setIsJoiningRoom(false);
      console.log('✅ State updated - should show waiting room now');
      
      // If game is already started (2 players), start immediately
      if (roomInfo.isGameStarted && roomInfo.players.length === 2) {
        console.log('🚀 Game is ready to start with 2 players');
        const currentPlayer = roomInfo.players.find(p => p.id === p2pClient.getCurrentPlayerId());
        if (currentPlayer && currentPlayer.playerNumber) {
          console.log('🎮 Starting game for player:', currentPlayer.playerNumber);
          onGameStart(roomInfo, currentPlayer.playerNumber);
        }
      }
    };

    p2pClient.onRoomUpdate = (roomInfo: RoomInfo) => {
      setCurrentRoom(roomInfo);
      
      // Start game when second player joins
      if (roomInfo.isGameStarted && roomInfo.players.length === 2) {
        const currentPlayer = roomInfo.players.find(p => p.id === p2pClient.getCurrentPlayerId());
        if (currentPlayer && currentPlayer.playerNumber) {
          onGameStart(roomInfo, currentPlayer.playerNumber);
        }
      }
    };

    p2pClient.onError = (error: string) => {
      setConnectionError(error);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    };

    // P2P is always "connected" - no server needed!
    setIsConnected(true);
    setIsConnecting(false);

    return () => {
      // Clean up
      p2pClient.onConnected = null;
      p2pClient.onDisconnected = null;
      p2pClient.onRoomJoined = null;
      p2pClient.onRoomUpdate = null;
      p2pClient.onError = null;
    };
  }, [onGameStart]);

  // No longer needed for P2P - keeping for compatibility
  const connectToServer = async () => {
    // P2P doesn't need server connection
    setIsConnected(true);
    setIsConnecting(false);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setConnectionError('Please enter your name');
      return;
    }

    setIsCreatingRoom(true);
    setConnectionError(null);

    if (useCrossDevice) {
      // Cross-device mode: create room using Demo Supabase
      const roomCode = demoSupabaseMultiplayerClient.createRoom(playerName.trim());
      const url = demoSupabaseMultiplayerClient.getRoomUrl();
      setRoomUrl(url);
      
      const mockRoom = {
        roomId: roomCode,
        players: [
          {id: "host", name: playerName.trim(), playerNumber: 1 as 1 | 2, isHost: true}
        ],
        isGameStarted: false,
        hostId: "host"
      };
      
      console.log('🏠 Creating Demo Supabase cross-device room:', mockRoom);
      setCurrentRoom(mockRoom);
      setLobbyMode('waiting');
      setIsCreatingRoom(false);
      soundManager.playClickSound();
      
      // Set up Demo Supabase room update callback
      demoSupabaseMultiplayerClient.onRoomUpdate((room) => {
        if (room.guestName && room.isGameStarted) {
          const updatedRoom = {
            ...mockRoom,
            players: [
              ...mockRoom.players,
              {id: "guest", name: room.guestName, playerNumber: 2 as 1 | 2, isHost: false}
            ],
            isGameStarted: true
          };
          console.log('🎉 Demo Supabase guest joined:', updatedRoom);
          setCurrentRoom(updatedRoom);
          onGameStart(updatedRoom, 1);
        }
      });
    } else {
      // Local mode: use existing localStorage approach
      setTimeout(() => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Store host info in localStorage for other players to find
        const hostInfo = {
          roomId: roomCode,
          hostName: playerName.trim(),
          timestamp: Date.now()
        };
        localStorage.setItem(`bee5_host_${roomCode}`, JSON.stringify(hostInfo));
        
        const mockRoom = {
          roomId: roomCode,
          players: [
            {id: "host", name: playerName.trim(), playerNumber: 1 as 1 | 2, isHost: true}
          ],
          isGameStarted: false,
          hostId: "host"
        };
        
        console.log('🏠 Creating local room:', mockRoom);
        setCurrentRoom(mockRoom);
        setLobbyMode('waiting');
        setIsCreatingRoom(false);
        soundManager.playClickSound();
        
        // Set up polling to wait for a real guest to join
        const pollForGuest = () => {
          const guestInfoStr = localStorage.getItem(`bee5_guest_${roomCode}`);
          if (guestInfoStr) {
            try {
              const guestInfo = JSON.parse(guestInfoStr);
              const guestName = guestInfo.guestName || "Guest Player";
              
              const updatedRoom = {
                ...mockRoom,
                players: [
                  ...mockRoom.players,
                  {id: "guest", name: guestName, playerNumber: 2 as 1 | 2, isHost: false}
                ],
                isGameStarted: true
              };
              console.log('🎉 Local guest joined:', updatedRoom);
              setCurrentRoom(updatedRoom);
              
              // Start the game for the host
              console.log('🎮 Starting game for host player');
              onGameStart(updatedRoom, 1);
              
              // Clear the polling interval
              clearInterval(pollInterval);
            } catch (error) {
              console.warn('Could not parse guest info:', error);
            }
          }
        };
        
        // Poll every 500ms for guest to join
        const pollInterval = setInterval(pollForGuest, 500);
        
        // Clean up polling after 30 seconds if no guest joins
        setTimeout(() => {
          clearInterval(pollInterval);
          console.log('⏰ No guest joined within 30 seconds, stopping poll');
        }, 30000);
      }, 1000); // 1 second delay to show "creating" briefly
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setConnectionError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setConnectionError('Please enter a room code');
      return;
    }

    setIsJoiningRoom(true);
    setConnectionError(null);
    setLobbyMode('connecting');

    if (useCrossDevice) {
      // Cross-device mode: join room using Demo Supabase
      const success = await demoSupabaseMultiplayerClient.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      
      if (success) {
        const mockRoom = {
          roomId: roomCode.trim().toUpperCase(),
          players: [
            {id: "host", name: "Host", playerNumber: 1 as 1 | 2, isHost: true},
            {id: "guest", name: playerName.trim(), playerNumber: 2 as 1 | 2, isHost: false}
          ],
          isGameStarted: true,
          hostId: "host"
        };
        
        console.log('🚀 Demo Supabase room joined:', mockRoom);
        setCurrentRoom(mockRoom);
        setLobbyMode('waiting');
        setIsJoiningRoom(false);
        soundManager.playClickSound();
        
        // Start the game immediately
        console.log('🎮 Starting Demo Supabase cross-device game for guest');
        onGameStart(mockRoom, 2);
      } else {
        setConnectionError('Room not found or could not join');
        setIsJoiningRoom(false);
        setLobbyMode('join');
      }
    } else {
      // Local mode: use existing localStorage approach
      setTimeout(() => {
        const roomCodeUpper = roomCode.trim().toUpperCase();
        
        // Store guest info in localStorage for host to find
        const guestInfo = {
          roomId: roomCodeUpper,
          guestName: playerName.trim(),
          timestamp: Date.now()
        };
        localStorage.setItem(`bee5_guest_${roomCodeUpper}`, JSON.stringify(guestInfo));
        
        // Try to get host name from localStorage
        let hostName = "Room Host";
        const hostInfoStr = localStorage.getItem(`bee5_host_${roomCodeUpper}`);
        if (hostInfoStr) {
          try {
            const hostInfo = JSON.parse(hostInfoStr);
            hostName = hostInfo.hostName || "Room Host";
          } catch (error) {
            console.warn('Could not parse host info:', error);
          }
        }
        
        const mockRoom = {
          roomId: roomCodeUpper,
          players: [
            {id: "host", name: hostName, playerNumber: 1 as 1 | 2, isHost: true},
            {id: "guest", name: playerName.trim(), playerNumber: 2 as 1 | 2, isHost: false}
          ],
          isGameStarted: true, // Game is ready to start with 2 players
          hostId: "host"
        };
        
        console.log('🚀 Local room joined:', mockRoom);
        setCurrentRoom(mockRoom);
        setLobbyMode('waiting');
        setIsJoiningRoom(false);
        soundManager.playClickSound();
        
        // Since we have 2 players, start the game immediately
        console.log('🎮 Starting local game immediately with 2 players');
        const currentPlayer = mockRoom.players.find(p => p.id === "guest");
        if (currentPlayer && currentPlayer.playerNumber) {
          console.log('🎮 Starting game for player:', currentPlayer.playerNumber);
          onGameStart(mockRoom, currentPlayer.playerNumber);
        }
      }, 1000); // 1 second delay to show "connecting" briefly
    }
  };

  const handleLeaveRoom = () => {
    p2pClient.leaveRoom();
    soundManager.playClickSound();
  };

  const handleBackToMenu = () => {
    if (currentRoom) {
      p2pClient.leaveRoom();
    }
    soundManager.playClickSound();
    onBackToMenu();
  };

  const renderConnectionStatus = () => {
    if (isConnecting) {
      return (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ color: 'black', fontSize: '1.1em', marginBottom: '10px' }}>
            🔗 Connecting to server...
          </div>
          <div style={{ color: '#666', fontSize: '0.9em' }}>
            Please wait while we establish connection
          </div>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ color: '#f44336', fontSize: '1.1em', marginBottom: '10px' }}>
            ❌ Connection Failed
          </div>
          <div style={{ color: '#666', fontSize: '0.9em', marginBottom: '15px' }}>
            {connectionError || 'Unable to connect to multiplayer server'}
          </div>
          <button
            onClick={connectToServer}
            style={{
              padding: '8px 16px',
              fontSize: '0.9em',
              backgroundColor: '#2196F3',
              color: 'white',
              border: '1px solid black',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry Connection
          </button>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ color: '#4CAF50', fontSize: '1.1em' }}>
          ✅ Connected to server
        </div>
      </div>
    );
  };

  const renderLobbyMenu = () => (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'black', marginBottom: '30px' }}>
        🐝 Online Multiplayer 🐝
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '1em',
            borderRadius: '5px',
            border: '2px solid black',
            width: '200px',
            textAlign: 'center'
          }}
          maxLength={20}
        />
      </div>

      <div style={{ 
        marginBottom: '20px', 
        backgroundColor: '#e8f5e8', 
        padding: '10px', 
        borderRadius: '8px',
        border: '2px solid #4CAF50'
      }}>
        <p style={{ 
          color: '#2e7d32', 
          fontSize: '0.9em', 
          margin: 0, 
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🌐 Cross-Device Mode Enabled - Play with friends on different devices!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setLobbyMode('create')}
          disabled={!isConnected || !playerName.trim()}
          style={{
            padding: '12px 20px',
            fontSize: '1em',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: !isConnected || !playerName.trim() ? 'not-allowed' : 'pointer',
            opacity: !isConnected || !playerName.trim() ? 0.5 : 1
          }}
        >
          🏠 Create Room
        </button>

        <button
          onClick={() => setLobbyMode('join')}
          disabled={!isConnected || !playerName.trim()}
          style={{
            padding: '12px 20px',
            fontSize: '1em',
            backgroundColor: '#2196F3',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: !isConnected || !playerName.trim() ? 'not-allowed' : 'pointer',
            opacity: !isConnected || !playerName.trim() ? 0.5 : 1
          }}
        >
          🚪 Join Room
        </button>
      </div>

      {connectionError && (
        <div style={{ color: '#f44336', fontSize: '0.9em', marginBottom: '15px' }}>
          {connectionError}
        </div>
      )}
    </div>
  );

  const renderCreateRoom = () => (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'black', marginBottom: '20px' }}>Create New Room</h3>
      
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Creating a room for: <strong>{playerName}</strong>
      </p>

      {useCrossDevice && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px solid #2196F3'
        }}>
          <p style={{ color: '#1976d2', marginBottom: '10px', fontWeight: 'bold' }}>
            🌐 Cross-Device Mode Enabled
          </p>
          <p style={{ color: '#666', fontSize: '0.9em' }}>
            Share the room URL with your friend on a different device
          </p>
        </div>
      )}

      <button
        onClick={handleCreateRoom}
        disabled={isCreatingRoom}
        style={{
          padding: '12px 24px',
          fontSize: '1.1em',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          cursor: isCreatingRoom ? 'not-allowed' : 'pointer',
          opacity: isCreatingRoom ? 0.5 : 1,
          marginBottom: '20px'
        }}
      >
        {isCreatingRoom ? '🔄 Creating...' : '🏠 Create Room'}
      </button>

      {roomUrl && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px solid #ccc'
        }}>
          <p style={{ color: 'black', marginBottom: '10px', fontWeight: 'bold' }}>
            📋 Room URL (share this with your friend):
          </p>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            fontSize: '0.9em',
            color: '#333'
          }}>
            {roomUrl}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomUrl);
              alert('URL copied to clipboard!');
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              fontSize: '0.9em',
              backgroundColor: '#2196F3',
              color: 'white',
              border: '1px solid black',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📋 Copy URL
          </button>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setLobbyMode('menu')}
          style={{
            padding: '8px 16px',
            fontSize: '0.9em',
            backgroundColor: '#666',
            color: 'white',
            border: '1px solid black',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  const renderJoinRoom = () => (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'black', marginBottom: '20px' }}>Join Room</h3>
      
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Joining as: <strong>{playerName}</strong>
      </p>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          style={{
            padding: '10px',
            fontSize: '1.2em',
            borderRadius: '5px',
            border: '2px solid black',
            width: '150px',
            textAlign: 'center',
            textTransform: 'uppercase'
          }}
          maxLength={6}
        />
      </div>

      <button
        onClick={handleJoinRoom}
        disabled={isJoiningRoom || !roomCode.trim()}
        style={{
          padding: '12px 24px',
          fontSize: '1.1em',
          backgroundColor: '#2196F3',
          color: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          cursor: isJoiningRoom || !roomCode.trim() ? 'not-allowed' : 'pointer',
          opacity: isJoiningRoom || !roomCode.trim() ? 0.5 : 1,
          marginBottom: '20px'
        }}
      >
        {isJoiningRoom ? '🔄 Joining...' : '🚪 Join Room'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setLobbyMode('menu')}
          style={{
            padding: '8px 16px',
            fontSize: '0.9em',
            backgroundColor: '#666',
            color: 'white',
            border: '1px solid black',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  const renderConnecting = () => (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'black', marginBottom: '20px' }}>
        🔄 Connecting to Room...
      </h3>
      
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 0, 0.2)', 
        padding: '20px', 
        borderRadius: '10px',
        border: '2px solid #FFC30B',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2em', marginBottom: '15px' }}>
          <div style={{ 
            animation: 'pulse 1.5s infinite',
            color: '#FFC30B'
          }}>
            🐝
          </div>
        </div>
        <div style={{ color: 'black', fontWeight: 'bold', marginBottom: '10px' }}>
          Establishing peer-to-peer connection...
        </div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          This may take a few moments. Please wait while we connect you to the host.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setLobbyMode('join');
            setIsJoiningRoom(false);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '1em',
            backgroundColor: '#f44336',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        
      </div>
    </div>
  );

  const renderWaitingRoom = () => {
    if (!currentRoom) return null;

    const currentPlayer = currentRoom.players.find(p => p.id === p2pClient.getCurrentPlayerId());
    const otherPlayer = currentRoom.players.find(p => p.id !== p2pClient.getCurrentPlayerId());

    return (
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'black', marginBottom: '20px' }}>
          Room: {currentRoom.roomId}
        </h3>

        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          padding: '20px', 
          borderRadius: '10px',
          border: '2px solid black',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: 'black', marginBottom: '15px' }}>Players ({currentRoom.players.length}/2)</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}>🐝</div>
              <div style={{ fontWeight: 'bold', color: 'black' }}>
                {currentPlayer?.name || 'You'} {currentPlayer?.isHost ? '(Host)' : ''}
              </div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                Player {currentPlayer?.playerNumber || 1} - Black Pieces
              </div>
            </div>

            <div style={{ fontSize: '2em', color: '#666' }}>VS</div>

            <div style={{ textAlign: 'center' }}>
              {otherPlayer ? (
                <>
                  <div style={{ fontSize: '2em', marginBottom: '10px' }}>🐝</div>
                  <div style={{ fontWeight: 'bold', color: 'black' }}>
                    {otherPlayer.name}
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Player {otherPlayer.playerNumber} - Yellow Pieces
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2em', marginBottom: '10px', opacity: 0.3 }}>⏳</div>
                  <div style={{ color: '#666', fontStyle: 'italic' }}>
                    Waiting for player...
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Share room code: <strong>{currentRoom.roomId}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!otherPlayer && (
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 0, 0.2)', 
            padding: '15px', 
            borderRadius: '8px',
            border: '2px solid #FFC30B',
            marginBottom: '20px'
          }}>
            <div style={{ color: 'black', fontWeight: 'bold', marginBottom: '10px' }}>
              📋 Share Room Code
            </div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'black', marginBottom: '10px' }}>
              {currentRoom.roomId}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              Send this code to your friend so they can join!
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleLeaveRoom}
            style={{
              padding: '10px 20px',
              fontSize: '1em',
              backgroundColor: '#f44336',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🚪 Leave Room
          </button>
          
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      backgroundColor: '#FFC30B', 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'lightskyblue',
        borderRadius: '15px',
        padding: '40px',
        minWidth: '400px',
        maxWidth: '600px',
        border: '4px solid black',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
      }}>
        {renderConnectionStatus()}
        
        {isConnected && (
          <>
            {lobbyMode === 'menu' && renderLobbyMenu()}
            {lobbyMode === 'create' && renderCreateRoom()}
            {lobbyMode === 'join' && renderJoinRoom()}
            {lobbyMode === 'connecting' && renderConnecting()}
            {lobbyMode === 'waiting' && renderWaitingRoom()}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={handleBackToMenu}
            style={{
              padding: '10px 20px',
              fontSize: '1em',
              backgroundColor: '#666',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
