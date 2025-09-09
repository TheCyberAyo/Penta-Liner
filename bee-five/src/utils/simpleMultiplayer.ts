// Simple multiplayer synchronization using localStorage
// This allows two browser windows to sync moves in real-time

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

class SimpleMultiplayerClient {
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private onMoveCallback?: (move: SimpleMove) => void;
  private onGameStateCallback?: (gameState: SimpleGameState) => void;
  private pollInterval?: number;

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

    // Store the move in localStorage for other players to find
    const moveKey = `bee5_move_${this.roomId}`;
    localStorage.setItem(moveKey, JSON.stringify(move));
    
    // Also store the latest move timestamp to help with polling
    localStorage.setItem(`bee5_lastmove_${this.roomId}`, move.timestamp.toString());
    
    console.log(`📤 Sent move:`, move);
  }

  // Send game state updates
  sendGameState(gameState: SimpleGameState): void {
    const stateKey = `bee5_gamestate_${this.roomId}`;
    localStorage.setItem(stateKey, JSON.stringify(gameState));
    console.log(`📤 Sent game state:`, gameState);
  }

  // Set up move callback
  onMove(callback: (move: SimpleMove) => void): void {
    this.onMoveCallback = callback;
  }

  // Set up game state callback
  onGameState(callback: (gameState: SimpleGameState) => void): void {
    this.onGameStateCallback = callback;
  }

  // Start polling for moves from other players
  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    let lastMoveTime = 0;
    let lastStateTime = 0;

    this.pollInterval = window.setInterval(() => {
      // Check for new moves
      const moveKey = `bee5_move_${this.roomId}`;
      const lastMoveKey = `bee5_lastmove_${this.roomId}`;
      
      const lastMoveTimeStr = localStorage.getItem(lastMoveKey);
      if (lastMoveTimeStr) {
        const moveTime = parseInt(lastMoveTimeStr);
        if (moveTime > lastMoveTime) {
          const moveData = localStorage.getItem(moveKey);
          if (moveData) {
            try {
              const move: SimpleMove = JSON.parse(moveData);
              // Only process moves from other players
              if (move.player !== this.playerNumber) {
                console.log(`📥 Received move:`, move);
                if (this.onMoveCallback) {
                  this.onMoveCallback(move);
                }
                lastMoveTime = moveTime;
              }
            } catch (error) {
              console.error('Error parsing move:', error);
            }
          }
        }
      }

      // Check for game state updates
      const stateKey = `bee5_gamestate_${this.roomId}`;
      const stateData = localStorage.getItem(stateKey);
      if (stateData) {
        try {
          const gameState: SimpleGameState = JSON.parse(stateData);
          const stateTime = gameState.lastMove?.timestamp || 0;
          if (stateTime > lastStateTime) {
            console.log(`📥 Received game state:`, gameState);
            if (this.onGameStateCallback) {
              this.onGameStateCallback(gameState);
            }
            lastStateTime = stateTime;
          }
        } catch (error) {
          console.error('Error parsing game state:', error);
        }
      }
    }, 100); // Poll every 100ms for real-time feel
  }

  // Clean up
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    
    // Clean up localStorage
    if (this.roomId) {
      localStorage.removeItem(`bee5_move_${this.roomId}`);
      localStorage.removeItem(`bee5_lastmove_${this.roomId}`);
      localStorage.removeItem(`bee5_gamestate_${this.roomId}`);
    }
  }
}

export const simpleMultiplayerClient = new SimpleMultiplayerClient();
