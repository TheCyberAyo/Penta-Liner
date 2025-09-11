// AI Worker for Penta-Liner Game
// Runs in separate thread to avoid blocking UI

class PentaLinerAI {
  constructor() {
    this.GRID_SIZE = 10;
    this.WIN_LENGTH = 5;
    this.MAX_DEPTH = 4;
    this.EMPTY = 0;
    this.HUMAN = 1;
    this.AI = 2;
  }

  // Minimax algorithm with alpha-beta pruning
  minimax(board, depth, isMaximizing, alpha, beta, lastMove) {
    const winner = this.checkWin(board, lastMove);
    
    // Terminal conditions
    if (winner === this.AI) return 1000 - depth;
    if (winner === this.HUMAN) return -1000 + depth;
    if (depth === 0 || this.isBoardFull(board)) return this.evaluateBoard(board);

    if (isMaximizing) {
      let maxEval = -Infinity;
      const moves = this.generateMoves(board);
      
      for (const move of moves) {
        board[move.row][move.col] = this.AI;
        const eval = this.minimax(board, depth - 1, false, alpha, beta, move);
        board[move.row][move.col] = this.EMPTY;
        
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      const moves = this.generateMoves(board);
      
      for (const move of moves) {
        board[move.row][move.col] = this.HUMAN;
        const eval = this.minimax(board, depth - 1, true, alpha, beta, move);
        board[move.row][move.col] = this.EMPTY;
        
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  // Generate prioritized moves (center-out strategy)
  generateMoves(board) {
    const moves = [];
    const center = Math.floor(this.GRID_SIZE / 2);
    
    // Collect all empty cells
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (board[row][col] === this.EMPTY) {
          const distance = Math.abs(row - center) + Math.abs(col - center);
          moves.push({ row, col, distance });
        }
      }
    }
    
    // Sort by distance from center (closer moves first)
    moves.sort((a, b) => a.distance - b.distance);
    
    // Limit moves for performance
    return moves.slice(0, Math.min(moves.length, 20));
  }

  // Evaluate board position
  evaluateBoard(board) {
    let score = 0;
    
    // Evaluate all possible lines
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (board[row][col] !== this.EMPTY) continue;
        
        // Check potential in all directions
        score += this.evaluatePosition(board, row, col, this.AI);
        score -= this.evaluatePosition(board, row, col, this.HUMAN);
      }
    }
    
    return score;
  }

  // Evaluate potential of a position for a player
  evaluatePosition(board, row, col, player) {
    let score = 0;
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];
    
    for (const [dRow, dCol] of directions) {
      const lineScore = this.evaluateLine(board, row, col, dRow, dCol, player);
      score += lineScore;
    }
    
    return score;
  }

  // Evaluate a specific line direction
  evaluateLine(board, row, col, dRow, dCol, player) {
    let count = 0;
    let blocked = 0;
    
    // Check positive direction
    for (let i = 1; i < this.WIN_LENGTH; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!this.isInBounds(newRow, newCol)) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        count++;
      } else if (board[newRow][newCol] !== this.EMPTY) {
        blocked++;
        break;
      } else {
        break;
      }
    }
    
    // Check negative direction
    for (let i = 1; i < this.WIN_LENGTH; i++) {
      const newRow = row - i * dRow;
      const newCol = col - i * dCol;
      
      if (!this.isInBounds(newRow, newCol)) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        count++;
      } else if (board[newRow][newCol] !== this.EMPTY) {
        blocked++;
        break;
      } else {
        break;
      }
    }
    
    // Score based on count and blocking
    if (blocked === 2) return 0; // Completely blocked
    if (count >= 4) return 1000; // Winning move
    if (count === 3) return 50;
    if (count === 2) return 10;
    if (count === 1) return 2;
    return 1;
  }

  // Check if position is within bounds
  isInBounds(row, col) {
    return row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE;
  }

  // Check for win condition
  checkWin(board, lastMove) {
    if (!lastMove) return 0;
    
    const { row, col } = lastMove;
    const player = board[row][col];
    if (player === this.EMPTY) return 0;
    
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];
    
    for (const [dRow, dCol] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < this.WIN_LENGTH; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (this.isInBounds(newRow, newCol) && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }
      
      // Check negative direction
      for (let i = 1; i < this.WIN_LENGTH; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (this.isInBounds(newRow, newCol) && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= this.WIN_LENGTH) {
        return player;
      }
    }
    
    return 0;
  }

  // Check if board is full
  isBoardFull(board) {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (board[row][col] === this.EMPTY) return false;
      }
    }
    return true;
  }

  // Strategic AI for hard difficulty
  findStrategicMove(board) {
    // Block any 3-in-a-row threats immediately
    const blockingMove = this.findBlockingMove(board);
    if (blockingMove) {
      return blockingMove;
    }
    
    // If no blocking needed, use regular minimax
    const moves = this.generateMoves(board);
    let bestMove = null;
    let bestValue = -Infinity;
    
    for (const move of moves) {
      board[move.row][move.col] = this.AI;
      const moveValue = this.minimax(board, 4, false, -Infinity, Infinity, move);
      board[move.row][move.col] = this.EMPTY;
      
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }
    
    // Fallback: if no move found, return first available move
    if (!bestMove && moves.length > 0) {
      bestMove = moves[0];
    }
    
    return bestMove;
  }

  // Find blocking move - scans for existing 3-in-a-row threats
  findBlockingMove(board) {
    // Check every position for human threats
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (board[row][col] === this.HUMAN) {
          // Check all directions from this human piece
          const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal /
            [1, -1]   // diagonal \
          ];
          
          for (const [dRow, dCol] of directions) {
            const threat = this.checkHumanThreat(board, row, col, dRow, dCol);
            if (threat) {
              return threat;
            }
          }
        }
      }
    }
    
    return null;
  }

  // Check for human threat in a specific direction and return blocking position
  checkHumanThreat(board, startRow, startCol, dRow, dCol) {
    let humanCount = 1; // Count the starting human piece
    let emptyPositions = [];
    
    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = startRow + i * dRow;
      const newCol = startCol + i * dCol;
      
      if (!this.isInBounds(newRow, newCol)) break;
      
      if (board[newRow][newCol] === this.HUMAN) {
        humanCount++;
      } else if (board[newRow][newCol] === this.EMPTY) {
        emptyPositions.push({row: newRow, col: newCol});
        break;
      } else {
        break; // Blocked by AI piece
      }
    }
    
    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = startRow - i * dRow;
      const newCol = startCol - i * dCol;
      
      if (!this.isInBounds(newRow, newCol)) break;
      
      if (board[newRow][newCol] === this.HUMAN) {
        humanCount++;
      } else if (board[newRow][newCol] === this.EMPTY) {
        emptyPositions.push({row: newRow, col: newCol});
        break;
      } else {
        break; // Blocked by AI piece
      }
    }
    
    // If we have 3+ human pieces and at least one empty position, we can block
    if (humanCount >= 3 && emptyPositions.length > 0) {
      return emptyPositions[0]; // Return first blocking position
    }
    
    return null;
  }


  // Find best move using minimax
  findBestMove(board, difficulty = 'medium') {
    const depthMap = {
      easy: 2,    // Current medium becomes new easy (depth 2)
      medium: 3,  // Current hard becomes new medium (depth 3)
      hard: 4      // New hard uses strategic AI
    };
    
    // For hard difficulty, use strategic AI (blocks 3-in-a-row)
    if (difficulty === 'hard') {
      return this.findStrategicMove(board);
    }
    
    // For easy and medium, use minimax
    const depth = depthMap[difficulty] || 2;
    let bestMove = null;
    let bestValue = -Infinity;
    
    const moves = this.generateMoves(board);
    
    for (const move of moves) {
      board[move.row][move.col] = this.AI;
      const moveValue = this.minimax(board, depth - 1, false, -Infinity, Infinity, move);
      board[move.row][move.col] = this.EMPTY;
      
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
}

// Worker message handler
const ai = new PentaLinerAI();

self.onmessage = function(e) {
  const { type, board, difficulty, id } = e.data;
  
  try {
    switch (type) {
      case 'findBestMove':
        const startTime = performance.now();
        const bestMove = ai.findBestMove(board, difficulty);
        const endTime = performance.now();
        
        self.postMessage({
          type: 'bestMoveFound',
          move: bestMove,
          computationTime: endTime - startTime,
          id
        });
        break;
        
        
      default:
        self.postMessage({
          type: 'error',
          message: 'Unknown message type',
          id
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message,
      id
    });
  }
};