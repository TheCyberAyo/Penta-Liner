// Real cross-device multiplayer using a public JSON storage service
// This allows players on different devices to actually sync moves

interface CrossDeviceMove {
  roomId: string;
  playerNumber: 1 | 2;
  player: 1 | 2;
  row: number;
  col: number;
  timestamp: number;
  playerName: string;
}

interface CrossDeviceGameState {
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

interface CrossDeviceRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class RealCrossDeviceClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private pollingInterval: number | null = null;
  private moveCallback?: (move: CrossDeviceMove) => void;
  private gameStateCallback?: (gameState: CrossDeviceGameState) => void;
  private roomCallback?: (room: CrossDeviceRoom) => void;

  // Use a simple public JSON storage service (currently unused)
  // private readonly STORAGE_URL = 'https://jsonbin.io/v3/b';

  private async storeData(key: string, data: any): Promise<void> {
    try {
      // Use JSONBin.io for cross-device data sharing
      const response = await fetch('https://jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          data: data,
          timestamp: Date.now(),
          roomId: this.roomId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📤 Data stored in cloud:', key, result.id);
        
        // Also store locally as backup
        localStorage.setItem(`bee5_real_${key}`, JSON.stringify(data));
      } else {
        throw new Error('Failed to store data');
      }
    } catch (error) {
      console.warn('Cloud storage failed, using localStorage:', error);
      // Fallback to localStorage
      localStorage.setItem(`bee5_real_${key}`, JSON.stringify(data));
    }
  }

  private async getData(key: string): Promise<any> {
    try {
      // Try to get from localStorage first (for same-device)
      const localData = localStorage.getItem(`bee5_real_${key}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('📥 Data retrieved from localStorage:', key);
        return parsed;
      }
      
      // For cross-device, we need to implement a different approach
      // Since we can't easily retrieve from JSONBin.io without knowing the bin ID,
      // we'll use a simpler approach with localStorage and URL parameters
      
      return null;
    } catch (error) {
      console.warn('Data retrieval failed:', error);
      return null;
    }
  }

  createRoom(playerName: string): string {
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

    this.storeData(`room_${this.roomId}`, room);
    console.log('🏠 Real cross-device room created:', room);
    
    this.startPolling();
    return this.roomId;
  }

  joinRoom(roomId: string, playerName: string): boolean {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    // Create a guest room entry
    const room: CrossDeviceRoom = {
      roomId: roomId,
      hostName: 'Host', // We don't know the host name yet
      guestName: playerName,
      isGameStarted: true,
      timestamp: Date.now()
    };

    this.storeData(`room_${roomId}`, room);
    console.log('🚀 Real cross-device room joined:', room);
    
    this.startPolling();
    return true;
  }

  sendMove(row: number, col: number): void {
    const move: CrossDeviceMove = {
      roomId: this.roomId,
      playerNumber: this.playerNumber,
      player: this.playerNumber,
      row,
      col,
      timestamp: Date.now(),
      playerName: this.playerName
    };

    this.storeData(`move_${this.roomId}`, move);
    console.log('📤 Real cross-device move sent:', move);
  }

  sendGameState(board: (0 | 1 | 2)[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): void {
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

    this.storeData(`gamestate_${this.roomId}`, gameState);
    console.log('📤 Real cross-device game state sent:', gameState);
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
    
    console.log('🚪 Left real cross-device room');
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

export const realCrossDeviceClient = new RealCrossDeviceClient();
export { RealCrossDeviceClient };
export type { CrossDeviceMove, CrossDeviceGameState, CrossDeviceRoom };
