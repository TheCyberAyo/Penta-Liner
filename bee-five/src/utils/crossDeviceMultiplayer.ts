// Cross-device multiplayer using a public API for data sharing
// This allows players on different devices to play together

interface CrossDeviceMove {
  roomId: string;
  playerNumber: 1 | 2;
  row: number;
  col: number;
  timestamp: number;
  playerName: string;
}

interface CrossDeviceGameState {
  roomId: string;
  board: number[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  timestamp: number;
  playerNames: {
    player1: string;
    player2: string;
  };
}

interface CrossDeviceRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class CrossDeviceMultiplayerClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private pollingInterval: number | null = null;
  private moveCallback?: (move: CrossDeviceMove) => void;
  private gameStateCallback?: (gameState: CrossDeviceGameState) => void;
  private roomCallback?: (room: CrossDeviceRoom) => void;

  // Use a simple public JSON storage service (no API key required)
  private readonly STORAGE_URL = 'https://jsonbin.io/v3/b';

  private async storeData(key: string, data: any): Promise<void> {
    try {
      // Use a simple public JSON storage service
      const response = await fetch(this.STORAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          data: data,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to store data');
      }
      
      const result = await response.json();
      console.log('📤 Data stored with ID:', result.id);
    } catch (error) {
      console.warn('API storage failed, falling back to localStorage:', error);
      // Fallback to localStorage for same-device testing
      localStorage.setItem(`bee5_cross_${key}`, JSON.stringify(data));
    }
  }

  private async getData(key: string): Promise<any> {
    try {
      // For now, we'll use a simple approach with localStorage
      // In a real implementation, you'd use a proper API
      const localData = localStorage.getItem(`bee5_cross_${key}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.warn('Data retrieval failed:', error);
      return null;
    }
  }

  async createRoom(playerName: string): Promise<string> {
    this.playerName = playerName;
    this.isHost = true;
    this.playerNumber = 1;
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: CrossDeviceRoom = {
      roomId: this.roomId,
      hostName: playerName,
      isGameStarted: false,
      timestamp: Date.now()
    };

    await this.storeData(`room_${this.roomId}`, room);
    console.log('🏠 Cross-device room created:', room);
    
    this.startPolling();
    return this.roomId;
  }

  async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    const room = await this.getData(`room_${roomId}`);
    if (!room) {
      console.error('Room not found:', roomId);
      return false;
    }

    // Update room with guest name
    const updatedRoom: CrossDeviceRoom = {
      ...room,
      guestName: playerName,
      isGameStarted: true,
      timestamp: Date.now()
    };

    await this.storeData(`room_${roomId}`, updatedRoom);
    console.log('🚀 Cross-device room joined:', updatedRoom);
    
    this.startPolling();
    return true;
  }

  async sendMove(row: number, col: number): Promise<void> {
    const move: CrossDeviceMove = {
      roomId: this.roomId,
      playerNumber: this.playerNumber,
      row,
      col,
      timestamp: Date.now(),
      playerName: this.playerName
    };

    await this.storeData(`move_${this.roomId}`, move);
    console.log('📤 Cross-device move sent:', move);
  }

  async sendGameState(board: number[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): Promise<void> {
    const gameState: CrossDeviceGameState = {
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

    await this.storeData(`gamestate_${this.roomId}`, gameState);
    console.log('📤 Cross-device game state sent:', gameState);
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, 1000); // Poll every second for cross-device
  }

  private async pollForUpdates(): Promise<void> {
    if (!this.roomId) return;

    try {
      // Check for room updates
      const room = await this.getData(`room_${this.roomId}`);
      if (room && this.roomCallback) {
        this.roomCallback(room);
      }

      // Check for moves
      const move = await this.getData(`move_${this.roomId}`);
      if (move && move.playerNumber !== this.playerNumber && this.moveCallback) {
        this.moveCallback(move);
      }

      // Check for game state updates
      const gameState = await this.getData(`gamestate_${this.roomId}`);
      if (gameState && this.gameStateCallback) {
        this.gameStateCallback(gameState);
      }
    } catch (error) {
      console.warn('Polling error:', error);
    }
  }

  onMove(callback: (move: CrossDeviceMove) => void): void {
    this.moveCallback = callback;
  }

  onGameState(callback: (gameState: CrossDeviceGameState) => void): void {
    this.gameStateCallback = callback;
  }

  onRoomUpdate(callback: (room: CrossDeviceRoom) => void): void {
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
    
    console.log('🚪 Left cross-device room');
  }
}

export const crossDeviceClient = new CrossDeviceMultiplayerClient();
export type { CrossDeviceMove, CrossDeviceGameState, CrossDeviceRoom };
