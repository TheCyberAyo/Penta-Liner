import { useState, useEffect } from 'react';
import { simpleMultiplayerClient, type SimpleMove, type SimpleGameState } from '../utils/simpleMultiplayer';
import { soundManager } from '../utils/sounds';

interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  isGameStarted: boolean;
  hostId: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  playerNumber: 1 | 2;
  isHost: boolean;
}

interface MultiplayerLobbyProps {
  onGameStart: (roomInfo: RoomInfo, playerNumber: 1 | 2) => void;
  onBackToMenu: () => void;
}

export function MultiplayerLobby({ onGameStart, onBackToMenu }: MultiplayerLobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [lobbyMode, setLobbyMode] = useState<'menu' | 'create' | 'join' | 'waiting'>('menu');
  const [error, setError] = useState<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (currentRoom) {
        simpleMultiplayerClient.leaveRoom();
      }
    };
  }, [currentRoom]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreatingRoom(true);
    setError(null);

    // Generate a simple room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create room info
    const roomInfo: RoomInfo = {
      roomId: roomCode,
      players: [
        {id: "host", name: playerName.trim(), playerNumber: 1, isHost: true}
      ],
      isGameStarted: false,
      hostId: "host"
    };
    
    // Store room info in localStorage for other players to find
    const roomData = {
      roomId: roomCode,
      hostName: playerName.trim(),
      timestamp: Date.now(),
      expires: Date.now() + (30 * 60 * 1000) // 30 minutes
    };
    localStorage.setItem(`bee5_room_${roomCode}`, JSON.stringify(roomData));
    
    setCurrentRoom(roomInfo);
    setLobbyMode('waiting');
    setIsCreatingRoom(false);
    soundManager.playClickSound();
    
    // Set up polling to wait for guest to join
    const pollForGuest = () => {
      const guestInfoStr = localStorage.getItem(`bee5_guest_${roomCode}`);
      if (guestInfoStr) {
        try {
          const guestInfo = JSON.parse(guestInfoStr);
          const guestName = guestInfo.guestName || "Guest Player";
          
          const updatedRoom: RoomInfo = {
            ...roomInfo,
            players: [
              ...roomInfo.players,
              {id: "guest", name: guestName, playerNumber: 2, isHost: false}
            ],
            isGameStarted: true
          };
          
          setCurrentRoom(updatedRoom);
          onGameStart(updatedRoom, 1);
          clearInterval(pollInterval);
        } catch (error) {
          console.warn('Could not parse guest info:', error);
        }
      }
    };
    
    // Poll every 500ms for guest to join
    const pollInterval = setInterval(pollForGuest, 500);
    
    // Clean up polling after 5 minutes if no guest joins
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsJoiningRoom(true);
    setError(null);

    const roomCodeUpper = roomCode.trim().toUpperCase();
    
    // Check if room exists
    const roomDataStr = localStorage.getItem(`bee5_room_${roomCodeUpper}`);
    if (!roomDataStr) {
      setError('Room not found. Make sure the room code is correct.');
      setIsJoiningRoom(false);
      return;
    }

    try {
      const roomData = JSON.parse(roomDataStr);
      
      // Check if room is still active
      if (Date.now() > roomData.expires) {
        localStorage.removeItem(`bee5_room_${roomCodeUpper}`);
        setError('Room has expired. Please ask the host to create a new room.');
        setIsJoiningRoom(false);
        return;
      }

      // Store guest info in localStorage for host to find
      const guestInfo = {
        roomId: roomCodeUpper,
        guestName: playerName.trim(),
        timestamp: Date.now()
      };
      localStorage.setItem(`bee5_guest_${roomCodeUpper}`, JSON.stringify(guestInfo));
      
      // Create room info
      const roomInfo: RoomInfo = {
        roomId: roomCodeUpper,
        players: [
          {id: "host", name: roomData.hostName, playerNumber: 1, isHost: true},
          {id: "guest", name: playerName.trim(), playerNumber: 2, isHost: false}
        ],
        isGameStarted: true,
        hostId: "host"
      };
      
      setCurrentRoom(roomInfo);
      setLobbyMode('waiting');
      setIsJoiningRoom(false);
      soundManager.playClickSound();
      
      // Start the game immediately
      onGameStart(roomInfo, 2);
      
    } catch (error) {
      setError('Invalid room data. Please try again.');
      setIsJoiningRoom(false);
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      // Clean up localStorage
      localStorage.removeItem(`bee5_room_${currentRoom.roomId}`);
      localStorage.removeItem(`bee5_guest_${currentRoom.roomId}`);
      simpleMultiplayerClient.leaveRoom();
    }
    setCurrentRoom(null);
    setLobbyMode('menu');
    soundManager.playClickSound();
  };

  const handleBackToMenu = () => {
    if (currentRoom) {
      handleLeaveRoom();
    }
    soundManager.playClickSound();
    onBackToMenu();
  };

  const renderLobbyMenu = () => (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'black', marginBottom: '30px' }}>
        🐝 Direct Multiplayer 🐝
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
          💻 Play directly with friends on the same network or different devices!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setLobbyMode('create')}
          disabled={!playerName.trim()}
          style={{
            padding: '12px 20px',
            fontSize: '1em',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: !playerName.trim() ? 'not-allowed' : 'pointer',
            opacity: !playerName.trim() ? 0.5 : 1
          }}
        >
          🏠 Create Room
        </button>

        <button
          onClick={() => setLobbyMode('join')}
          disabled={!playerName.trim()}
          style={{
            padding: '12px 20px',
            fontSize: '1em',
            backgroundColor: '#2196F3',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: !playerName.trim() ? 'not-allowed' : 'pointer',
            opacity: !playerName.trim() ? 0.5 : 1
          }}
        >
          🚪 Join Room
        </button>
      </div>

      {error && (
        <div style={{ color: '#f44336', fontSize: '0.9em', marginBottom: '15px' }}>
          {error}
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

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '2px solid #2196F3'
      }}>
        <p style={{ color: '#1976d2', marginBottom: '10px', fontWeight: 'bold' }}>
          💻 Direct Connection Mode
        </p>
        <p style={{ color: '#666', fontSize: '0.9em' }}>
          Share the room code with your friend to play together
        </p>
      </div>

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

      {error && (
        <div style={{ color: '#f44336', fontSize: '0.9em', marginBottom: '15px' }}>
          {error}
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

  const renderWaitingRoom = () => {
    if (!currentRoom) return null;

    const hostPlayer = currentRoom.players.find(p => p.isHost);
    const guestPlayer = currentRoom.players.find(p => !p.isHost);

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
                {hostPlayer?.name || 'Host'} (Host)
              </div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                Player 1 - Black Pieces
              </div>
            </div>

            <div style={{ fontSize: '2em', color: '#666' }}>VS</div>

            <div style={{ textAlign: 'center' }}>
              {guestPlayer ? (
                <>
                  <div style={{ fontSize: '2em', marginBottom: '10px' }}>🐝</div>
                  <div style={{ fontWeight: 'bold', color: 'black' }}>
                    {guestPlayer.name}
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Player 2 - Yellow Pieces
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

        {!guestPlayer && (
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
        {lobbyMode === 'menu' && renderLobbyMenu()}
        {lobbyMode === 'create' && renderCreateRoom()}
        {lobbyMode === 'join' && renderJoinRoom()}
        {lobbyMode === 'waiting' && renderWaitingRoom()}

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
