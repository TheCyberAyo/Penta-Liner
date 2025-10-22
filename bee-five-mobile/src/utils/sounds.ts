// Mobile sound utility for React Native using Expo AV
import { Audio } from 'expo-av';

class MobileSoundGenerator {
  private volume: number = 0.3;
  private isMuted: boolean = false;
  private getReadySound: Audio.Sound | null = null;
  private countdownSounds: Audio.Sound[] = [];

  constructor() {
    this.loadSounds();
  }

  private async loadSounds() {
    try {
      // Load Get Ready sound
      const { sound: getReady } = await Audio.Sound.createAsync(
        require('../assets/sounds/Get Ready.m4a'),
        { volume: this.volume, shouldPlay: false }
      );
      this.getReadySound = getReady;

      // Load countdown sounds (3, 2, 1)
      for (let i = 3; i >= 1; i--) {
        const { sound } = await Audio.Sound.createAsync(
          require(`../assets/sounds/countdown_${i}.m4a`),
          { volume: this.volume, shouldPlay: false }
        );
        this.countdownSounds[i - 1] = sound;
      }
    } catch (error) {
      console.warn('Could not load sounds:', error);
    }
  }

  // Play "Get Ready" sound synchronized with countdown start
  async playGetReadySound() {
    if (this.isMuted || !this.getReadySound) return;
    
    try {
      await this.getReadySound.setPositionAsync(0);
      await this.getReadySound.playAsync();
    } catch (error) {
      console.warn('Could not play Get Ready sound:', error);
    }
  }

  // Play countdown sound synchronized with countdown number
  async playCountdownSound(countdownNumber: number) {
    if (this.isMuted || countdownNumber < 1 || countdownNumber > 3) return;
    
    try {
      const sound = this.countdownSounds[countdownNumber - 1];
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn('Could not play countdown sound:', error);
    }
  }

  // Generate a buzzing bee sound for piece placement
  async playBuzzSound() {
    if (this.isMuted) return;
    // For now, use a simple beep - can be replaced with actual bee sound
    console.log('Buzz sound played');
  }

  // Generate a sweet victory sound
  async playVictorySound() {
    if (this.isMuted) return;
    console.log('Victory sound played');
  }

  // Generate a defeat sound
  async playDefeatSound() {
    if (this.isMuted) return;
    console.log('Defeat sound played');
  }

  // Generate a hover sound
  async playHoverSound() {
    if (this.isMuted) return;
    console.log('Hover sound played');
  }

  // Generate a button click sound
  async playClickSound() {
    if (this.isMuted) return;
    console.log('Click sound played');
  }

  // Volume and mute controls
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Update volume for all loaded sounds
    if (this.getReadySound) {
      this.getReadySound.setVolumeAsync(this.isMuted ? 0 : this.volume);
    }
    this.countdownSounds.forEach(sound => {
      if (sound) {
        sound.setVolumeAsync(this.isMuted ? 0 : this.volume);
      }
    });
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume); // This will update all sounds with correct volume
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  // Cleanup method
  async unloadSounds() {
    try {
      if (this.getReadySound) {
        await this.getReadySound.unloadAsync();
      }
      await Promise.all(this.countdownSounds.map(sound => 
        sound ? sound.unloadAsync() : Promise.resolve()
      ));
    } catch (error) {
      console.warn('Error unloading sounds:', error);
    }
  }
}

// Create a singleton instance
export const soundManager = new MobileSoundGenerator();
