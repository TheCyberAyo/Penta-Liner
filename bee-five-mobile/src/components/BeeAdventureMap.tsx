import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { soundManager } from '../utils/sounds';
import { useTheme, ADVENTURE_THEMES } from '../hooks/useTheme';
import BeeLifeStageEffects from './BeeLifeStageEffects';

interface BeeAdventureMapProps {
  currentGame: number;
  gamesCompleted: number[];
  onGameSelect: (gameNumber: number) => void;
  onBackToMenu: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BeeAdventureMap: React.FC<BeeAdventureMapProps> = ({ 
  currentGame, 
  gamesCompleted, 
  onGameSelect, 
  onBackToMenu 
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const { currentTheme } = useTheme({ gameNumber: currentGame });

  // Get geographical location for each game (organic flowing S-curve)
  const getGamePosition = (gameNumber: number) => {
    const gameIndex = gameNumber - 1;
    
    // Organic flowing S-curve parameters
    const totalHeight = 280000; // Much larger height to accommodate all 2000 games
    const spacing = 140; // Spacing between games
    
    // Calculate Y position (upward flow from bottom to top)
    const y = totalHeight - (gameIndex * spacing);
    
    // Calculate X position for high-frequency S-curve with inner positioning for 3rd/4th games
    const gamesPerSide = 4; // 4 games per side to allow inner positioning
    const sideIndex = Math.floor(gameIndex / gamesPerSide);
    const positionInSide = gameIndex % gamesPerSide;
    
    let x;
    if (sideIndex % 2 === 0) {
      // Even sides: left side
      if (positionInSide === 0) {
        x = 20; // 1st game: outer left
      } else if (positionInSide === 1) {
        x = 30; // 2nd game: outer left
      } else if (positionInSide === 2) {
        x = 35; // 3rd game: inner left
      } else {
        x = 45; // 4th game: inner left
      }
    } else {
      // Odd sides: right side
      if (positionInSide === 0) {
        x = 60; // 1st game: outer right
      } else if (positionInSide === 1) {
        x = 70; // 2nd game: outer right
      } else if (positionInSide === 2) {
        x = 45; // 3rd game: inner right
      } else {
        x = 55; // 4th game: inner right
      }
    }
    
    return {
      left: Math.max(5, Math.min(95, x)),
      top: Math.max(50, y)
    };
  };

  // Get environmental elements for each game area
  const getGameEnvironment = (gameNumber: number) => {
    const stageIndex = Math.floor((gameNumber - 1) / 200);
    const positionInStage = ((gameNumber - 1) % 200) + 1;
    
    // Different hive environments based on stage and position
    const environments = {
      0: ['🍯', '🍯', '🍯', '🍯', '🥚'], // Egg stage - honey cells
      1: ['🍯', '🍯', '🍯', '🍯', '🐛'], // Larva stage - honey and larva
      2: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Nectar stage - pure honey
      3: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Cocoon stage - honey cells
      4: ['🍯', '🍯', '🍯', '🍯', '🦋'], // Pupa stage - honey and transformation
      5: ['🍯', '🍯', '🍯', '🍯', '🐝'], // Emergence stage - honey and bees
      6: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Nurse stage - nursing honey
      7: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Forager stage - foraged honey
      8: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Guard stage - protected honey
      9: ['👑', '🍯', '🍯', '🍯', '🌟']  // Queen stage - royal honey
    };
    
    const stageEnvironments = environments[stageIndex as keyof typeof environments] || ['🌿'];
    return stageEnvironments[positionInStage % stageEnvironments.length];
  };

  const handleGameClick = (gameNumber: number) => {
    onGameSelect(gameNumber);
    if (soundEnabled) soundManager.playClickSound();
  };

  const handleBackToMenu = () => {
    soundManager.playClickSound();
    onBackToMenu();
  };

  // Render individual game location
  const renderGameLocation = (gameNumber: number) => {
    const position = getGamePosition(gameNumber);
    const stageIndex = Math.floor((gameNumber - 1) / 200);
    const stage = ADVENTURE_THEMES[stageIndex];
    const isCompleted = gamesCompleted.includes(gameNumber);
    const isCurrent = gameNumber === currentGame;
    const environment = getGameEnvironment(gameNumber);
    
    return (
      <View
        key={gameNumber}
        style={[
          styles.gameLocation,
          {
            left: `${position.left}%`,
            top: position.top,
          }
        ]}
      >
        {/* Environmental element */}
        <Text style={styles.environmentElement}>
          {environment}
        </Text>
        
        {/* Game location button */}
        <TouchableOpacity
          style={[
            styles.gameButton,
            { backgroundColor: stage.buttonColor },
            isCompleted && styles.completedGame,
            isCurrent && styles.currentGame,
          ]}
          onPress={() => handleGameClick(gameNumber)}
        >
          <Text style={[
            styles.gameButtonText,
            { color: stage.textColor },
            isCompleted && styles.completedGameText,
            isCurrent && styles.currentGameText,
          ]}>
            {gameNumber}
          </Text>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          {isCurrent && <Text style={styles.currentDot}>●</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  // Generate all game locations (first 50 games for performance)
  const allGameLocations = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <BeeLifeStageEffects theme={currentTheme}>
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToMenu}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            🐝 Bee Adventure Map 🐝
          </Text>
          
          <View style={styles.soundControls}>
            <TouchableOpacity 
              style={[styles.soundButton, { backgroundColor: soundEnabled ? '#4CAF50' : '#666' }]}
              onPress={() => setSoundEnabled(!soundEnabled)}
            >
              <Text style={styles.soundButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Adventure Path */}
        <ScrollView 
          style={styles.mapContainer}
          contentContainerStyle={styles.mapContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.mapTitle, { color: currentTheme.textColor }]}>
            Journey Through the Bee Life Cycle
          </Text>
          
          {/* Render all game locations */}
          {allGameLocations.map(gameNumber => renderGameLocation(gameNumber))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: currentTheme.textColor }]}>
            Tap any number to start that game
          </Text>
        </View>
      </View>
    </BeeLifeStageEffects>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC30B',
    textAlign: 'center',
    flex: 1,
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
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFC30B',
  },
  mapContent: {
    padding: 20,
    minHeight: 280000, // Large height for scrolling
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  gameLocation: {
    position: 'absolute',
    zIndex: 2,
  },
  environmentElement: {
    position: 'absolute',
    left: -30,
    top: -30,
    fontSize: 20,
    opacity: 0.6,
    zIndex: 0,
  },
  gameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gameButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  completedGame: {
    backgroundColor: '#4CAF50',
    transform: [{ scale: 1.1 }],
  },
  completedGameText: {
    color: '#FFF',
  },
  currentGame: {
    backgroundColor: '#FFC30B',
    transform: [{ scale: 1.3 }],
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  currentGameText: {
    color: '#000',
    fontSize: 12,
  },
  checkmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  currentDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  legend: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  legendText: {
    fontSize: 16,
    color: '#FFC30B',
    textAlign: 'center',
  },
});

export default BeeAdventureMap;