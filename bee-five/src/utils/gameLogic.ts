// Shared game logic utilities to avoid duplication

export const checkWinCondition = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): boolean => {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // Count the current piece

    // Check in positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }

    // Check in negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
};

export const isBoardFull = (board: (0 | 1 | 2 | 3)[][]): boolean => {
  return board.every(row => row.every(cell => cell !== 0 && cell !== BLOCKED_CELL));
};

export const createEmptyBoard = (): (0 | 1 | 2 | 3)[][] => {
  return Array(10).fill(null).map(() => Array(10).fill(0));
};

// Blocked cell value (3 represents a blocked cell with bee)
export const BLOCKED_CELL = 3;

// Remove 2 blocked cells from the board (for games ending with 4)
export const removeTwoBlockedCells = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const blockedPositions: { row: number; col: number }[] = [];
  
  // Find all blocked cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === BLOCKED_CELL) {
        blockedPositions.push({ row, col });
      }
    }
  }
  
  // Remove 2 blocked cells (or all if less than 2 remain)
  const cellsToRemove = Math.min(2, blockedPositions.length);
  for (let i = 0; i < cellsToRemove; i++) {
    const randomIndex = Math.floor(Math.random() * blockedPositions.length);
    const { row, col } = blockedPositions[randomIndex];
    newBoard[row][col] = 0; // Remove the blocked cell
    blockedPositions.splice(randomIndex, 1); // Remove from array
  }
  
  return newBoard;
};

// Check if a game number ends with 3 (for progressive blocks)
export const gameEndsWith3 = (gameNumber: number): boolean => {
  return gameNumber % 10 === 3 && gameNumber > 50;
};

// Check if a game number ends with 4 (for disappearing blocks)
export const gameEndsWith4 = (gameNumber: number): boolean => {
  return gameNumber % 10 === 4;
};

// Check if a game number ends with 7 or 8 and is after game 1000 (for shifting blocks)
export const gameEndsWith7Or8After1000 = (gameNumber: number): boolean => {
  return gameNumber > 1000 && (gameNumber % 10 === 7 || gameNumber % 10 === 8);
};

// Check if a game number is a multiple of 7 between 500-1000 (for disappearing pieces after 4 turns)
export const isMultipleOf7Between500And1000 = (gameNumber: number): boolean => {
  return gameNumber >= 500 && gameNumber <= 1000 && gameNumber % 7 === 0;
};

// Check if a game number is a multiple of 4 from game 1000 onwards (for disappearing pieces after 3 moves)
export const isMultipleOf4From1000 = (gameNumber: number): boolean => {
  return gameNumber >= 1000 && gameNumber % 4 === 0;
};

// Check if a game number is a multiple of 10 (for mud zones)
export const isMultipleOf10 = (gameNumber: number): boolean => {
  return gameNumber % 10 === 0;
};

// Check if a game number is a multiple of 40 (for enhanced mud zones with 5 zones)
export const isMultipleOf40 = (gameNumber: number): boolean => {
  return gameNumber % 40 === 0;
};

// Check if a game number follows the specific pattern (42, 92, 142, 192, etc.)
export const gameEndsWith2SpecificPattern = (gameNumber: number): boolean => {
  // The pattern is: 42, 92, 142, 192, 242, 292, 342, 392, 442, 492, 542, 592, 642, 692, 742, 792, 842, 892, 942, 992, 1042, 1092, 1142, 1192, 1242, 1292, 1342, 1392, 1442, 1492, 1542, 1592, 1642, 1692, 1742, 1792, 1842, 1892, 1942, 1992
  // This is every 50 games starting from 42: 42 + (n * 50) where n = 0, 1, 2, 3, ...
  
  if (gameNumber < 42) {
    return false;
  }
  
  // Check if it's in the sequence: 42, 92, 142, 192, 242, 292, etc.
  return (gameNumber - 42) % 50 === 0;
};

// Check if a game number is a multiple of 50 and in match 2/5 (for blind play mode)
export const isMultipleOf50Match2 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber % 50 === 0 && currentMatch === 2;
};

// Check if a game number is a multiple of 13 (for piece capacity limitation)
export const isMultipleOf13 = (gameNumber: number): boolean => {
  return gameNumber % 13 === 0;
};

// Check if a game number is a multiple of 10 from 799-1999 (excluding multiples of 50) for board rearrangement
export const shouldRearrangeBoard = (gameNumber: number): boolean => {
  if (gameNumber < 799 || gameNumber > 1999) {
    return false;
  }
  
  // Must be a multiple of 10
  if (gameNumber % 10 !== 0) {
    return false;
  }
  
  // Exclude multiples of 50
  if (gameNumber % 50 === 0) {
    return false;
  }
  
  return true;
};

// Check if a game number ends with 1 and is level 200+ (for human player blocking)
// BUT exclude games that are part of any 5-match series
export const gameEndsWith1After200 = (gameNumber: number): boolean => {
  if (gameNumber < 200 || gameNumber % 10 !== 1) {
    return false;
  }
  
  // Check if this game is part of ANY 5-match series
  // 5-match series start at: 200, 250, 300, 350, 400, 450, 500, etc.
  const seriesStart = Math.floor((gameNumber - 200) / 50) * 50 + 200;
  const positionInSeries = gameNumber - seriesStart;
  
  // If it's in position 0-4 of any 5-match series, don't apply blocking
  if (positionInSeries >= 0 && positionInSeries <= 4) {
    return false;
  }
  
  return true;
};

// Check if a game number is the first game of a 5-match series (200, 250, 300, etc)
export const isFirstGameOfFiveMatchSeries = (gameNumber: number): boolean => {
  return gameNumber >= 200 && (gameNumber - 200) % 50 === 0;
};

// Check if a game number ends with 1 and is in the specified ranges (11-191, 1001-1591)
export const gameEndsWith1InSpecifiedRanges = (gameNumber: number): boolean => {
  if (gameNumber % 10 !== 1) {
    return false;
  }
  
  // Range 1: 11-191
  if (gameNumber >= 11 && gameNumber <= 191) {
    return true;
  }
  
  // Range 2: 1001-1591
  if (gameNumber >= 1001 && gameNumber <= 1591) {
    return true;
  }
  
  return false;
};

// Get progressive blocking rules for games ending with 3
export const getProgressiveBlockRules = (gameNumber: number): { blocksToAdd: number; movesInterval: number } => {
  if (gameNumber >= 50 && gameNumber <= 200) {
    return { blocksToAdd: 1, movesInterval: 5 }; // 1 block every 5 moves
  } else if (gameNumber >= 201 && gameNumber <= 399) {
    return { blocksToAdd: 1, movesInterval: 4 }; // 1 block every 4 moves
  } else if (gameNumber >= 400 && gameNumber <= 599) {
    return { blocksToAdd: 2, movesInterval: 5 }; // 2 blocks every 5 moves
  } else if (gameNumber >= 600 && gameNumber <= 799) {
    return { blocksToAdd: 2, movesInterval: 4 }; // 2 blocks every 4 moves
  } else if (gameNumber >= 800) {
    return { blocksToAdd: 2, movesInterval: 3 }; // 2 blocks every 3 moves
  }
  return { blocksToAdd: 0, movesInterval: 0 }; // No progressive blocks
};

// Add progressive blocks to the board (for games ending with 3)
export const addProgressiveBlocks = (board: (0 | 1 | 2 | 3)[][], blocksToAdd: number): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const emptyPositions: { row: number; col: number }[] = [];
  
  // Find all empty cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === 0) {
        emptyPositions.push({ row, col });
      }
    }
  }
  
  // Add the specified number of blocks (or all available if less than requested)
  const blocksToPlace = Math.min(blocksToAdd, emptyPositions.length);
  for (let i = 0; i < blocksToPlace; i++) {
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const { row, col } = emptyPositions[randomIndex];
    newBoard[row][col] = BLOCKED_CELL; // Add the blocked cell
    emptyPositions.splice(randomIndex, 1); // Remove from array
  }
  
  return newBoard;
};

// Add a single block to the board (for games ending with 1 and first games of 5-match series)
export const addSingleBlock = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  return addProgressiveBlocks(board, 1);
};

// Find strategic blocking position based on human player's moves
export const findStrategicBlockPosition = (board: (0 | 1 | 2 | 3)[][]): { row: number; col: number } | null => {
  const emptyPositions: { row: number; col: number }[] = [];
  const strategicPositions: { row: number; col: number; priority: number }[] = [];
  
  // Find all empty cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 0) {
        emptyPositions.push({ row, col });
      }
    }
  }
  
  if (emptyPositions.length === 0) {
    return null;
  }
  
  // Analyze each empty position for strategic value
  for (const pos of emptyPositions) {
    let priority = 0;
    
    // Check if blocking this position would prevent human from completing a line
    priority += checkBlockingValue(board, pos.row, pos.col, 1);
    
    // Check if this position is near human pieces (closer to human pieces = higher priority)
    priority += checkProximityValue(board, pos.row, pos.col, 1);
    
    // Check if this position would block potential AI threats
    priority += checkBlockingValue(board, pos.row, pos.col, 2);
    
    strategicPositions.push({ ...pos, priority });
  }
  
  // Sort by priority (highest first) and return the best position
  strategicPositions.sort((a, b) => b.priority - a.priority);
  
  return strategicPositions.length > 0 ? {
    row: strategicPositions[0].row,
    col: strategicPositions[0].col
  } : null;
};

// Check how valuable a position is for blocking a specific player
const checkBlockingValue = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): number => {
  let value = 0;
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 0;
    
    // Count consecutive pieces in this direction
    for (let i = -4; i <= 4; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === player) {
          count++;
        } else if (board[newRow][newCol] !== 0) {
          break; // Hit a different player or block, stop counting
        }
      }
    }
    
    // Higher value for positions that would block longer sequences
    if (count >= 2) {
      value += count * 10; // Exponential value for longer sequences
    }
  }
  
  return value;
};

// Check proximity value - positions closer to human pieces are more valuable to block
const checkProximityValue = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): number => {
  let value = 0;
  
  // Check in a 3x3 area around the position
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && 
          board[newRow][newCol] === player) {
        const distance = Math.abs(dr) + Math.abs(dc);
        value += Math.max(0, 5 - distance); // Closer pieces give higher value
      }
    }
  }
  
  return value;
};

// Add strategic block based on human player's move patterns
export const addStrategicBlock = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const blockPosition = findStrategicBlockPosition(newBoard);
  
  if (blockPosition) {
    newBoard[blockPosition.row][blockPosition.col] = BLOCKED_CELL;
  }
  
  return newBoard;
};

// Shift all blocks one position each turn (for games ending with 7 or 8 after game 1000)
export const shiftAllBlocks = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const blockedPositions: { row: number; col: number }[] = [];
  
  // Find all blocked cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === BLOCKED_CELL) {
        blockedPositions.push({ row, col });
      }
    }
  }
  
  // Clear all blocked cells first
  blockedPositions.forEach(({ row, col }) => {
    newBoard[row][col] = 0;
  });
  
  // Shift each block one position (rightward, wrapping to next row if needed)
  blockedPositions.forEach(({ row, col }) => {
    let newRow = row;
    let newCol = col + 1;
    
    // Wrap to next row if we go beyond the board
    if (newCol >= 10) {
      newRow = (row + 1) % 10;
      newCol = 0;
    }
    
    // Only place the block if the new position is empty
    if (newBoard[newRow][newCol] === 0) {
      newBoard[newRow][newCol] = BLOCKED_CELL;
    } else {
      // If the new position is occupied, find the next available position
      let foundPosition = false;
      for (let attempts = 0; attempts < 100 && !foundPosition; attempts++) {
        newCol++;
        if (newCol >= 10) {
          newRow = (newRow + 1) % 10;
          newCol = 0;
        }
        if (newBoard[newRow][newCol] === 0) {
          newBoard[newRow][newCol] = BLOCKED_CELL;
          foundPosition = true;
        }
      }
    }
  });
  
  return newBoard;
};

// Remove old pieces (both player 1 and player 2) that have been on the board for the specified number of turns
export const removeOldPieces = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], turnsToLive: number): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  // Collect all pieces with their positions and ages for FIFO removal
  const piecesToRemove: { row: number; col: number; age: number; player: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if ((newBoard[row][col] === 1 || newBoard[row][col] === 2) && newPieceAges[row][col] >= turnsToLive) {
        piecesToRemove.push({
          row,
          col,
          age: newPieceAges[row][col],
          player: newBoard[row][col] as 1 | 2
        });
      }
    }
  }
  
  // Sort by age (oldest first) and remove the oldest pieces
  piecesToRemove.sort((a, b) => b.age - a.age);
  
  // Remove the oldest pieces
  piecesToRemove.forEach(({ row, col }) => {
    newBoard[row][col] = 0; // Remove the piece
    newPieceAges[row][col] = 0; // Reset age
  });
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Age all pieces (both player 1 and player 2) by 1 turn
export const ageAllPieces = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): number[][] => {
  const newPieceAges = pieceAges.map(row => [...row]);
  
  // Increment age for all existing pieces (both player 1 and player 2)
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 1 || board[row][col] === 2) {
        // Increment age for existing pieces
        newPieceAges[row][col] = (newPieceAges[row][col] || 0) + 1;
      } else {
        newPieceAges[row][col] = 0; // Reset age for empty cells or blocks
      }
    }
  }
  
  return newPieceAges;
};

// Remove oldest pieces of a specific player based on move count
export const removeOldestPiecesOfPlayer = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], player: 1 | 2, piecesToRemove: number = 1): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  // Collect all pieces of the specified player with their positions and ages
  const playerPieces: { row: number; col: number; age: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === player) {
        playerPieces.push({
          row,
          col,
          age: newPieceAges[row][col]
        });
      }
    }
  }
  
  if (playerPieces.length === 0) {
    return { board: newBoard, pieceAges: newPieceAges };
  }
  
  // Sort by age (oldest first) and remove the oldest pieces
  playerPieces.sort((a, b) => b.age - a.age);
  
  // Remove the specified number of oldest pieces
  const piecesToActuallyRemove = Math.min(piecesToRemove, playerPieces.length);
  for (let i = 0; i < piecesToActuallyRemove; i++) {
    const { row, col } = playerPieces[i];
    newBoard[row][col] = 0; // Remove the piece
    newPieceAges[row][col] = 0; // Reset age
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Remove pieces of a specific player that have reached a specific age
export const removePiecesByAge = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], player: 1 | 2, targetAge: number): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  // Find pieces of the specified player that have reached the target age
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === player && newPieceAges[row][col] === targetAge) {
        // Remove this piece
        newBoard[row][col] = 0;
        newPieceAges[row][col] = 0;
      }
    }
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Initialize piece ages array
export const initializePieceAges = (): number[][] => {
  return Array(10).fill(null).map(() => Array(10).fill(0));
};

// Count total pieces on the board (excluding blocked cells)
export const countPiecesOnBoard = (board: (0 | 1 | 2 | 3)[][]): number => {
  let count = 0;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 1 || board[row][col] === 2) {
        count++;
      }
    }
  }
  return count;
};

// Remove oldest pieces when board capacity is exceeded (for multiples of 13 levels)
export const enforcePieceCapacity = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], maxCapacity: number = 35): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const currentPieceCount = countPiecesOnBoard(board);
  
  if (currentPieceCount <= maxCapacity) {
    return { board, pieceAges };
  }
  
  const piecesToRemove = currentPieceCount - maxCapacity;
  
  // Collect all pieces with their positions and ages for FIFO removal
  const piecesToRemoveList: { row: number; col: number; age: number; player: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 1 || board[row][col] === 2) {
        piecesToRemoveList.push({
          row,
          col,
          age: pieceAges[row][col],
          player: board[row][col] as 1 | 2
        });
      }
    }
  }
  
  // Sort by age (oldest first) and remove the oldest pieces
  piecesToRemoveList.sort((a, b) => b.age - a.age);
  
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  // Remove the oldest pieces
  for (let i = 0; i < piecesToRemove && i < piecesToRemoveList.length; i++) {
    const { row, col } = piecesToRemoveList[i];
    newBoard[row][col] = 0; // Remove the piece
    newPieceAges[row][col] = 0; // Reset age
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Rearrange board while preserving all pieces and win conditions
export const rearrangeBoard = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = Array(10).fill(null).map(() => Array(10).fill(0));
  const newPieceAges = Array(10).fill(null).map(() => Array(10).fill(0));
  
  // Collect all pieces with their positions and ages
  const pieces: { row: number; col: number; value: 1 | 2 | 3; age: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] !== 0) {
        pieces.push({
          row,
          col,
          value: board[row][col] as 1 | 2 | 3,
          age: pieceAges[row][col]
        });
      }
    }
  }
  
  // Shuffle the pieces array to randomize their positions
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  
  // Place pieces in new positions
  pieces.forEach((piece, index) => {
    const newRow = Math.floor(index / 10);
    const newCol = index % 10;
    newBoard[newRow][newCol] = piece.value;
    newPieceAges[newRow][newCol] = piece.age;
  });
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Generate mud zone positions for multiples of 10 games
export const generateMudZones = (gameNumber: number): { row: number; col: number }[] => {
  if (!isMultipleOf10(gameNumber)) {
    return []; // No mud zones for non-multiples of 10
  }
  
  const numMudZones = isMultipleOf40(gameNumber) ? 5 : 2; // 5 for multiples of 40, 2 for other multiples of 10
  
  // Use game number as seed for consistent positioning per level
  const positions: { row: number; col: number }[] = [];
  const usedPositions = new Set<string>();
  
  // Generate positions using a simple pseudo-random algorithm based on game number
  let seed = gameNumber * 7; // Use different seed multiplier to avoid conflicts with blocked cells
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (positions.length < numMudZones) {
    const row = Math.floor(random() * 10);
    const col = Math.floor(random() * 10);
    const key = `${row},${col}`;
    
    if (!usedPositions.has(key)) {
      usedPositions.add(key);
      positions.push({ row, col });
    }
  }
  
  return positions;
};

// Check if a position is in a mud zone
export const isInMudZone = (row: number, col: number, mudZones: { row: number; col: number }[]): boolean => {
  return mudZones.some(zone => zone.row === row && zone.col === col);
};

// Process mud zone effects - reduce stuck turns and remove pieces that are no longer stuck
export const processMudZoneEffects = (stuckPieces: { [key: string]: number }): { [key: string]: number } => {
  const newStuckPieces: { [key: string]: number } = {};
  
  Object.entries(stuckPieces).forEach(([key, turnsRemaining]) => {
    if (turnsRemaining > 1) {
      newStuckPieces[key] = turnsRemaining - 1;
    }
    // If turnsRemaining === 1, the piece is no longer stuck, so we don't add it to newStuckPieces
  });
  
  return newStuckPieces;
};

// Generate blocked cell positions for different levels
export const generateBlockedCells = (gameNumber: number): { row: number; col: number }[] => {
  const isMultipleOf5 = gameNumber % 5 === 0;
  const endsWith3 = gameNumber % 10 === 3;
  const endsWith4 = gameNumber % 10 === 4;
  const endsWith5 = gameNumber % 10 === 5;
  const endsWith7 = gameNumber % 10 === 7;
  const endsWith8 = gameNumber % 10 === 8;
  const endsWith9 = gameNumber % 10 === 9;
  
  if (!isMultipleOf5 && !endsWith3 && !endsWith4 && !endsWith5 && !endsWith7 && !endsWith8 && !endsWith9) {
    return []; // No blocked cells for regular levels
  }
  
  const numBlocks = endsWith3 ? 0 : // Games ending with 3 start with no blocks (progressive system)
                   endsWith4 ? 16 : 
                   endsWith5 ? 5 : 
                   endsWith7 ? 6 : 
                   endsWith8 ? 8 : 
                   (isMultipleOf5 ? 4 : 7); // 0 for ending with 3 (progressive), 16 for ending with 4, 5 for ending with 5, 6 for ending with 7, 8 for ending with 8, 4 for other multiples of 5, 7 for ending with 9
  
  // Use game number as seed for consistent positioning per level
  const positions: { row: number; col: number }[] = [];
  const usedPositions = new Set<string>();
  
  // Generate positions using a simple pseudo-random algorithm based on game number
  let seed = gameNumber;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (positions.length < numBlocks) {
    const row = Math.floor(random() * 10);
    const col = Math.floor(random() * 10);
    const key = `${row},${col}`;
    
    if (!usedPositions.has(key)) {
      usedPositions.add(key);
      positions.push({ row, col });
    }
  }
  
  return positions;
};

// Create board with blocked cells for specific game
export const createBoardWithBlocks = (gameNumber: number, isBlindPlay: boolean = false): (0 | 1 | 2 | 3)[][] => {
  const board = Array(10).fill(null).map(() => Array(10).fill(0));
  
  // In blind play mode, don't add any blocks
  if (isBlindPlay) {
    return board;
  }
  
  const blockedCells = generateBlockedCells(gameNumber);
  
  blockedCells.forEach(({ row, col }) => {
    board[row][col] = BLOCKED_CELL;
  });
  
  return board;
};

export const getPlayerName = (player: 1 | 2): string => {
  return player === 1 ? 'Black' : 'Yellow';
};

export const getWinnerName = (winner: 1 | 2): string => {
  return getPlayerName(winner);
};

// Get time limit based on game level (following stage intervals of 200 games)
export const getTimeLimitForLevel = (gameNumber: number): number => {
  if (gameNumber >= 1 && gameNumber <= 200) {
    return 12; // The Whispering Egg: 12 seconds
  } else if (gameNumber >= 201 && gameNumber <= 400) {
    return 10; // Larva of Legends: 10 seconds
  } else if (gameNumber >= 401 && gameNumber <= 600) {
    return 9; // Chamber of Royal Nectar: 9 seconds
  } else if (gameNumber >= 601 && gameNumber <= 800) {
    return 8; // Silken Cocoon of Secrets: 8 seconds
  } else if (gameNumber >= 801 && gameNumber <= 1000) {
    return 7; // Dreams of the Pupa Realm: 7 seconds
  } else if (gameNumber >= 1001 && gameNumber <= 1200) {
    return 6; // Wings of Dawn: 6 seconds
  } else if (gameNumber >= 1201 && gameNumber <= 1400) {
    return 5; // Hive of Trials: 5 seconds
  } else if (gameNumber >= 1401 && gameNumber <= 1600) {
    return 4; // Trails of Golden Pollen: 4 seconds
  } else if (gameNumber >= 1601 && gameNumber <= 1800) {
    return 3; // Sentinel of the Hiveheart: 3 seconds
  } else if (gameNumber >= 1801 && gameNumber <= 2000) {
    return 2; // Crown of the Queen-Bee: 2 seconds
  } else {
    return 15; // Default: 15 seconds (for any levels beyond 2000)
  }
};

