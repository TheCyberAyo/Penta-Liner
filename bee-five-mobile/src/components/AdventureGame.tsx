import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import { soundManager } from '../utils/sounds';
import { getAdventureStartingPlayer, getTimeLimitForLevel } from '../utils/gameLogic';
import { getBeeFactForGame, shouldShowStory, getStoryForGame } from '../data/beeFacts';

interface AdventureGameProps {
  gameNumber: number;
  matchNumber: number;
  onBackToMenu: () => void;
  onNextGame: () => void;
  gameState: any;
  handleCellClick: (row: number, col: number) => void;
  resetGame: (startingPlayer?: 1 | 2) => void;
  updateGameState: (newState: any) => void;
  timeLimit: number;
}

const AdventureGame: React.FC<AdventureGameProps> = ({
  gameNumber,
  matchNumber,
  onBackToMenu,
  onNextGame,
  gameState,
  handleCellClick,
  resetGame,
  updateGameState,
  timeLimit,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [showStartCountdown, setShowStartCountdown] = useState(false);
  const [startCountdown, setStartCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [showBeeFact, setShowBeeFact] = useState(false);
  const [currentBeeFact, setCurrentBeeFact] = useState<string | null>(null);
  const [showStageStory, setShowStageStory] = useState(false);
  const [currentStageStory, setCurrentStageStory] = useState<{ title: string; slides: string[] } | null>(null);
  const [storySlideIndex, setStorySlideIndex] = useState(0);

  useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Handle start countdown with synchronized voice-over
  useEffect(() => {
    if (showStartCountdown && startCountdown > 0) {
      const timer = setTimeout(() => {
        setStartCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showStartCountdown && startCountdown === 0) {
      setShowStartCountdown(false);
      setGameStarted(true);
    }
  }, [showStartCountdown, startCountdown]);

  // Play "Get Ready" sound when countdown starts (synchronized)
  useEffect(() => {
    if (showStartCountdown && startCountdown === 3 && soundEnabled) {
      soundManager.playGetReadySound();
    }
  }, [showStartCountdown, startCountdown, soundEnabled]);

  // Play countdown sounds synchronized with countdown numbers
  useEffect(() => {
    if (showStartCountdown && startCountdown >= 1 && startCountdown <= 3 && soundEnabled) {
      soundManager.playCountdownSound(startCountdown);
    }
  }, [showStartCountdown, startCountdown, soundEnabled]);

  const handleNextStorySlide = useCallback(() => {
    if (currentStageStory && storySlideIndex < currentStageStory.slides.length - 1) {
      setStorySlideIndex(prev => prev + 1);
    } else {
      setShowStageStory(false);
      const fact = getBeeFactForGame(gameNumber);
      if (fact) {
        setCurrentBeeFact(fact);
        setShowBeeFact(true);
      }
    }
  }, [currentStageStory, storySlideIndex, gameNumber]);

  const handleCloseBeeFact = useCallback(() => {
    setShowBeeFact(false);
    // Start countdown after closing bee fact
    setStartCountdown(3);
    setShowStartCountdown(true);
  }, []);

  const handleStartGame = useCallback(() => {
    setStartCountdown(3);
    setShowStartCountdown(true);
    setGameStarted(false);
  }, []);

  const renderGameContent = () => {
    if (showStartCountdown) {
      return (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{startCountdown}</Text>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
        </View>
      );
    }

    if (!gameStarted) {
      return (
        <View style={styles.startContainer}>
          <Text style={styles.gameTitle}>Bee-Five Adventure</Text>
          <Text style={styles.levelText}>Level {gameNumber} - Match {matchNumber}</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>Level {gameNumber} - Match {matchNumber}</Text>
          <Text style={styles.timerText}>Time: {gameState.timeLeft}s</Text>
        </View>
        
        <GameCanvas
          board={gameState.board}
          onCellClick={handleCellClick}
          winningPieces={gameState.winningPieces}
          isBlindPlay={gameState.isBlindPlay}
          mudZones={gameState.mudZones}
        />
        
        <View style={styles.gameInfo}>
          <Text style={styles.playerText}>
            Current Player: {gameState.currentPlayer === 1 ? 'Black' : 'Yellow'}
          </Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => resetGame()}>
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={onBackToMenu}>
            <Text style={styles.controlButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderGameContent()}

      {/* Bee Fact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBeeFact}
        onRequestClose={handleCloseBeeFact}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Did you know?</Text>
            <Text style={styles.modalText}>{currentBeeFact}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseBeeFact}>
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stage Story Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStageStory}
        onRequestClose={() => setShowStageStory(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{currentStageStory?.title}</Text>
            <Text style={styles.modalText}>{currentStageStory?.slides[storySlideIndex]}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleNextStorySlide}>
              <Text style={styles.modalButtonText}>
                {storySlideIndex < (currentStageStory?.slides.length || 0) - 1 ? 'Next' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  countdownLabel: {
    fontSize: 24,
    color: '#666',
    marginTop: 20,
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  levelText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  gameInfo: {
    alignItems: 'center',
    marginVertical: 15,
  },
  playerText: {
    fontSize: 18,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
  },
  modalButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdventureGame;
