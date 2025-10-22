import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGameLogic } from './src/hooks/useGameLogic';
import { GRID_SIZE, CELL_SIZE, BORDER_WIDTH, CANVAS_SIZE } from './src/constants/gameConstants';

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

  // Show popup when game ends
  React.useEffect(() => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'Black' : 'Yellow';
      setWinMessage(`${winnerName} wins! 🐝`);
      setShowWinPopup(true);
    } else if (!gameState.isGameActive && gameState.winner === 0) {
      setWinMessage('Game Over - Draw! 🐝');
      setShowWinPopup(true);
    } else if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 'Yellow' : 'Black';
      setWinMessage(`${winner} wins due to time limit! 🐝`);
      setShowWinPopup(true);
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

  // Calculate responsive sizes
  const isMobile = screenWidth <= 768;
  const cellSize = Math.min(CELL_SIZE, (screenWidth - 40) / GRID_SIZE);

  const renderCell = (row: number, col: number) => {
    const cellValue = gameState.board[row][col];
    const isWinning = gameState.winningPieces.some(p => p.row === row && p.col === col);
    
    let cellStyle = styles.cell;
    let cellText = '';
    
    if (cellValue === 1) {
      cellStyle = [styles.cell, styles.blackPiece];
      cellText = '●';
    } else if (cellValue === 2) {
      cellStyle = [styles.cell, styles.yellowPiece];
      cellText = '●';
    } else if (cellValue === 3) {
      cellStyle = [styles.cell, styles.blockedCell];
      cellText = '🐝';
    }
    
    if (isWinning) {
      cellStyle = [cellStyle, styles.winningPiece];
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[cellStyle, { width: cellSize, height: cellSize }]}
        onPress={() => handleCellClick(row, col)}
        disabled={cellValue !== 0 || !gameState.isGameActive}
      >
        <Text style={styles.cellText}>{cellText}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackToMenu}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Bee-Five</Text>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{gameState.timeLeft}s</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.gameContainer}>
        <View style={styles.board}>
          {Array.from({ length: GRID_SIZE }, (_, row) =>
            Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))
          )}
        </View>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.currentPlayerText}>
          Current Player: {gameState.currentPlayer === 1 ? 'Black' : 'Yellow'}
        </Text>
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => resetGame()}
        >
          <Text style={styles.resetButtonText}>Reset Game</Text>
        </TouchableOpacity>
      </View>

      {/* Win Popup */}
      {showWinPopup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>{winMessage}</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity 
                style={styles.popupButton}
                onPress={() => {
                  setShowWinPopup(false);
                  resetGame();
                }}
              >
                <Text style={styles.popupButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.popupButton}
                onPress={() => {
                  setShowWinPopup(false);
                  onBackToMenu();
                }}
              >
                <Text style={styles.popupButtonText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Welcome Page Component
function WelcomePage({ onGameModeSelect }: { onGameModeSelect: (mode: 'local' | 'online' | 'ai') => void }) {
  return (
    <View style={styles.welcomeContainer}>
      <StatusBar style="light" />
      
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>
          Welcome{'\n'}to{'\n'}Bee-Five
        </Text>
        
        <Text style={styles.welcomeSubtitle}>
          Select the game mode to get started!
        </Text>
        
        <View style={styles.modeButtons}>
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => onGameModeSelect('local')}
          >
            <Text style={styles.modeButtonText}>Take Turns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => onGameModeSelect('online')}
          >
            <Text style={styles.modeButtonText}>Online Play</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => onGameModeSelect('ai')}
          >
            <Text style={styles.modeButtonText}>Play AI</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Bee-Five. All rights reserved.</Text>
      </View>
    </View>
  );
}

// Main App Component
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'game'>('welcome');
  const [gameMode, setGameMode] = useState<'local' | 'online' | 'ai'>('local');

  const handleGameModeSelect = (mode: 'local' | 'online' | 'ai') => {
    setGameMode(mode);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('welcome');
  };

  return (
    <View style={styles.appContainer}>
      {currentScreen === 'welcome' ? (
        <WelcomePage onGameModeSelect={handleGameModeSelect} />
      ) : (
        <SimpleGame onBackToMenu={handleBackToMenu} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFC30B',
  },
  
  // Welcome Page Styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFC30B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },
  modeButtons: {
    width: '100%',
    maxWidth: 300,
  },
  modeButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  modeButtonText: {
    color: '#FFC30B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
  },
  footerText: {
    color: '#000',
    fontSize: 12,
    textAlign: 'center',
  },

  // Game Styles
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#FFC30B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    color: '#FFC30B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: '#FFC30B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#000',
    padding: 2,
    borderRadius: 10,
  },
  cell: {
    backgroundColor: '#FFC30B',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  blackPiece: {
    backgroundColor: '#000',
  },
  yellowPiece: {
    backgroundColor: '#FFD700',
  },
  blockedCell: {
    backgroundColor: '#8B4513',
  },
  winningPiece: {
    backgroundColor: '#FF0000',
  },
  gameInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    alignItems: 'center',
  },
  currentPlayerText: {
    color: '#FFC30B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#FFC30B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#FFC30B',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    margin: 20,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  popupButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  popupButtonText: {
    color: '#FFC30B',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
