// AI Logic for Bee-Five Mobile
// Implements different difficulty levels with proper strategies

import { checkWinCondition, getWinningPieces } from './gameLogic';

export interface AIMove {
  row: number;
  col: number;
  score: number;
  reason: string;
}

export interface AIDifficulty {
  name: string;
  description: string;
  strategy: (board: (0 | 1 | 2 | 3)[][], availableCells: { row: number; col: number }[]) => AIMove;
}

// Get all available cells on the board
export const getAvailableCells = (board: (0 | 1 | 2 | 3)[][]): { row: number; col: number }[] => {
  const availableCells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 0) {
        availableCells.push({ row, col });
      }
    }
  }
  return availableCells;
};

// Check if a move would create a win for a player
export const wouldCreateWin = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): boolean => {
  const testBoard = board.map(r => [...r]);
  testBoard[row][col] = player;
  return checkWinCondition(testBoard, row, col, player);
};

// Check if a move would block an opponent's win
export const wouldBlockWin = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, opponent: 1 | 2): boolean => {
  return wouldCreateWin(board, row, col, opponent);
};

// Count pieces in a line for a player
export const countInLine = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2, direction: [number, number]): number => {
  const [dx, dy] = direction;
  let count = 0;
  
  // Count in positive direction
  for (let i = 0; i < 5; i++) {
    const newRow = row + i * dx;
    const newCol = col + i * dy;
    if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
      count++;
    } else {
      break;
    }
  }
  
  // Count in negative direction
  for (let i = 1; i < 5; i++) {
    const newRow = row - i * dx;
    const newCol = col - i * dy;
    if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
      count++;
    } else {
      break;
    }
  }
  
  return count;
};

// Calculate the strategic value of a position
export const calculatePositionValue = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): number => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let totalValue = 0;
  
  for (const direction of directions) {
    const count = countInLine(board, row, col, player, direction);
    if (count >= 2) {
      totalValue += Math.pow(count, 2); // Exponential scoring for longer lines
    }
  }
  
  // Bonus for center positions
  const centerDistance = Math.abs(row - 4.5) + Math.abs(col - 4.5);
  totalValue += Math.max(0, 10 - centerDistance);
  
  return totalValue;
};

// EASY AI: Random moves with slight bias toward center
export const easyAIStrategy = (board: (0 | 1 | 2 | 3)[][], availableCells: { row: number; col: number }[]): AIMove => {
  // 70% random, 30% center bias
  if (Math.random() < 0.7) {
    const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
    return {
      row: randomCell.row,
      col: randomCell.col,
      score: 1,
      reason: 'Random move'
    };
  }
  
  // Prefer center positions
  const centerCells = availableCells.filter(cell => {
    const centerDistance = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
    return centerDistance <= 3;
  });
  
  const targetCells = centerCells.length > 0 ? centerCells : availableCells;
  const selectedCell = targetCells[Math.floor(Math.random() * targetCells.length)];
  
  return {
    row: selectedCell.row,
    col: selectedCell.col,
    score: 2,
    reason: 'Center preference'
  };
};

// MEDIUM AI: Block wins, create threats, strategic positioning
export const mediumAIStrategy = (board: (0 | 1 | 2 | 3)[][], availableCells: { row: number; col: number }[]): AIMove => {
  const moves: AIMove[] = [];
  
  for (const cell of availableCells) {
    let score = 0;
    let reason = '';
    
    // Priority 1: Win immediately
    if (wouldCreateWin(board, cell.row, cell.col, 2)) {
      return {
        row: cell.row,
        col: cell.col,
        score: 1000,
        reason: 'Winning move'
      };
    }
    
    // Priority 2: Block opponent's win
    if (wouldBlockWin(board, cell.row, cell.col, 1)) {
      score = 500;
      reason = 'Blocking opponent win';
    }
    // Priority 3: Create 4-in-a-row threat
    else if (countInLine(board, cell.row, cell.col, 2, [0, 1]) >= 3 ||
             countInLine(board, cell.row, cell.col, 2, [1, 0]) >= 3 ||
             countInLine(board, cell.row, cell.col, 2, [1, 1]) >= 3 ||
             countInLine(board, cell.row, cell.col, 2, [1, -1]) >= 3) {
      score = 200;
      reason = 'Creating 4-in-a-row threat';
    }
    // Priority 4: Block opponent's 4-in-a-row threat
    else if (countInLine(board, cell.row, cell.col, 1, [0, 1]) >= 3 ||
             countInLine(board, cell.row, cell.col, 1, [1, 0]) >= 3 ||
             countInLine(board, cell.row, cell.col, 1, [1, 1]) >= 3 ||
             countInLine(board, cell.row, cell.col, 1, [1, -1]) >= 3) {
      score = 150;
      reason = 'Blocking opponent threat';
    }
    // Priority 5: Strategic positioning
    else {
      score = calculatePositionValue(board, cell.row, cell.col, 2);
      reason = 'Strategic positioning';
    }
    
    moves.push({
      row: cell.row,
      col: cell.col,
      score,
      reason
    });
  }
  
  // Sort by score and add some randomness to top moves
  moves.sort((a, b) => b.score - a.score);
  
  // Choose from top 3 moves with weighted probability
  const topMoves = moves.slice(0, Math.min(3, moves.length));
  const weights = topMoves.map((move, index) => Math.pow(0.7, index));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < topMoves.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return topMoves[i];
    }
  }
  
  return topMoves[0];
};

// HARD AI: Advanced strategy with lookahead and pattern recognition
export const hardAIStrategy = (board: (0 | 1 | 2 | 3)[][], availableCells: { row: number; col: number }[]): AIMove => {
  const moves: AIMove[] = [];
  
  for (const cell of availableCells) {
    let score = 0;
    let reason = '';
    
    // Priority 1: Win immediately
    if (wouldCreateWin(board, cell.row, cell.col, 2)) {
      return {
        row: cell.row,
        col: cell.col,
        score: 10000,
        reason: 'Winning move'
      };
    }
    
    // Priority 2: Block opponent's win
    if (wouldBlockWin(board, cell.row, cell.col, 1)) {
      score = 5000;
      reason = 'Blocking opponent win';
    }
    // Priority 3: Create multiple threats (fork)
    else {
      const testBoard = board.map(r => [...r]);
      testBoard[cell.row][cell.col] = 2;
      
      let threatCount = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (const [dx, dy] of directions) {
        const count = countInLine(testBoard, cell.row, cell.col, 2, [dx, dy]);
        if (count >= 3) {
          threatCount++;
        }
      }
      
      if (threatCount >= 2) {
        score = 2000;
        reason = 'Creating multiple threats';
      }
      // Priority 4: Block opponent's multiple threats
      else {
        const opponentTestBoard = board.map(r => [...r]);
        opponentTestBoard[cell.row][cell.col] = 1;
        
        let opponentThreatCount = 0;
        for (const [dx, dy] of directions) {
          const count = countInLine(opponentTestBoard, cell.row, cell.col, 1, [dx, dy]);
          if (count >= 3) {
            opponentThreatCount++;
          }
        }
        
        if (opponentThreatCount >= 2) {
          score = 1500;
          reason = 'Blocking multiple opponent threats';
        }
        // Priority 5: Advanced strategic positioning
        else {
          score = calculatePositionValue(board, cell.row, cell.col, 2) * 2;
          
          // Bonus for moves that create future opportunities
          const futureValue = calculateFutureOpportunities(testBoard, cell.row, cell.col, 2);
          score += futureValue;
          
          reason = 'Advanced strategic positioning';
        }
      }
    }
    
    moves.push({
      row: cell.row,
      col: cell.col,
      score,
      reason
    });
  }
  
  // Sort by score and choose best move
  moves.sort((a, b) => b.score - a.score);
  
  // Add slight randomness to prevent perfect play
  if (moves.length > 1 && Math.random() < 0.1) {
    const topMoves = moves.slice(0, Math.min(3, moves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }
  
  return moves[0];
};

// Calculate future opportunities for a position
const calculateFutureOpportunities = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): number => {
  let opportunities = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (const [dx, dy] of directions) {
    // Check if this position could lead to future threats
    let openEnds = 0;
    
    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === 0) {
          openEnds++;
        } else if (board[newRow][newCol] === player) {
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === 0) {
          openEnds++;
        } else if (board[newRow][newCol] === player) {
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    opportunities += openEnds;
  }
  
  return opportunities * 10;
};

// Main AI function that selects the appropriate strategy
export const getAIMove = (board: (0 | 1 | 2 | 3)[][], difficulty: string): AIMove => {
  const availableCells = getAvailableCells(board);
  
  if (availableCells.length === 0) {
    throw new Error('No available moves');
  }
  
  console.log(`AI (${difficulty}) analyzing ${availableCells.length} available moves`);
  
  let move: AIMove;
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      move = easyAIStrategy(board, availableCells);
      break;
    case 'medium':
      move = mediumAIStrategy(board, availableCells);
      break;
    case 'hard':
      move = hardAIStrategy(board, availableCells);
      break;
    default:
      console.warn(`Unknown difficulty: ${difficulty}, defaulting to easy`);
      move = easyAIStrategy(board, availableCells);
  }
  
  console.log(`AI selected move: (${move.row}, ${move.col}) - ${move.reason} (score: ${move.score})`);
  
  return move;
};

// Difficulty configurations
export const AI_DIFFICULTIES: { [key: string]: AIDifficulty } = {
  easy: {
    name: 'Easy',
    description: 'Random moves with slight center preference',
    strategy: easyAIStrategy
  },
  medium: {
    name: 'Medium',
    description: 'Blocks wins, creates threats, strategic positioning',
    strategy: mediumAIStrategy
  },
  hard: {
    name: 'Hard',
    description: 'Advanced strategy with lookahead and pattern recognition',
    strategy: hardAIStrategy
  }
};
