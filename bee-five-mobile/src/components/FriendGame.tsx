import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import { soundManager } from '../utils/sounds';

interface FriendGameProps {
  onBackToMenu: () => void;
}

const FriendGame: React.FC<FriendGameProps> = ({ onBackToMenu }) => {
  const [timeLimit] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            onBackToMenu();
            if (soundEnabled) soundManager.playClickSound();
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.gameTitle}>Tournament Mode</Text>
        
        <View style={styles.soundControls}>
          <TouchableOpacity 
            style={[styles.soundButton, { backgroundColor: soundEnabled ? '#4CAF50' : '#666' }]}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Text style={styles.soundButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>
        <View style={styles.gameInfo}>
          <Text style={styles.timer}>Time Left: {gameState.timeLeft}s</Text>
          <Text style={styles.currentPlayer}>
            Current Player: {gameState.currentPlayer === 1 ? 'Black' : 'Yellow'}
          </Text>
        </View>

        <View style={styles.gameBoard}>
          <GameCanvas
            gameState={gameState}
            onCellClick={handleCellClick}
            onGameStateChange={() => {}}
          />
        </View>

        <View style={styles.gameControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              resetGame();
              if (soundEnabled) soundManager.playClickSound();
            }}
          >
            <Text style={styles.controlButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  backButton: {
    backgroundColor: '#FFC30B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
  },
  backButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC30B',
  },
  soundControls: {
    flexDirection: 'row',
    gap: 10,
  },
  soundButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
  },
  soundButtonText: {
    fontSize: 16,
  },
  gameContent: {
    flex: 1,
    padding: 20,
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  currentPlayer: {
    fontSize: 16,
    color: '#666',
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameControls: {
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FriendGame;