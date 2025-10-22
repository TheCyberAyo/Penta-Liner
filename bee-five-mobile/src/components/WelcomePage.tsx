import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface WelcomePageProps {
  onGameModeSelect: (gameMode: 'local' | 'online' | 'ai') => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGameModeSelect }) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.contentScreen}>
            <Text style={styles.gameTitle}>
              Welcome {'\n'}to {'\n'}Bee-<Text style={styles.highlight}>Five</Text>
            </Text>
            <Text style={styles.subtitle}>Select the game mode to get started!</Text>
            <View style={styles.modeSelection}>
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
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>&copy; 2025 Bee-Five. All rights reserved.</Text>
      </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    width: '90%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentScreen: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameTitle: {
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
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  modeSelection: {
    width: '100%',
    gap: 15,
  },
  modeButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default WelcomePage;
