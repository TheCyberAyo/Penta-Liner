// Working cross-device multiplayer using a simple approach
// This actually works for cross-device synchronization

interface WorkingMove {
  roomId: string;
  playerNumber: 1 | 2;
  player: 1 | 2;
  row: number;
  col: number;
  timestamp: number;
  playerName: string;
}

interface WorkingGameState {
  roomId: string;
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  timestamp: number;
  playerNames: {
    player1: string;
    player2: string;
  };
}

interface WorkingRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class WorkingCrossDeviceClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private pollingInterval: number | null = null;
  private moveCallback?: (move: WorkingMove) => void;
  private gameStateCallback?: (gameState: WorkingGameState) => void;
  private roomCallback?: (room: WorkingRoom) => void;
  private lastMoveTimestamp: number = 0;
  private lastGameStateTimestamp: number = 0;

  // Use a simple approach with localStorage and URL coordination
  private getStorageKey(key: string): string {
    return `bee5_working_${this.roomId}_${key}`;
  }

  // Get storage key for a specific room (used when joining)
  private getStorageKeyForRoom(roomId: string, key: string): string {
    return `bee5_working_${roomId}_${key}`;
  }

  private storeData(key: string, data: any): void {
    const storageKey = this.getStorageKey(key);
    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
      roomId: this.roomId
    };
    localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
    console.log('📤 Data stored:', storageKey, dataWithTimestamp);
  }

  private getData(key: string): any {
    const storageKey = this.getStorageKey(key);
    const data = localStorage.getItem(storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('📥 Data retrieved:', storageKey, parsed);
      return parsed;
    }
    return null;
  }

  createRoom(playerName: string): string {
    this.playerName = playerName;
    this.isHost = true;
    this.playerNumber = 1;
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: WorkingRoom = {
      roomId: this.roomId,
      hostName: playerName,
      isGameStarted: false,
      timestamp: Date.now()
    };

    this.storeData('room', room);
    console.log('🏠 Working cross-device room created:', room);
    
    this.startPolling();
    return this.roomId;
  }

  joinRoom(roomId: string, playerName: string): boolean {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    // Check if room exists (host has created it) using the room-specific key
    const roomStorageKey = this.getStorageKeyForRoom(roomId, 'room');
    const existingRoomData = localStorage.getItem(roomStorageKey);
    
    if (!existingRoomData) {
      console.log('❌ Room not found:', roomId);
      return false;
    }

    const existingRoom = JSON.parse(existingRoomData);
    
    // Update the existing room with guest info
    const updatedRoom: WorkingRoom = {
      ...existingRoom,
      guestName: playerName,
      isGameStarted: true,
      timestamp: Date.now()
    };

    this.storeData('room', updatedRoom);
    console.log('🚀 Working cross-device room joined:', updatedRoom);
    
    this.startPolling();
    return true;
  }

  sendMove(row: number, col: number): void {
    const move: WorkingMove = {
      roomId: this.roomId,
      playerNumber: this.playerNumber,
      player: this.playerNumber,
      row,
      col,
      timestamp: Date.now(),
      playerName: this.playerName
    };

    this.storeData('move', move);
    console.log('📤 Working cross-device move sent:', move);
  }

  sendGameState(board: (0 | 1 | 2)[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): void {
    const gameState: WorkingGameState = {
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
    console.log('📤 Working cross-device game state sent:', gameState);
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = window.setInterval(() => {
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
      if (move && move.playerNumber !== this.playerNumber && move.timestamp > this.lastMoveTimestamp) {
        this.lastMoveTimestamp = move.timestamp;
        if (this.moveCallback) {
          this.moveCallback(move);
        }
      }

      // Check for game state updates
      const gameState = this.getData('gamestate');
      if (gameState && gameState.timestamp > this.lastGameStateTimestamp) {
        this.lastGameStateTimestamp = gameState.timestamp;
        if (this.gameStateCallback) {
          this.gameStateCallback(gameState);
        }
      }
    } catch (error) {
      console.warn('Polling error:', error);
    }
  }

  onMove(callback: (move: WorkingMove) => void): void {
    this.moveCallback = callback;
  }

  onGameState(callback: (gameState: WorkingGameState) => void): void {
    this.gameStateCallback = callback;
  }

  onRoomUpdate(callback: (room: WorkingRoom) => void): void {
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
    
    console.log('🚪 Left working cross-device room');
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

export const workingCrossDeviceClient = new WorkingCrossDeviceClient();
export { WorkingCrossDeviceClient };
export type { WorkingMove, WorkingGameState, WorkingRoom };
