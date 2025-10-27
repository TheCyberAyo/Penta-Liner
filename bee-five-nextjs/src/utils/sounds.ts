// Sound utility for generating bee-themed game sounds using Web Audio API
// All sounds have been disabled - functions exist but do nothing

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.3;
  private isMuted: boolean = true; // Changed to true by default - sounds disabled

  constructor() {
    // Audio context initialization disabled
  }

  private initAudioContext() {
    // Disabled
  }

  private ensureAudioContext() {
    return false; // Always returns false to prevent sounds
  }

  // Generate a buzzing bee sound for piece placement
  playBuzzSound() {
    // Disabled - no sound
  }

  // Generate a sweet victory sound (ascending melody)
  playVictorySound() {
    // Disabled - no sound
  }

  // Generate a defeat sound (descending melody)
  playDefeatSound() {
    // Disabled - no sound
  }

  // Generate a hover sound (subtle buzz)
  playHoverSound() {
    // Disabled - no sound
  }

  // Generate a button click sound
  playClickSound() {
    // Disabled - no sound
  }

  // Play the "Get Ready" audio file during countdown
  playGetReadySound() {
    // Disabled - no sound
  }

  // Play countdown sound synchronized with countdown number
  playCountdownSound(countdownNumber: number) {
    // Disabled - no sound
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
}

// Create a singleton instance
export const soundManager = new SoundGenerator();
