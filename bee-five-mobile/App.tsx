import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { soundManager } from './src/utils/sounds';
import { type RoomInfo } from './src/utils/simpleMultiplayer';
import { MultiplayerLobby } from './src/components/MultiplayerLobby';
import { MultiplayerGame } from './src/components/MultiplayerGame';
import FriendGame from './src/components/FriendGame';
import AdventureGame from './src/components/AdventureGame';
import AIGame from './src/components/AIGame';
import { useGameLogic } from './src/hooks/useGameLogic';
import GameCanvas from './src/components/GameCanvas';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { AI_DIFFICULTIES } from './src/utils/aiLogic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simple Game Component - Multiplayer Only
function SimpleGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [timeLimit] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Debug logging
  console.log('SimpleGame gameState:', {
    boardExists: !!gameState.board,
    boardSize: gameState.board?.length,
    isGameActive: gameState.isGameActive,
    currentPlayer: gameState.currentPlayer,
    winner: gameState.winner
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Show popup when game ends
  React.useEffect(() => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'Black' : 'Yellow';
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
      const winner = gameState.currentPlayer === 1 ? 'Yellow' : 'Black';
      setWinMessage(`${winner} wins due to time limit! 🐝`);
      setShowWinPopup(true);
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

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
        
        <Text style={styles.gameTitle}>Bee-Five</Text>
        
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
              {winMessage.includes('Black wins') ? 'Sweet victory! 🍯' : 
               winMessage.includes('Yellow wins') ? 'Great game! 🍯' : 
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
}

// Simple inline welcome component to avoid import issues
function SimpleWelcome() {
  const [gameMode, setGameMode] = useState<'menu' | 'local-multiplayer' | 'online-lobby' | 'online-game' | 'ai-game' | 'adventure-game' | 'tournament' | 'show-take-turns-submenu' | 'show-play-ai-submenu' | 'show-tournament-submenu'>('menu');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(1);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showClassicModal, setShowClassicModal] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  // Handle local multiplayer mode
  if (gameMode === 'local-multiplayer') {
    return <SimpleGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle AI game mode
  if (gameMode === 'ai-game') {
    return <AIGame onBackToMenu={() => setGameMode('menu')} initialDifficulty={aiDifficulty} />;
  }

  // Handle Adventure game mode
  if (gameMode === 'adventure-game') {
    return <AdventureGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle tournament mode
  if (gameMode === 'tournament') {
    return <FriendGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle online multiplayer lobby
  if (gameMode === 'online-lobby') {
    return (
      <MultiplayerLobby 
        onGameStart={(roomInfo: RoomInfo, playerNum: 1 | 2) => {
          setCurrentRoom(roomInfo);
          setPlayerNumber(playerNum);
          setGameMode('online-game');
        }}
        onBackToMenu={() => setGameMode('menu')}
      />
    );
  }

  // Handle online multiplayer game
  if (gameMode === 'online-game' && currentRoom) {
    return (
      <MultiplayerGame 
        roomInfo={currentRoom}
        playerNumber={playerNumber}
        onBackToMenu={() => setGameMode('online-lobby')}
      />
    );
  }

  // Handle Take Turns submenu
  if (gameMode === 'show-take-turns-submenu') {
    return (
      <View style={styles.submenuContainer}>
        <View style={styles.submenuHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setGameMode('menu')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.submenuTitle}>Take Turns</Text>
        </View>

        <View style={styles.submenuContent}>
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setGameMode('local-multiplayer')}
          >
            <Text style={styles.submenuButtonText}>Local Multiplayer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setGameMode('show-tournament-submenu')}
          >
            <Text style={styles.submenuButtonText}>Tournament Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle Tournament submenu
  if (gameMode === 'show-tournament-submenu') {
    return (
      <View style={styles.submenuContainer}>
        <View style={styles.submenuHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setGameMode('show-take-turns-submenu')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.submenuTitle}>🏆 Tournament Mode</Text>
        </View>

        <View style={styles.submenuContent}>
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setGameMode('tournament')}
          >
            <Text style={styles.submenuButtonText}>🏆 5 Games Tournament</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setGameMode('tournament')}
          >
            <Text style={styles.submenuButtonText}>🏆 7 Games Tournament</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle Play AI submenu
  if (gameMode === 'show-play-ai-submenu') {
    return (
      <View style={styles.submenuContainer}>
        <View style={styles.submenuHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setGameMode('menu')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.submenuTitle}>Play AI</Text>
        </View>

        <View style={styles.submenuContent}>
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setShowClassicModal(true)}
          >
            <Text style={styles.submenuButtonText}>Classic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submenuButton}
            onPress={() => setGameMode('adventure-game')}
          >
            <Text style={styles.submenuButtonText}>Adventure</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main menu
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>
          Welcome{'\n'}to{'\n'}Bee-<Text style={styles.highlight}>Five</Text>
        </Text>
        <Text style={styles.welcomeSubtitle}>Select the game mode to get started!</Text>
        
        <View style={styles.menuButtons}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setGameMode('show-take-turns-submenu')}
          >
            <Text style={styles.menuButtonText}>Take Turns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setGameMode('online-lobby')}
          >
            <Text style={styles.menuButtonText}>Online Play</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setGameMode('show-play-ai-submenu')}
          >
            <Text style={styles.menuButtonText}>Play AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Classic Difficulty Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showClassicModal}
        onRequestClose={() => setShowClassicModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.difficultyModal}>
            <Text style={styles.modalTitle}>Classic Mode</Text>
            <Text style={styles.modalSubtitle}>Choose your AI opponent:</Text>
            
            <View style={styles.difficultyButtons}>
              <TouchableOpacity 
                style={[styles.difficultyButton, { backgroundColor: aiDifficulty === 'easy' ? '#4CAF50' : '#333' }]}
                onPress={() => {
                  console.log('Easy difficulty selected');
                  setAiDifficulty('easy');
                  setGameMode('ai-game');
                  setShowClassicModal(false);
                  soundManager.playClickSound();
                }}
              >
                <Text style={styles.difficultyButtonText}>🟢 Easy</Text>
                <Text style={styles.difficultyButtonSubtext}>Random moves with center preference</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.difficultyButton, { backgroundColor: aiDifficulty === 'medium' ? '#4CAF50' : '#333' }]}
                onPress={() => {
                  console.log('Medium difficulty selected');
                  setAiDifficulty('medium');
                  setGameMode('ai-game');
                  setShowClassicModal(false);
                  soundManager.playClickSound();
                }}
              >
                <Text style={styles.difficultyButtonText}>🟡 Medium</Text>
                <Text style={styles.difficultyButtonSubtext}>Blocks wins, creates threats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.difficultyButton, { backgroundColor: aiDifficulty === 'hard' ? '#4CAF50' : '#333' }]}
                onPress={() => {
                  console.log('Hard difficulty selected');
                  setAiDifficulty('hard');
                  setGameMode('ai-game');
                  setShowClassicModal(false);
                  soundManager.playClickSound();
                }}
              >
                <Text style={styles.difficultyButtonText}>🔴 Hard</Text>
                <Text style={styles.difficultyButtonSubtext}>Advanced strategy with lookahead</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowClassicModal(false)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function App() {
  return (
    <>
      <StatusBar style="auto" />
      <SimpleWelcome />
    </>
  );
}

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
  submenuContainer: {
    flex: 1,
    backgroundColor: '#FFC30B',
  },
  submenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  submenuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC30B',
    marginLeft: 20,
  },
  submenuContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  submenuButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  submenuButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFC30B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    lineHeight: 45,
  },
  highlight: {
    color: '#FF6B35',
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  menuButtons: {
    width: '100%',
    gap: 15,
  },
  menuButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  difficultyModal: {
    backgroundColor: '#FFC30B',
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#000',
    alignItems: 'center',
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  difficultyButtons: {
    width: '100%',
    marginBottom: 20,
  },
  difficultyButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 70,
  },
  difficultyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  difficultyButtonSubtext: {
    color: '#DDD',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default App;