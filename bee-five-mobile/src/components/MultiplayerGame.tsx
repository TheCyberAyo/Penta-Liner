import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import { soundManager } from '../utils/sounds';
import { simpleMultiplayerClient, RoomInfo, SimpleMove } from '../utils/simpleMultiplayer';
import { getTimeLimitForLevel } from '../utils/gameLogic';

interface MultiplayerGameProps {
  roomInfo: RoomInfo;
  playerNumber: 1 | 2;
  onBackToMenu: () => void;
}

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  roomInfo,
  playerNumber,
  onBackToMenu,
}) => {
  const [gameStarted, setGameStarted] = useState(false);
  
  // Game logic hook for multiplayer
  const { gameState, handleCellClick, resetGame, updateGameState } = useGameLogic({
    timeLimit: getTimeLimitForLevel(1), // Use standard time limit for multiplayer
    startingPlayer: 1,
    gameNumber: 1,
    currentMatch: 1,
  });

  useEffect(() => {
    // Set up multiplayer callbacks
    simpleMultiplayerClient.onMove((move: SimpleMove) => {
      if (move.player !== playerNumber) {
        // Handle opponent's move
        handleCellClick(move.row, move.col);
      }
    });

    simpleMultiplayerClient.onGameState((gameState) => {
      // Sync game state with server
      updateGameState(gameState);
    });

    return () => {
      simpleMultiplayerClient.disconnect();
    };
  }, [playerNumber, handleCellClick, updateGameState]);

  const handleCellClickWithMultiplayer = (row: number, col: number) => {
    if (gameState.currentPlayer === playerNumber && gameState.isGameActive) {
      handleCellClick(row, col);
      // Send move to other players
      simpleMultiplayerClient.sendMove(row, col);
    }
  };

  const handleResetGame = () => {
    resetGame();
    // Update game state on server
    simpleMultiplayerClient.updateGameState(gameState);
  };

  const handleBackToMenu = () => {
    simpleMultiplayerClient.disconnect();
    onBackToMenu();
  };

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.startContainer}>
          <Text style={styles.title}>Multiplayer Game</Text>
          <Text style={styles.subtitle}>Room: {roomInfo.roomId}</Text>
          <Text style={styles.playerInfo}>You are Player {playerNumber}</Text>
          <Text style={styles.waitingText}>Waiting for game to start...</Text>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              soundManager.playClickSound();
              setGameStarted(true);
            }}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToMenu}
          >
            <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <Text style={styles.title}>Multiplayer Game</Text>
        <Text style={styles.roomInfo}>Room: {roomInfo.roomId}</Text>
        <Text style={styles.playerInfo}>You are Player {playerNumber}</Text>
        <Text style={styles.timer}>Time Left: {gameState.timeLeft}s</Text>
      </View>

      <View style={styles.gameContent}>
        <GameCanvas
          gameState={gameState}
          onCellClick={handleCellClickWithMultiplayer}
          onGameStateChange={updateGameState}
        />
      </View>

      <View style={styles.gameControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleResetGame}
        >
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleBackToMenu}
        >
          <Text style={styles.controlButtonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
    padding: 20,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  playerInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#32CD32',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gameHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roomInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  gameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.4,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MultiplayerGame;