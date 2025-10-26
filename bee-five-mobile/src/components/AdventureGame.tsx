import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import BeeAdventureMap from './BeeAdventureMap';
import BeeLifeStageEffects from './BeeLifeStageEffects';
import { soundManager } from '../utils/sounds';
import { getAdventureStartingPlayer, getTimeLimitForLevel } from '../utils/gameLogic';
import { getBeeFactForGame, shouldShowStory, getStoryForGame } from '../data/beeFacts';
import { useTheme } from '../hooks/useTheme';

interface AdventureGameProps {
  onBackToMenu: () => void;
}

const AdventureGame: React.FC<AdventureGameProps> = ({
  onBackToMenu,
}) => {
  const [currentGame, setCurrentGame] = useState(1);
  const [gamesCompleted, setGamesCompleted] = useState<number[]>([]);
  const [showMap, setShowMap] = useState(true);
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

  // Get theme for current game
  const { currentTheme } = useTheme({ gameNumber: currentGame });

  // Game logic hook for adventure mode
  const { gameState, handleCellClick, resetGame, updateGameState } = useGameLogic({
    timeLimit: getTimeLimitForLevel(currentGame),
    startingPlayer: 1,
    gameNumber: currentGame,
    currentMatch: 1,
  });

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

  // Play "Get Ready" sound only when countdown starts
  useEffect(() => {
    if (showStartCountdown && startCountdown === 3 && soundEnabled) {
      soundManager.playGetReadySound();
    }
  }, [showStartCountdown, startCountdown, soundEnabled]);

  const handleGameSelect = (gameNumber: number) => {
    setCurrentGame(gameNumber);
    setShowMap(false);
    
    // Show story if available
    if (shouldShowStory(gameNumber)) {
      const story = getStoryForGame(gameNumber);
      if (story) {
        setCurrentStageStory(story);
        setStorySlideIndex(0);
        setShowStageStory(true);
        return;
      }
    }
    
    // Show bee fact
    const fact = getBeeFactForGame(gameNumber);
    if (fact) {
      setCurrentBeeFact(fact);
      setShowBeeFact(true);
    } else {
      // Start countdown directly if no fact
      setStartCountdown(3);
      setShowStartCountdown(true);
    }
  };

  const handleBackToMap = () => {
    setShowMap(true);
    setGameStarted(false);
    setShowStartCountdown(false);
  };

  const handleNextStorySlide = useCallback(() => {
    if (currentStageStory && storySlideIndex < currentStageStory.slides.length - 1) {
      setStorySlideIndex(prev => prev + 1);
    } else {
      setShowStageStory(false);
      const fact = getBeeFactForGame(currentGame);
      if (fact) {
        setCurrentBeeFact(fact);
        setShowBeeFact(true);
      } else {
        setStartCountdown(3);
        setShowStartCountdown(true);
      }
    }
  }, [currentStageStory, storySlideIndex, currentGame]);

  const handleCloseBeeFact = useCallback(() => {
    setShowBeeFact(false);
    setStartCountdown(3);
    setShowStartCountdown(true);
  }, []);

  const handleGameComplete = (gameNumber: number) => {
    if (!gamesCompleted.includes(gameNumber)) {
      setGamesCompleted(prev => [...prev, gameNumber]);
    }
    // Return to map after game completion
    setTimeout(() => {
      handleBackToMap();
    }, 2000);
  };

  // Handle game completion when winner is determined
  useEffect(() => {
    if (gameState.winner > 0) {
      handleGameComplete(currentGame);
    }
  }, [gameState.winner, currentGame]);

  // Show map if showMap is true
  if (showMap) {
    return (
      <BeeAdventureMap
        currentGame={currentGame}
        gamesCompleted={gamesCompleted}
        onGameSelect={handleGameSelect}
        onBackToMenu={onBackToMenu}
      />
    );
  }

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
          <Text style={styles.levelText}>Game {currentGame}</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => {
            soundManager.playClickSound();
            setStartCountdown(3);
            setShowStartCountdown(true);
            setGameStarted(false);
          }}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>Bee-Five Adventure</Text>
          <Text style={styles.levelText}>Game {currentGame}</Text>
          <Text style={styles.timer}>Time Left: {gameState.timeLeft}s</Text>
        </View>

        <View style={styles.gameBoard}>
          <GameCanvas
            gameState={gameState}
            onCellClick={handleCellClick}
            onGameStateChange={updateGameState}
          />
        </View>

        <View style={styles.gameControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => {
            soundManager.playClickSound();
            resetGame();
          }}>
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => {
            soundManager.playClickSound();
            handleBackToMap();
          }}>
            <Text style={styles.controlButtonText}>Back to Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => {
            soundManager.playClickSound();
            onBackToMenu();
          }}>
            <Text style={styles.controlButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BeeLifeStageEffects theme={currentTheme}>
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        {renderGameContent()}

        {/* Bee Fact Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showBeeFact}
          onRequestClose={handleCloseBeeFact}
        >
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: currentTheme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>Did you know?</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>{currentBeeFact}</Text>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: currentTheme.buttonColor }]} onPress={() => {
                soundManager.playClickSound();
                handleCloseBeeFact();
              }}>
                <Text style={[styles.modalButtonText, { color: currentTheme.textColor }]}>Got it!</Text>
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
            <View style={[styles.modalView, { backgroundColor: currentTheme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>{currentStageStory?.title}</Text>
              <Text style={[styles.modalText, { color: currentTheme.textColor }]}>{currentStageStory?.slides[storySlideIndex]}</Text>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: currentTheme.buttonColor }]} onPress={() => {
                soundManager.playClickSound();
                handleNextStorySlide();
              }}>
                <Text style={[styles.modalButtonText, { color: currentTheme.textColor }]}>
                  {storySlideIndex < (currentStageStory?.slides.length || 0) - 1 ? 'Next' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </BeeLifeStageEffects>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  gameHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  gameBoard: {
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
    flex: 0.3,
  },
  controlButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdventureGame;