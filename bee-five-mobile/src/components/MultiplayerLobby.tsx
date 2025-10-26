import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { simpleMultiplayerClient, RoomInfo, PlayerInfo } from '../utils/simpleMultiplayer';
import { soundManager } from '../utils/sounds';

interface MultiplayerLobbyProps {
  onGameStart: (roomInfo: RoomInfo, playerNumber: 1 | 2) => void;
  onBackToMenu: () => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onGameStart,
  onBackToMenu,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [showRoomCodeInput, setShowRoomCodeInput] = useState(false);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      simpleMultiplayerClient.disconnect();
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsCreatingRoom(true);
    soundManager.playClickSound();

    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomInfo = await simpleMultiplayerClient.createRoomWithPlayers(roomId, playerName.trim());
      setCurrentRoom(roomInfo);
      setRoomCode(roomId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
      console.error('Error creating room:', error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    setIsJoiningRoom(true);
    soundManager.playClickSound();

    try {
      const roomInfo = await simpleMultiplayerClient.joinRoomWithPlayers(roomCode.trim().toUpperCase(), playerName.trim());
      setCurrentRoom(roomInfo);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join room. Please try again.');
      console.error('Error joining room:', error);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;

    soundManager.playClickSound();
    
    try {
      await simpleMultiplayerClient.startGame(currentRoom.roomId);
      const playerNumber = currentRoom.players.find(p => p.name === playerName.trim())?.playerNumber || 1;
      onGameStart(currentRoom, playerNumber);
    } catch (error) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
      console.error('Error starting game:', error);
    }
  };

  const handleLeaveRoom = () => {
    soundManager.playClickSound();
    if (currentRoom) {
      simpleMultiplayerClient.cleanupRoom(currentRoom.roomId);
    }
    setCurrentRoom(null);
    setRoomCode('');
    setShowRoomCodeInput(false);
  };

  const handleBackToMenu = () => {
    soundManager.playClickSound();
    if (currentRoom) {
      simpleMultiplayerClient.cleanupRoom(currentRoom.roomId);
    }
    onBackToMenu();
  };

  if (currentRoom) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Room: {currentRoom.roomId}</Text>
        
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle}>Players:</Text>
          {currentRoom.players.map((player, index) => (
            <View key={index} style={styles.playerItem}>
              <Text style={styles.playerName}>
                {player.name} {player.isHost ? '(Host)' : ''}
              </Text>
              <Text style={styles.playerNumber}>Player {player.playerNumber}</Text>
            </View>
          ))}
        </View>

        <View style={styles.roomStatus}>
          <Text style={styles.statusText}>
            {currentRoom.players.length === 2 ? 'Ready to start!' : 'Waiting for another player...'}
          </Text>
        </View>

        <View style={styles.roomActions}>
          {currentRoom.players.length === 2 && (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.leaveButton]}
            onPress={handleLeaveRoom}
          >
            <Text style={styles.buttonText}>Leave Room</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBackToMenu}
        >
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Multiplayer Lobby</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.label}>Your Name:</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          maxLength={20}
        />
      </View>

      {!showRoomCodeInput ? (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateRoom}
            disabled={isCreatingRoom}
          >
            <Text style={styles.buttonText}>
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={() => setShowRoomCodeInput(true)}
          >
            <Text style={styles.buttonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.joinSection}>
          <Text style={styles.label}>Room Code:</Text>
          <TextInput
            style={styles.input}
            value={roomCode}
            onChangeText={setRoomCode}
            placeholder="Enter room code"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            maxLength={6}
          />
          
          <View style={styles.joinActions}>
            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={handleJoinRoom}
              disabled={isJoiningRoom}
            >
              <Text style={styles.buttonText}>
                {isJoiningRoom ? 'Joining...' : 'Join'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowRoomCodeInput(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={handleBackToMenu}
      >
        <Text style={styles.buttonText}>Back to Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#333',
  },
  actionSection: {
    marginBottom: 30,
  },
  joinSection: {
    marginBottom: 30,
  },
  joinActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#32CD32',
  },
  joinButton: {
    backgroundColor: '#4169E1',
  },
  startButton: {
    backgroundColor: '#32CD32',
  },
  leaveButton: {
    backgroundColor: '#DC143C',
  },
  cancelButton: {
    backgroundColor: '#666',
    flex: 0.45,
  },
  backButton: {
    backgroundColor: '#333',
    marginTop: 20,
  },
  roomInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerNumber: {
    fontSize: 14,
    color: '#666',
  },
  roomStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  roomActions: {
    marginBottom: 20,
  },
});

export default MultiplayerLobby;
