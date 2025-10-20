// Sound utility for generating bee-themed game sounds using Web Audio API

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.3;
  private isMuted: boolean = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    } catch (error) {
      // console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) return false;
    
    // Resume audio context if it's suspended (required by browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return true;
  }

  // Generate a buzzing bee sound for piece placement
  playBuzzSound() {
    if (!this.ensureAudioContext() || this.isMuted) return;

    const now = this.audioContext!.currentTime;
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    // Create buzzing effect with frequency modulation
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(250, now + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.2);

    // Envelope for natural buzz sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain!);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }


  // Generate a sweet victory sound (ascending melody)
  playVictorySound() {
    if (!this.ensureAudioContext() || this.isMuted) return;

    const now = this.audioContext!.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.2);

      gainNode.gain.setValueAtTime(0, now + index * 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.3, now + index * 0.2 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.2 + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);

      oscillator.start(now + index * 0.2);
      oscillator.stop(now + index * 0.2 + 0.4);
    });
  }

  // Generate a defeat sound (descending melody)
  playDefeatSound() {
    if (!this.ensureAudioContext() || this.isMuted) return;

    const now = this.audioContext!.currentTime;
    const notes = [392.00, 329.63, 261.63, 196.00]; // G4, E4, C4, G3

    notes.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.3);

      gainNode.gain.setValueAtTime(0, now + index * 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + index * 0.3 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.3 + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);

      oscillator.start(now + index * 0.3);
      oscillator.stop(now + index * 0.3 + 0.5);
    });
  }

  // Generate a hover sound (subtle buzz)
  playHoverSound() {
    if (!this.ensureAudioContext() || this.isMuted) return;

    const now = this.audioContext!.currentTime;
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain!);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Generate a button click sound
  playClickSound() {
    if (!this.ensureAudioContext() || this.isMuted) return;

    const now = this.audioContext!.currentTime;
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain!);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // Play the "Get Ready" audio file during countdown
  playGetReadySound() {
    if (this.isMuted) return;

    try {
      const audio = new Audio('/Get Ready.m4a');
      audio.volume = this.volume;
      audio.play().catch(error => {
        console.warn('Could not play Get Ready sound:', error);
      });
    } catch (error) {
      console.warn('Error loading Get Ready sound:', error);
    }
  }

  // Volume and mute controls
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume, 
        this.audioContext.currentTime
      );
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume, 
        this.audioContext.currentTime
      );
    }
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }
}

// Create a singleton instance
export const soundManager = new SoundGenerator();
