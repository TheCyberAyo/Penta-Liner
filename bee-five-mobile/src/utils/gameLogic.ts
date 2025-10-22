// Shared game logic utilities to avoid duplication

export const checkWinCondition = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): boolean => {
  const winningPieces = getWinningPieces(board, row, col, player);
  return winningPieces.length >= 5;
};

export const getWinningPieces = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): { row: number; col: number }[] => {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
  ];

  for (const [dx, dy] of directions) {
    const winningPieces: { row: number; col: number }[] = [];
    
    // Start with the current piece
    winningPieces.push({ row, col });

    // Check in positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        winningPieces.push({ row: newRow, col: newCol });
      } else {
        break;
      }
    }

    // Check in negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        winningPieces.unshift({ row: newRow, col: newCol });
      } else {
        break;
      }
    }

    if (winningPieces.length >= 5) {
      return winningPieces;
    }
  }

  return [];
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

// Check if a game number ends with 5 (for 5 blocked cells) - only from level 100 onwards
export const gameEndsWith5 = (gameNumber: number): boolean => {
  return gameNumber >= 100 && gameNumber % 10 === 5;
};

// Check if a game number ends with 4 (for disappearing blocks) - only from level 400 onwards
export const gameEndsWith4 = (gameNumber: number): boolean => {
  return gameNumber >= 400 && gameNumber % 10 === 4;
};

// Check if a game number ends with 7 and is after game 250 (for shifting blocks)
export const gameEndsWith7After250 = (gameNumber: number): boolean => {
  return gameNumber > 250 && gameNumber % 10 === 7;
};

// Check if a game number ends with 8 and is after game 600 (for shifting blocks)
export const gameEndsWith8After600 = (gameNumber: number): boolean => {
  return gameNumber > 600 && gameNumber % 10 === 8;
};

// Check if a game number is a multiple of 7 between 500-1000 (for disappearing pieces after 4 turns)
export const isMultipleOf7Between500And1000 = (gameNumber: number): boolean => {
  return gameNumber >= 500 && gameNumber <= 1000 && gameNumber % 7 === 0;
};

// Check if a game number is a multiple of 4 from game 1000 onwards (for disappearing pieces after 3 moves)
export const isMultipleOf4From1000 = (gameNumber: number): boolean => {
  return gameNumber >= 1000 && gameNumber % 4 === 0;
};

// Check if a game number is a multiple of 40 (for enhanced mud zones with 5 zones)
export const isMultipleOf40 = (gameNumber: number): boolean => {
  return gameNumber % 40 === 0;
};

// Check if a game number is a multiple of 200 (for mud zones)
export const isMultipleOf200 = (gameNumber: number): boolean => {
  return gameNumber % 200 === 0;
};

// Check if a game number follows the specific pattern (42, 92, 142, 192, etc.)
export const gameEndsWith2SpecificPattern = (gameNumber: number): boolean => {
  if (gameNumber < 42) {
    return false;
  }
  return (gameNumber - 42) % 50 === 0;
};

// Determine the starting player for adventure games based on game number patterns
export const getAdventureStartingPlayer = (gameNumber: number): 1 | 2 => {
  if (gameNumber % 10 === 1) {
    return 2; // AI starts first
  }
  
  const lastDigit = gameNumber % 10;
  if (lastDigit >= 3 && lastDigit <= 9) {
    if ((lastDigit === 3 && gameNumber > 50) ||
        (lastDigit === 4 && gameNumber >= 400) ||
        (lastDigit === 5 && gameNumber >= 100) ||
        (lastDigit === 7 && gameNumber >= 27) ||
        (lastDigit === 8 && gameNumber >= 600) ||
        (lastDigit === 9 && gameNumber >= 50)) {
      return 2; // AI starts first
    }
  }
  
  return 1; // Human goes first
};

// Check if a game number is a multiple of 50 and in match 2/5 (for blind play mode)
export const isMultipleOf50Match2 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber % 50 === 0 && currentMatch === 2;
};

// Check if a game number is a multiple of 50 and in match 3/5 (for board rearrangement every 21 moves)
export const isMultipleOf50Match3 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber % 50 === 0 && currentMatch === 3;
};

// Check if a game number is a multiple of 50 and in match 4/5 (for piece swapping every 15 moves)
export const isMultipleOf50Match4 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber % 50 === 0 && currentMatch === 4;
};

// Check if a game number is a multiple of 17 (for piece capacity limitation)
export const isMultipleOf17 = (gameNumber: number): boolean => {
  return gameNumber % 17 === 0;
};

// Check if a game number is a multiple of 10 (excluding multiples of 50) from game 60 in match 1/3 (for 5 blocked cells)
export const isMultipleOf10Match1From60 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber >= 60 && 
         gameNumber % 10 === 0 && 
         gameNumber % 50 !== 0 && 
         currentMatch === 1;
};

// Check if a game number is a multiple of 10 (excluding multiples of 50) from game 110 in match 1/3 (for blind play after 21 moves)
export const isMultipleOf10Match1From110 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber >= 110 && 
         gameNumber % 10 === 0 && 
         gameNumber % 50 !== 0 && 
         currentMatch === 1;
};

// Check if a game number is a multiple of 10 (excluding multiples of 50) from game 810 in match 1/3 (for blind play after 17 moves)
export const isMultipleOf10Match1From810 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber >= 810 && 
         gameNumber % 10 === 0 && 
         gameNumber % 50 !== 0 && 
         currentMatch === 1;
};

// Check if a game number is a multiple of 10 (excluding multiples of 50) from game 30 in match 2/3 (for piece swapping every 17 moves)
export const isMultipleOf10Match2From30 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber >= 30 && 
         gameNumber % 10 === 0 && 
         gameNumber % 50 !== 0 && 
         currentMatch === 2;
};

// Check if a game number is a multiple of 10 (excluding multiples of 50) from game 1200 in match 2/3 (for piece swapping every 15 moves)
export const isMultipleOf10Match2From1200 = (gameNumber: number, currentMatch: number): boolean => {
  return gameNumber >= 1200 && 
         gameNumber % 10 === 0 && 
         gameNumber % 50 !== 0 && 
         currentMatch === 2;
};

// Check if a game number ends with 1 and is level 200+ (for human player blocking)
export const gameEndsWith1After200 = (gameNumber: number): boolean => {
  if (gameNumber < 200 || gameNumber % 10 !== 1) {
    return false;
  }
  
  const seriesStart = Math.floor((gameNumber - 200) / 50) * 50 + 200;
  const positionInSeries = gameNumber - seriesStart;
  
  if (positionInSeries >= 0 && positionInSeries <= 4) {
    return false;
  }
  
  return true;
};

// Check if a game number is the first game of a 5-match series (200, 250, 300, etc)
export const isFirstGameOfFiveMatchSeries = (gameNumber: number): boolean => {
  return gameNumber >= 200 && (gameNumber - 200) % 50 === 0;
};

// Check if a game number ends with 1 and is in the specified ranges (500-700, 1001-1591)
export const gameEndsWith1InSpecifiedRanges = (gameNumber: number): boolean => {
  if (gameNumber % 10 !== 1) {
    return false;
  }
  
  if ((gameNumber >= 500 && gameNumber <= 700) ||
      (gameNumber >= 1001 && gameNumber <= 1591)) {
    return true;
  }
  
  return false;
};

// Get progressive blocking rules for games ending with 3
export const getProgressiveBlockRules = (gameNumber: number): { blocksToAdd: number; movesInterval: number } => {
  if (gameNumber >= 50 && gameNumber <= 200) {
    return { blocksToAdd: 1, movesInterval: 5 };
  } else if (gameNumber >= 201 && gameNumber <= 399) {
    return { blocksToAdd: 1, movesInterval: 4 };
  } else if (gameNumber >= 400 && gameNumber <= 599) {
    return { blocksToAdd: 2, movesInterval: 5 };
  } else if (gameNumber >= 600 && gameNumber <= 799) {
    return { blocksToAdd: 2, movesInterval: 4 };
  } else if (gameNumber >= 800) {
    return { blocksToAdd: 2, movesInterval: 3 };
  }
  return { blocksToAdd: 0, movesInterval: 0 };
};

// Add progressive blocks to the board (for games ending with 3)
export const addProgressiveBlocks = (board: (0 | 1 | 2 | 3)[][], blocksToAdd: number): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const emptyPositions: { row: number; col: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === 0) {
        emptyPositions.push({ row, col });
      }
    }
  }
  
  const blocksToPlace = Math.min(blocksToAdd, emptyPositions.length);
  for (let i = 0; i < blocksToPlace; i++) {
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const { row, col } = emptyPositions[randomIndex];
    newBoard[row][col] = BLOCKED_CELL;
    emptyPositions.splice(randomIndex, 1);
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
  
  for (const pos of emptyPositions) {
    let priority = 0;
    priority += checkBlockingValue(board, pos.row, pos.col, 1);
    priority += checkProximityValue(board, pos.row, pos.col, 1);
    priority += checkBlockingValue(board, pos.row, pos.col, 2);
    strategicPositions.push({ ...pos, priority });
  }
  
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
    
    for (let i = -4; i <= 4; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === player) {
          count++;
        } else if (board[newRow][newCol] !== 0) {
          break;
        }
      }
    }
    
    if (count >= 2) {
      value += count * 10;
    }
  }
  
  return value;
};

// Check proximity value - positions closer to human pieces are more valuable to block
const checkProximityValue = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): number => {
  let value = 0;
  
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && 
          board[newRow][newCol] === player) {
        const distance = Math.abs(dr) + Math.abs(dc);
        value += Math.max(0, 5 - distance);
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

// Move one random block to a strategic position to block the human player (for games ending with 9 from game 400)
export const moveRandomBlockToStrategicPosition = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const blockedPositions: { row: number; col: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === BLOCKED_CELL) {
        blockedPositions.push({ row, col });
      }
    }
  }
  
  if (blockedPositions.length === 0) {
    return newBoard;
  }
  
  const randomBlockIndex = Math.floor(Math.random() * blockedPositions.length);
  const { row: oldRow, col: oldCol } = blockedPositions[randomBlockIndex];
  
  newBoard[oldRow][oldCol] = 0;
  
  const strategicPosition = findStrategicBlockPosition(newBoard);
  
  if (strategicPosition && newBoard[strategicPosition.row][strategicPosition.col] === 0) {
    newBoard[strategicPosition.row][strategicPosition.col] = BLOCKED_CELL;
  } else {
    const emptyPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (newBoard[row][col] === 0) {
          emptyPositions.push({ row, col });
        }
      }
    }
    
    if (emptyPositions.length > 0) {
      const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      newBoard[randomPosition.row][randomPosition.col] = BLOCKED_CELL;
    }
  }
  
  return newBoard;
};

// Shift all blocks one position each turn (for games ending with 7 or 8 after game 250)
export const shiftAllBlocks = (board: (0 | 1 | 2 | 3)[][]): (0 | 1 | 2 | 3)[][] => {
  const newBoard = board.map(row => [...row]);
  const blockedPositions: { row: number; col: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === BLOCKED_CELL) {
        blockedPositions.push({ row, col });
      }
    }
  }
  
  blockedPositions.forEach(({ row, col }) => {
    newBoard[row][col] = 0;
  });
  
  blockedPositions.forEach(({ row, col }) => {
    let newRow = row;
    let newCol = col + 1;
    
    if (newCol >= 10) {
      newRow = (row + 1) % 10;
      newCol = 0;
    }
    
    if (newBoard[newRow][newCol] === 0) {
      newBoard[newRow][newCol] = BLOCKED_CELL;
    } else {
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
  
  piecesToRemove.sort((a, b) => b.age - a.age);
  
  piecesToRemove.forEach(({ row, col }) => {
    newBoard[row][col] = 0;
    newPieceAges[row][col] = 0;
  });
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Age all pieces (both player 1 and player 2) by 1 turn
export const ageAllPieces = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): number[][] => {
  const newPieceAges = pieceAges.map(row => [...row]);
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === 1 || board[row][col] === 2) {
        newPieceAges[row][col] = (newPieceAges[row][col] || 0) + 1;
      } else {
        newPieceAges[row][col] = 0;
      }
    }
  }
  
  return newPieceAges;
};

// Remove oldest pieces of a specific player based on move count
export const removeOldestPiecesOfPlayer = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], player: 1 | 2, piecesToRemove: number = 1): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
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
  
  playerPieces.sort((a, b) => b.age - a.age);
  
  const piecesToActuallyRemove = Math.min(piecesToRemove, playerPieces.length);
  for (let i = 0; i < piecesToActuallyRemove; i++) {
    const { row, col } = playerPieces[i];
    newBoard[row][col] = 0;
    newPieceAges[row][col] = 0;
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Remove pieces of a specific player that have reached a specific age
export const removePiecesByAge = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][], player: 1 | 2, targetAge: number): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === player && newPieceAges[row][col] === targetAge) {
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
  
  piecesToRemoveList.sort((a, b) => b.age - a.age);
  
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  for (let i = 0; i < piecesToRemove && i < piecesToRemoveList.length; i++) {
    const { row, col } = piecesToRemoveList[i];
    newBoard[row][col] = 0;
    newPieceAges[row][col] = 0;
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Rearrange board while preserving all pieces and win conditions
export const rearrangeBoard = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = Array(10).fill(null).map(() => Array(10).fill(0));
  const newPieceAges = Array(10).fill(null).map(() => Array(10).fill(0));
  
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
  
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  
  pieces.forEach((piece, index) => {
    const newRow = Math.floor(index / 10);
    const newCol = index % 10;
    newBoard[newRow][newCol] = piece.value;
    newPieceAges[newRow][newCol] = piece.age;
  });
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Swap AI pieces with human pieces for Game 50, Match 4/5
export const swapOpponentPiecePairs = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  const player1Pieces: { row: number; col: number }[] = [];
  const player2Pieces: { row: number; col: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === 1) {
        player1Pieces.push({ row, col });
      } else if (newBoard[row][col] === 2) {
        player2Pieces.push({ row, col });
      }
    }
  }
  
  if (player1Pieces.length < 2 || player2Pieces.length < 2) {
    return { board: newBoard, pieceAges: newPieceAges };
  }
  
  for (let swap = 0; swap < 2; swap++) {
    const player1Index = Math.floor(Math.random() * player1Pieces.length);
    const player2Index = Math.floor(Math.random() * player2Pieces.length);
    
    const player1Piece = player1Pieces[player1Index];
    const player2Piece = player2Pieces[player2Index];
    
    const player1Value = newBoard[player1Piece.row][player1Piece.col];
    const player2Value = newBoard[player2Piece.row][player2Piece.col];
    const player1Age = newPieceAges[player1Piece.row][player1Piece.col];
    const player2Age = newPieceAges[player2Piece.row][player2Piece.col];
    
    newBoard[player1Piece.row][player1Piece.col] = player2Value;
    newBoard[player2Piece.row][player2Piece.col] = player1Value;
    newPieceAges[player1Piece.row][player1Piece.col] = player2Age;
    newPieceAges[player2Piece.row][player2Piece.col] = player1Age;
    
    player1Pieces.splice(player1Index, 1);
    player2Pieces.splice(player2Index, 1);
    
    if (player1Pieces.length === 0 || player2Pieces.length === 0) {
      break;
    }
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Swap 3 random pairs of AI and human pieces for Game 1200+ Match 2/3
export const swapThreeOpponentPiecePairs = (board: (0 | 1 | 2 | 3)[][], pieceAges: number[][]): { board: (0 | 1 | 2 | 3)[][]; pieceAges: number[][] } => {
  const newBoard = board.map(row => [...row]);
  const newPieceAges = pieceAges.map(row => [...row]);
  
  const player1Pieces: { row: number; col: number }[] = [];
  const player2Pieces: { row: number; col: number }[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (newBoard[row][col] === 1) {
        player1Pieces.push({ row, col });
      } else if (newBoard[row][col] === 2) {
        player2Pieces.push({ row, col });
      }
    }
  }
  
  if (player1Pieces.length < 3 || player2Pieces.length < 3) {
    return { board: newBoard, pieceAges: newPieceAges };
  }
  
  for (let swap = 0; swap < 3; swap++) {
    const player1Index = Math.floor(Math.random() * player1Pieces.length);
    const player2Index = Math.floor(Math.random() * player2Pieces.length);
    
    const player1Piece = player1Pieces[player1Index];
    const player2Piece = player2Pieces[player2Index];
    
    const player1Value = newBoard[player1Piece.row][player1Piece.col];
    const player2Value = newBoard[player2Piece.row][player2Piece.col];
    const player1Age = newPieceAges[player1Piece.row][player1Piece.col];
    const player2Age = newPieceAges[player2Piece.row][player2Piece.col];
    
    newBoard[player1Piece.row][player1Piece.col] = player2Value;
    newBoard[player2Piece.row][player2Piece.col] = player1Value;
    newPieceAges[player1Piece.row][player1Piece.col] = player2Age;
    newPieceAges[player2Piece.row][player2Piece.col] = player1Age;
    
    player1Pieces.splice(player1Index, 1);
    player2Pieces.splice(player2Index, 1);
    
    if (player1Pieces.length === 0 || player2Pieces.length === 0) {
      break;
    }
  }
  
  return { board: newBoard, pieceAges: newPieceAges };
};

// Generate mud zone positions for multiples of 200 games only
export const generateMudZones = (gameNumber: number): { row: number; col: number }[] => {
  if (!isMultipleOf200(gameNumber)) {
    return [];
  }
  
  const numMudZones = 5;
  const positions: { row: number; col: number }[] = [];
  const usedPositions = new Set<string>();
  
  let seed = gameNumber * 7;
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
  });
  
  return newStuckPieces;
};

// Generate blocked cell positions for different levels
export const generateBlockedCells = (gameNumber: number, currentMatch: number = 1): { row: number; col: number }[] => {
  const isMultipleOf5 = gameNumber % 5 === 0;
  const endsWith3 = gameNumber % 10 === 3;
  const endsWith4 = gameEndsWith4(gameNumber);
  const endsWith5 = gameEndsWith5(gameNumber);
  const endsWith7 = gameNumber % 10 === 7 && gameNumber >= 27;
  const endsWith8 = gameNumber % 10 === 8 && gameNumber >= 38;
  const endsWith9 = gameNumber % 10 === 9 && gameNumber >= 50;
  const multipleOf10Match1From60 = isMultipleOf10Match1From60(gameNumber, currentMatch);
  
  if (!isMultipleOf5 && !endsWith3 && !endsWith4 && !endsWith5 && !endsWith7 && !endsWith8 && !endsWith9 && !multipleOf10Match1From60) {
    return [];
  }
  
  const numBlocks = endsWith3 ? 0 :
                   endsWith4 ? 16 : 
                   endsWith5 ? 5 : 
                   endsWith7 ? 6 : 
                   endsWith8 ? 8 : 
                   endsWith9 ? 10 :
                   multipleOf10Match1From60 ? 5 :
                   (isMultipleOf5 ? 4 : 7);
  
  const positions: { row: number; col: number }[] = [];
  const usedPositions = new Set<string>();
  
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
export const createBoardWithBlocks = (gameNumber: number, isBlindPlay: boolean = false, currentMatch: number = 1): (0 | 1 | 2 | 3)[][] => {
  const board = Array(10).fill(null).map(() => Array(10).fill(0));
  
  if (isBlindPlay) {
    return board;
  }
  
  const blockedCells = generateBlockedCells(gameNumber, currentMatch);
  
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
    return 12;
  } else if (gameNumber >= 201 && gameNumber <= 400) {
    return 10;
  } else if (gameNumber >= 401 && gameNumber <= 600) {
    return 9;
  } else if (gameNumber >= 601 && gameNumber <= 800) {
    return 8;
  } else if (gameNumber >= 801 && gameNumber <= 1000) {
    return 7;
  } else if (gameNumber >= 1001 && gameNumber <= 1200) {
    return 6;
  } else if (gameNumber >= 1201 && gameNumber <= 1400) {
    return 5;
  } else if (gameNumber >= 1401 && gameNumber <= 1600) {
    return 4;
  } else if (gameNumber >= 1601 && gameNumber <= 1800) {
    return 3;
  } else if (gameNumber >= 1801 && gameNumber <= 2000) {
    return 2;
  } else {
    return 15;
  }
};
