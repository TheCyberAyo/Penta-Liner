import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MultiplayerGameProps {
  roomInfo: any;
  isHost: boolean;
  onBackToMenu: () => void;
  gameState: any;
  handleCellClick: (row: number, col: number) => void;
  updateGameState: (newState: any) => void;
  resetGame: () => void;
  timeLimit: number;
}

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  onBackToMenu,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multiplayer Game</Text>
      <Text style={styles.subtitle}>Coming Soon!</Text>
      <TouchableOpacity style={styles.button} onPress={onBackToMenu}>
        <Text style={styles.buttonText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC30B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MultiplayerGame;
