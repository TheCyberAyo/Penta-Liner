import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import { soundManager } from '../utils/sounds';
import { getAIMove, AI_DIFFICULTIES } from '../utils/aiLogic';

interface AIGameProps {
  onBackToMenu: () => void;
  initialDifficulty: string;
}

const AIGame: React.FC<AIGameProps> = ({
  onBackToMenu,
  initialDifficulty,
}) => {
  console.log('AIGame component rendered with difficulty:', initialDifficulty);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');

  // Game logic hook for AI mode
  const { gameState, handleCellClick, resetGame, updateGameState } = useGameLogic({
    timeLimit: 30,
    startingPlayer: 1,
    gameNumber: 1,
    currentMatch: 1,
  });

  console.log('AIGame gameState:', {
    boardExists: !!gameState.board,
    boardSize: gameState.board?.length,
    isGameActive: gameState.isGameActive,
    currentPlayer: gameState.currentPlayer,
    winner: gameState.winner
  });

  useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Show popup when game ends
  useEffect(() => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'You' : 'AI';
      setWinMessage(`${winnerName} wins! 🐝`);
      setShowWinPopup(true);
      
      if (gameState.winner === 1) {
        soundManager.playVictorySound();
      } else {
        soundManager.playDefeatSound();
      }
    } else if (!gameState.isGameActive && gameState.winner === 0) {
      setWinMessage('Game Over - Draw! 🐝');
      setShowWinPopup(true);
    } else if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 'AI' : 'You';
      setWinMessage(`${winner} wins due to time limit! 🐝`);
      setShowWinPopup(true);
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

  // AI move logic using the new AI system
  const makeAIMove = useCallback(() => {
    if (!gameState.isGameActive || gameState.winner > 0) return;
    
    console.log(`AI (${initialDifficulty}) making move...`);
    
    try {
      const aiMove = getAIMove(gameState.board, initialDifficulty);
      console.log(`AI selected: (${aiMove.row}, ${aiMove.col}) - ${aiMove.reason}`);
      
      // Make the AI move
      handleCellClick(aiMove.row, aiMove.col);
    } catch (error) {
      console.error('AI move error:', error);
      // Fallback to random move
      const availableCells = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (gameState.board[row][col] === 0) {
            availableCells.push({ row, col });
          }
        }
      }
      
      if (availableCells.length > 0) {
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        handleCellClick(randomCell.row, randomCell.col);
      }
    }
  }, [gameState, handleCellClick, initialDifficulty]);

  const handleCellClickWithAI = useCallback((row: number, col: number) => {
    // Only allow human moves when it's player 1's turn
    if (gameState.currentPlayer === 1 && gameState.isGameActive && gameState.winner === 0) {
      handleCellClick(row, col);
    }
  }, [gameState, handleCellClick]);

  // AI move effect
  useEffect(() => {
    if (gameState.currentPlayer === 2 && gameState.isGameActive && gameState.winner === 0) {
      // AI's turn - make a move after a short delay
      const timer = setTimeout(() => {
        makeAIMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.isGameActive, gameState.winner, makeAIMove]);

  return (
    <View style={styles.gameContainer}>
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
        
        <Text style={styles.gameTitle}>Bee-Five AI</Text>
        
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
            Current Player: {gameState.currentPlayer === 1 ? 'You (Black)' : 'AI (Yellow)'}
          </Text>
          <Text style={styles.difficultyText}>
            Difficulty: {AI_DIFFICULTIES[initialDifficulty]?.name || initialDifficulty}
          </Text>
          <Text style={styles.difficultyDescription}>
            {AI_DIFFICULTIES[initialDifficulty]?.description || 'AI Strategy'}
          </Text>
        </View>

        <View style={styles.gameBoard}>
          <GameCanvas
            gameState={gameState}
            onCellClick={handleCellClickWithAI}
            onGameStateChange={updateGameState}
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

      {/* Winning Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWinPopup}
        onRequestClose={() => setShowWinPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.winModal}>
            <Text style={styles.winEmoji}>🐝</Text>
            <Text style={styles.winMessage}>{winMessage}</Text>
            <Text style={styles.winSubtitle}>
              {winMessage.includes('You wins') ? 'Sweet victory! 🍯' : 
               winMessage.includes('AI wins') ? 'Better luck next time! 🍯' : 
               'Great game! 🍯'}
            </Text>
            
            <View style={styles.winButtons}>
              <TouchableOpacity 
                style={[styles.winButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => {
                  resetGame();
                  setShowWinPopup(false);
                }}
              >
                <Text style={styles.winButtonText}>Play Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.winButton, { backgroundColor: '#2196F3' }]}
                onPress={() => {
                  setShowWinPopup(false);
                  onBackToMenu();
                }}
              >
                <Text style={styles.winButtonText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
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
    marginBottom: 5,
  },
  difficultyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  difficultyDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winModal: {
    backgroundColor: '#FFC30B',
    padding: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#000',
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
  },
  winEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  winMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  winSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  winButtons: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  winButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    minWidth: 120,
  },
  winButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AIGame;
