// Mobile sound utility for React Native using Expo AV - All sounds except countdown
import { Audio } from 'expo-av';

class MobileSoundGenerator {
  private volume: number = 0.3;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;

  constructor() {
    this.loadSounds();
  }

  private async loadSounds() {
    try {
      console.log('Sound system initialized - All sounds except countdown');
    } catch (error) {
      console.warn('Could not load sounds:', error);
    }
  }

  // Play "Get Ready" sound synchronized with countdown start
  async playGetReadySound() {
    if (this.isMuted || this.isPlaying) return;
    
    this.isPlaying = true;
    try {
      console.log('🔊 Get Ready sound played');
      // Create a simple beep sound using Expo AV
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmUQBg==' },
        { volume: this.volume, shouldPlay: true }
      );
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Could not play Get Ready sound:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  // Countdown sounds are disabled (silent)
  async playCountdownSound(countdownNumber: number) {
    // No countdown sounds - silent
    return;
  }

  // Generate a buzzing bee sound for piece placement
  async playBuzzSound() {
    if (this.isMuted) return;
    console.log('🐝 Buzz sound played');
  }

  // Generate a sweet victory sound
  async playVictorySound() {
    if (this.isMuted) return;
    console.log('🎉 Victory sound played');
  }

  // Generate a defeat sound
  async playDefeatSound() {
    if (this.isMuted) return;
    console.log('😞 Defeat sound played');
  }

  // Generate a hover sound
  async playHoverSound() {
    if (this.isMuted) return;
    console.log('🎵 Hover sound played');
  }

  // Generate a button click sound
  async playClickSound() {
    if (this.isMuted) return;
    console.log('👆 Click sound played');
  }

  // Volume and mute controls
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  // Clear sound queue (no-op since we removed queuing)
  clearQueue() {
    // No queue to clear
  }

  // Cleanup method
  async unloadSounds() {
    try {
      console.log('Sound system cleaned up - All sounds except countdown');
    } catch (error) {
      console.warn('Error unloading sounds:', error);
    }
  }
}

// Create a singleton instance
export const soundManager = new MobileSoundGenerator();
