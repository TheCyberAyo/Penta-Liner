// Multiplayer WebSocket client for real-time game communication

export interface GameMove {
  row: number;
  col: number;
  player: 1 | 2;
  timestamp: number;
}

export interface GameState {
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  moves: GameMove[];
}

export interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  gameState: GameState;
  isGameStarted: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  playerNumber?: 1 | 2;
}

export interface MultiplayerMessage {
  type: 'join-room' | 'leave-room' | 'game-move' | 'game-reset' | 'player-update' | 'room-update' | 'error';
  roomId?: string;
  playerId?: string;
  playerName?: string;
  move?: GameMove;
  gameState?: GameState;
  roomInfo?: RoomInfo;
  error?: string;
  data?: any;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  
  // Event handlers
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onRoomJoined: ((roomInfo: RoomInfo) => void) | null = null;
  public onRoomLeft: (() => void) | null = null;
  public onGameMove: ((move: GameMove) => void) | null = null;
  public onGameReset: ((gameState: GameState) => void) | null = null;
  public onPlayerUpdate: ((players: PlayerInfo[]) => void) | null = null;
  public onRoomUpdate: ((roomInfo: RoomInfo) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  // For demo purposes, we'll simulate a WebSocket server
  // In production, replace this with your actual WebSocket server URL
  private serverUrl = 'ws://localhost:8080'; // Replace with your server
  private isSimulated = true; // Set to false when using real server

  // Simulated server data (for demo/development)
  private simulatedRooms = new Map<string, RoomInfo>();
  private currentPlayerId: string = '';
  private currentRoomId: string = '';

  constructor() {
    this.currentPlayerId = this.generatePlayerId();
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      if (this.isSimulated) {
        // Simulate connection for demo purposes
        await this.simulateConnection();
      } else {
        // Real WebSocket connection
        await this.connectToServer();
      }
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private async simulateConnection(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.onConnected) {
      this.onConnected();
    }
  }

  private async connectToServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          if (this.onConnected) {
            this.onConnected();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MultiplayerMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          if (this.onDisconnected) {
            this.onDisconnected();
          }
          this.attemptReconnect();
        };

        this.ws.onerror = () => {
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(message: MultiplayerMessage): void {
    switch (message.type) {
      case 'room-update':
        if (message.roomInfo && this.onRoomUpdate) {
          this.onRoomUpdate(message.roomInfo);
        }
        break;
      
      case 'game-move':
        if (message.move && this.onGameMove) {
          this.onGameMove(message.move);
        }
        break;
      
      case 'game-reset':
        if (message.gameState && this.onGameReset) {
          this.onGameReset(message.gameState);
        }
        break;
      
      case 'player-update':
        if (message.data && this.onPlayerUpdate) {
          this.onPlayerUpdate(message.data);
        }
        break;
      
      case 'error':
        if (message.error && this.onError) {
          this.onError(message.error);
        }
        break;
    }
  }

  async createRoom(playerName: string): Promise<string> {
    const roomId = this.generateRoomId();
    
    if (this.isSimulated) {
      return this.simulateCreateRoom(roomId, playerName);
    } else {
      return this.sendCreateRoom(roomId, playerName);
    }
  }

  private async simulateCreateRoom(roomId: string, playerName: string): Promise<string> {
    const playerInfo: PlayerInfo = {
      id: this.currentPlayerId,
      name: playerName,
      isHost: true,
      isConnected: true,
      playerNumber: 1
    };

    const initialGameState: GameState = {
      board: Array(10).fill(null).map(() => Array(10).fill(0)),
      currentPlayer: 1,
      winner: 0,
      gameActive: true,
      moves: []
    };

    const roomInfo: RoomInfo = {
      roomId,
      players: [playerInfo],
      gameState: initialGameState,
      isGameStarted: false
    };

    this.simulatedRooms.set(roomId, roomInfo);
    this.currentRoomId = roomId;

    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 200));

    if (this.onRoomJoined) {
      this.onRoomJoined(roomInfo);
    }

    return roomId;
  }

  private async sendCreateRoom(roomId: string, playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to server'));
        return;
      }

      const message: MultiplayerMessage = {
        type: 'join-room',
        roomId,
        playerId: this.currentPlayerId,
        playerName
      };

      this.ws.send(JSON.stringify(message));

      // Set up temporary listener for room creation response
      const originalOnRoomJoined = this.onRoomJoined;
      this.onRoomJoined = (roomInfo) => {
        this.onRoomJoined = originalOnRoomJoined;
        if (this.onRoomJoined) {
          this.onRoomJoined(roomInfo);
        }
        resolve(roomId);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Room creation timeout'));
      }, 5000);
    });
  }

  async joinRoom(roomId: string, playerName: string): Promise<RoomInfo> {
    if (this.isSimulated) {
      return this.simulateJoinRoom(roomId, playerName);
    } else {
      return this.sendJoinRoom(roomId, playerName);
    }
  }

  private async simulateJoinRoom(roomId: string, playerName: string): Promise<RoomInfo> {
    const room = this.simulatedRooms.get(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }

    const playerInfo: PlayerInfo = {
      id: this.currentPlayerId,
      name: playerName,
      isHost: false,
      isConnected: true,
      playerNumber: 2
    };

    room.players.push(playerInfo);
    room.isGameStarted = true; // Start game when second player joins
    this.currentRoomId = roomId;

    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 200));

    if (this.onRoomJoined) {
      this.onRoomJoined(room);
    }

    return room;
  }

  private async sendJoinRoom(roomId: string, playerName: string): Promise<RoomInfo> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to server'));
        return;
      }

      const message: MultiplayerMessage = {
        type: 'join-room',
        roomId,
        playerId: this.currentPlayerId,
        playerName
      };

      this.ws.send(JSON.stringify(message));

      // Set up temporary listener for join response
      const originalOnRoomJoined = this.onRoomJoined;
      this.onRoomJoined = (roomInfo) => {
        this.onRoomJoined = originalOnRoomJoined;
        if (this.onRoomJoined) {
          this.onRoomJoined(roomInfo);
        }
        resolve(roomInfo);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Room join timeout'));
      }, 5000);
    });
  }

  sendMove(move: GameMove): void {
    if (this.isSimulated) {
      this.simulateSendMove(move);
    } else {
      this.realSendMove(move);
    }
  }

  private simulateSendMove(move: GameMove): void {
    const room = this.simulatedRooms.get(this.currentRoomId);
    if (!room) return;

    // Update game state
    room.gameState.board[move.row][move.col] = move.player;
    room.gameState.moves.push(move);
    room.gameState.currentPlayer = move.player === 1 ? 2 : 1;

    // Check for win condition (simplified)
    // In real implementation, this would be more thorough
    
    // Simulate sending to other player
    setTimeout(() => {
      if (this.onGameMove) {
        this.onGameMove(move);
      }
    }, 100);
  }

  private realSendMove(move: GameMove): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send move: not connected');
      return;
    }

    const message: MultiplayerMessage = {
      type: 'game-move',
      roomId: this.currentRoomId,
      playerId: this.currentPlayerId,
      move
    };

    this.ws.send(JSON.stringify(message));
  }

  resetGame(): void {
    if (this.isSimulated) {
      this.simulateResetGame();
    } else {
      this.realResetGame();
    }
  }

  private simulateResetGame(): void {
    const room = this.simulatedRooms.get(this.currentRoomId);
    if (!room) return;

    const newGameState: GameState = {
      board: Array(10).fill(null).map(() => Array(10).fill(0)),
      currentPlayer: 1,
      winner: 0,
      gameActive: true,
      moves: []
    };

    room.gameState = newGameState;

    setTimeout(() => {
      if (this.onGameReset) {
        this.onGameReset(newGameState);
      }
    }, 100);
  }

  private realResetGame(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot reset game: not connected');
      return;
    }

    const message: MultiplayerMessage = {
      type: 'game-reset',
      roomId: this.currentRoomId,
      playerId: this.currentPlayerId
    };

    this.ws.send(JSON.stringify(message));
  }

  leaveRoom(): void {
    if (this.isSimulated) {
      this.simulateLeaveRoom();
    } else {
      this.realLeaveRoom();
    }
  }

  private simulateLeaveRoom(): void {
    const room = this.simulatedRooms.get(this.currentRoomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== this.currentPlayerId);
      if (room.players.length === 0) {
        this.simulatedRooms.delete(this.currentRoomId);
      }
    }
    
    this.currentRoomId = '';
    
    if (this.onRoomLeft) {
      this.onRoomLeft();
    }
  }

  private realLeaveRoom(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: MultiplayerMessage = {
      type: 'leave-room',
      roomId: this.currentRoomId,
      playerId: this.currentPlayerId
    };

    this.ws.send(JSON.stringify(message));
    this.currentRoomId = '';
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (!this.isSimulated) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  isConnected(): boolean {
    if (this.isSimulated) {
      return true; // Always connected in simulation mode
    }
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }

  getCurrentRoomId(): string {
    return this.currentRoomId;
  }
}

// Create singleton instance
export const multiplayerClient = new MultiplayerClient();
