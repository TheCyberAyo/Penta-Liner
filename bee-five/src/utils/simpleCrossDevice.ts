// Simple cross-device multiplayer using URL sharing
// Players share a room URL and use a simple coordination system

interface SimpleMove {
  roomId: string;
  playerNumber: 1 | 2;
  player: 1 | 2; // Add this to match the expected interface
  row: number;
  col: number;
  timestamp: number;
  playerName: string;
}

interface SimpleGameState {
  roomId: string;
  board: (0 | 1 | 2)[][]; // Fix the board type
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  timestamp: number;
  playerNames: {
    player1: string;
    player2: string;
  };
}

interface SimpleRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class SimpleCrossDeviceClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private pollingInterval: number | null = null;
  private moveCallback?: (move: SimpleMove) => void;
  private gameStateCallback?: (gameState: SimpleGameState) => void;
  private roomCallback?: (room: SimpleRoom) => void;

  // Use a simple approach with URL parameters and localStorage
  private getStorageKey(key: string): string {
    return `bee5_simple_${this.roomId}_${key}`;
  }

  private storeData(key: string, data: any): void {
    const storageKey = this.getStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log('📤 Data stored locally:', storageKey, data);
  }

  private getData(key: string): any {
    const storageKey = this.getStorageKey(key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }

  createRoom(playerName: string): string {
    this.playerName = playerName;
    this.isHost = true;
    this.playerNumber = 1;
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: SimpleRoom = {
      roomId: this.roomId,
      hostName: playerName,
      isGameStarted: false,
      timestamp: Date.now()
    };

    this.storeData('room', room);
    console.log('🏠 Simple cross-device room created:', room);
    
    this.startPolling();
    return this.roomId;
  }

  joinRoom(roomId: string, playerName: string): boolean {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    const room = this.getData('room');
    if (!room) {
      console.error('Room not found:', roomId);
      return false;
    }

    // Update room with guest name
    const updatedRoom: SimpleRoom = {
      ...room,
      guestName: playerName,
      isGameStarted: true,
      timestamp: Date.now()
    };

    this.storeData('room', updatedRoom);
    console.log('🚀 Simple cross-device room joined:', updatedRoom);
    
    this.startPolling();
    return true;
  }

  sendMove(row: number, col: number): void {
    const move: SimpleMove = {
      roomId: this.roomId,
      playerNumber: this.playerNumber,
      player: this.playerNumber, // Add this field
      row,
      col,
      timestamp: Date.now(),
      playerName: this.playerName
    };

    this.storeData('move', move);
    console.log('📤 Simple cross-device move sent:', move);
  }

  sendGameState(board: (0 | 1 | 2)[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): void {
    const gameState: SimpleGameState = {
      roomId: this.roomId,
      board,
      currentPlayer,
      winner,
      gameActive,
      timestamp: Date.now(),
      playerNames: {
        player1: this.isHost ? this.playerName : 'Host',
        player2: this.isHost ? 'Guest' : this.playerName
      }
    };

    this.storeData('gamestate', gameState);
    console.log('📤 Simple cross-device game state sent:', gameState);
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.pollForUpdates();
    }, 1000); // Poll every second
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
      if (move && move.playerNumber !== this.playerNumber && this.moveCallback) {
        this.moveCallback(move);
      }

      // Check for game state updates
      const gameState = this.getData('gamestate');
      if (gameState && this.gameStateCallback) {
        this.gameStateCallback(gameState);
      }
    } catch (error) {
      console.warn('Polling error:', error);
    }
  }

  onMove(callback: (move: SimpleMove) => void): void {
    this.moveCallback = callback;
  }

  onGameState(callback: (gameState: SimpleGameState) => void): void {
    this.gameStateCallback = callback;
  }

  onRoomUpdate(callback: (room: SimpleRoom) => void): void {
    this.roomCallback = callback;
  }

  leaveRoom(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.roomId = '';
    this.playerNumber = 1;
    this.playerName = '';
    this.isHost = false;
    
    console.log('🚪 Left simple cross-device room');
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

export const simpleCrossDeviceClient = new SimpleCrossDeviceClient();
export { SimpleCrossDeviceClient };
export type { SimpleMove, SimpleGameState, SimpleRoom };
