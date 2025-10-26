// Simple multiplayer synchronization using AsyncStorage
// This allows two mobile devices to sync moves in real-time

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SimpleMove {
  row: number;
  col: number;
  player: 1 | 2;
  timestamp: number;
  roomId: string;
}

export interface SimpleGameState {
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  lastMove?: SimpleMove;
}

export interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  isGameStarted: boolean;
  hostId: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  playerNumber: 1 | 2;
  isHost: boolean;
}

class SimpleMultiplayerClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private onMoveCallback?: (move: SimpleMove) => void;
  private onGameStateCallback?: (gameState: SimpleGameState) => void;
  private pollInterval?: NodeJS.Timeout;

  // Create or join a room
  createRoom(roomId: string, playerNumber: 1 | 2): void {
    this.roomId = roomId;
    this.playerNumber = playerNumber;
    this.startPolling();
    console.log(`🏠 Created room ${roomId} as player ${playerNumber}`);
  }

  joinRoom(roomId: string, playerNumber: 1 | 2): void {
    this.roomId = roomId;
    this.playerNumber = playerNumber;
    this.startPolling();
    console.log(`🚪 Joined room ${roomId} as player ${playerNumber}`);
  }

  // Send a move to other players
  sendMove(row: number, col: number): void {
    const move: SimpleMove = {
      row,
      col,
      player: this.playerNumber,
      timestamp: Date.now(),
      roomId: this.roomId
    };

    this.saveMove(move);
    console.log(`📤 Sent move: ${row},${col} for player ${this.playerNumber}`);
  }

  // Set callbacks for move and game state updates
  onMove(callback: (move: SimpleMove) => void): void {
    this.onMoveCallback = callback;
  }

  onGameState(callback: (gameState: SimpleGameState) => void): void {
    this.onGameStateCallback = callback;
  }

  // Start polling for updates
  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 1000); // Poll every second
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  // Check for new moves and game state updates
  private async checkForUpdates(): Promise<void> {
    if (!this.roomId) return;

    try {
      // Check for new moves
      const movesKey = `moves_${this.roomId}`;
      const movesData = await AsyncStorage.getItem(movesKey);
      
      if (movesData) {
        const moves: SimpleMove[] = JSON.parse(movesData);
        const lastMove = moves[moves.length - 1];
        
        if (lastMove && lastMove.player !== this.playerNumber && this.onMoveCallback) {
          this.onMoveCallback(lastMove);
        }
      }

      // Check for game state updates
      const gameStateKey = `gameState_${this.roomId}`;
      const gameStateData = await AsyncStorage.getItem(gameStateKey);
      
      if (gameStateData && this.onGameStateCallback) {
        const gameState: SimpleGameState = JSON.parse(gameStateData);
        this.onGameStateCallback(gameState);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  // Save move to storage
  private async saveMove(move: SimpleMove): Promise<void> {
    try {
      const movesKey = `moves_${this.roomId}`;
      const existingMoves = await AsyncStorage.getItem(movesKey);
      const moves: SimpleMove[] = existingMoves ? JSON.parse(existingMoves) : [];
      
      moves.push(move);
      await AsyncStorage.setItem(movesKey, JSON.stringify(moves));
    } catch (error) {
      console.error('Error saving move:', error);
    }
  }

  // Update game state
  async updateGameState(gameState: SimpleGameState): Promise<void> {
    try {
      const gameStateKey = `gameState_${this.roomId}`;
      await AsyncStorage.setItem(gameStateKey, JSON.stringify(gameState));
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  }

  // Create room with player info
  async createRoomWithPlayers(roomId: string, playerName: string): Promise<RoomInfo> {
    const roomInfo: RoomInfo = {
      roomId,
      players: [{
        id: `player_${Date.now()}`,
        name: playerName,
        playerNumber: 1,
        isHost: true
      }],
      isGameStarted: false,
      hostId: `player_${Date.now()}`
    };

    try {
      const roomKey = `room_${roomId}`;
      await AsyncStorage.setItem(roomKey, JSON.stringify(roomInfo));
      this.createRoom(roomId, 1);
      return roomInfo;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Join room with player info
  async joinRoomWithPlayers(roomId: string, playerName: string): Promise<RoomInfo> {
    try {
      const roomKey = `room_${roomId}`;
      const roomData = await AsyncStorage.getItem(roomKey);
      
      if (!roomData) {
        throw new Error('Room not found');
      }

      const roomInfo: RoomInfo = JSON.parse(roomData);
      
      if (roomInfo.players.length >= 2) {
        throw new Error('Room is full');
      }

      const newPlayer: PlayerInfo = {
        id: `player_${Date.now()}`,
        name: playerName,
        playerNumber: 2,
        isHost: false
      };

      roomInfo.players.push(newPlayer);
      await AsyncStorage.setItem(roomKey, JSON.stringify(roomInfo));
      
      this.joinRoom(roomId, 2);
      return roomInfo;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Get room info
  async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    try {
      const roomKey = `room_${roomId}`;
      const roomData = await AsyncStorage.getItem(roomKey);
      return roomData ? JSON.parse(roomData) : null;
    } catch (error) {
      console.error('Error getting room info:', error);
      return null;
    }
  }

  // Start game
  async startGame(roomId: string): Promise<void> {
    try {
      const roomKey = `room_${roomId}`;
      const roomData = await AsyncStorage.getItem(roomKey);
      
      if (roomData) {
        const roomInfo: RoomInfo = JSON.parse(roomData);
        roomInfo.isGameStarted = true;
        await AsyncStorage.setItem(roomKey, JSON.stringify(roomInfo));
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  // Clean up room data
  async cleanupRoom(roomId: string): Promise<void> {
    try {
      const keys = [
        `room_${roomId}`,
        `moves_${roomId}`,
        `gameState_${roomId}`
      ];
      
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error cleaning up room:', error);
    }
  }

  // Disconnect from room
  disconnect(): void {
    this.stopPolling();
    this.roomId = '';
    this.playerNumber = 1;
    this.onMoveCallback = undefined;
    this.onGameStateCallback = undefined;
  }
}

// Export singleton instance
export const simpleMultiplayerClient = new SimpleMultiplayerClient();

