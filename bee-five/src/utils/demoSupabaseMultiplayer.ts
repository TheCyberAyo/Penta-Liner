// Demo Supabase multiplayer client for testing
// This simulates Supabase behavior locally for immediate testing

export interface DemoGameMove {
  roomId: string;
  playerNumber: 1 | 2;
  player: 1 | 2;
  row: number;
  col: number;
  playerName: string;
  timestamp: number;
}

export interface DemoGameState {
  roomId: string;
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  playerNames: {
    player1: string;
    player2: string;
  };
  timestamp: number;
}

export interface DemoRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class DemoSupabaseMultiplayerClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private moveCallback?: (move: DemoGameMove) => void;
  private gameStateCallback?: (gameState: DemoGameState) => void;
  private roomCallback?: (room: DemoRoom) => void;
  private pollingInterval: number | null = null;

  // Simulate Supabase database with localStorage
  private getStorageKey(key: string): string {
    return `demo_supabase_${this.roomId}_${key}`;
  }

  private storeData(key: string, data: any): void {
    const storageKey = this.getStorageKey(key);
    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
      roomId: this.roomId
    };
    localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
    // console.log('📤 Demo Supabase: Data stored:', storageKey, dataWithTimestamp);
  }

  private getData(key: string): any {
    const storageKey = this.getStorageKey(key);
    const data = localStorage.getItem(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      // console.log('📥 Demo Supabase: Data retrieved:', storageKey, parsed);
      return parsed;
    }
    return null;
  }

  createRoom(playerName: string): string {
    this.playerName = playerName;
    this.isHost = true;
    this.playerNumber = 1;
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: DemoRoom = {
      roomId: this.roomId,
      hostName: playerName,
      isGameStarted: false,
      timestamp: Date.now()
    };

    this.storeData('room', room);
    // console.log('🏠 Demo Supabase: Room created:', room);
    
    this.startPolling();
    return this.roomId;
  }

  async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    // Check if room exists
    const existingRoom = this.getData('room');
    if (!existingRoom) {
      // console.log('❌ Demo Supabase: Room not found:', roomId);
      return false;
    }

    // Update room with guest info
    const updatedRoom: DemoRoom = {
      ...existingRoom,
      guestName: playerName,
      isGameStarted: true,
      timestamp: Date.now()
    };

    this.storeData('room', updatedRoom);
    // console.log('🚀 Demo Supabase: Room joined:', updatedRoom);
    
    this.startPolling();
    return true;
  }

  async sendMove(row: number, col: number): Promise<void> {
    const move: DemoGameMove = {
      roomId: this.roomId,
      playerNumber: this.playerNumber,
      player: this.playerNumber,
      row,
      col,
      playerName: this.playerName,
      timestamp: Date.now()
    };

    this.storeData('move', move);
    // console.log('📤 Demo Supabase: Move sent:', move);
  }

  async sendGameState(board: (0 | 1 | 2)[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): Promise<void> {
    const gameState: DemoGameState = {
      roomId: this.roomId,
      board,
      currentPlayer,
      winner,
      gameActive,
      playerNames: {
        player1: this.isHost ? this.playerName : 'Host',
        player2: this.isHost ? 'Guest' : this.playerName
      },
      timestamp: Date.now()
    };

    this.storeData('gamestate', gameState);
    // console.log('📤 Demo Supabase: Game state sent:', gameState);
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = window.setInterval(() => {
      this.pollForUpdates();
    }, 500); // Poll every 500ms for demo
  }

  private pollForUpdates(): void {
    if (!this.roomId) return;

    try {
      // Check for room updates
      const room = this.getData('room');
      if (room && this.roomCallback) {
        this.roomCallback(room);
      }

      // Check for moves
      const move = this.getData('move');
      if (move && move.playerNumber !== this.playerNumber) {
        if (this.moveCallback) {
          this.moveCallback(move);
        }
      }

      // Check for game state updates
      const gameState = this.getData('gamestate');
      if (gameState && this.gameStateCallback) {
        this.gameStateCallback(gameState);
      }
    } catch (error) {
      // console.warn('Demo Supabase polling error:', error);
    }
  }

  onMove(callback: (move: DemoGameMove) => void): void {
    this.moveCallback = callback;
  }

  onGameState(callback: (gameState: DemoGameState) => void): void {
    this.gameStateCallback = callback;
  }

  onRoomUpdate(callback: (room: DemoRoom) => void): void {
    this.roomCallback = callback;
  }

  async leaveRoom(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.roomId = '';
    this.playerNumber = 1;
    this.playerName = '';
    this.isHost = false;
    
    // console.log('🚪 Demo Supabase: Left room and cleaned up');
  }

  // Get the room URL for sharing
  getRoomUrl(): string {
    return `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
  }

  // Check if we're joining from a URL
  static getRoomFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room');
  }
}

export const demoSupabaseMultiplayerClient = new DemoSupabaseMultiplayerClient();
export { DemoSupabaseMultiplayerClient };
