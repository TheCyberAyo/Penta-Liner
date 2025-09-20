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

// Generate blocked cell positions for different levels
export const generateBlockedCells = (gameNumber: number): { row: number; col: number }[] => {
  const isMultipleOf5 = gameNumber % 5 === 0;
  const endsWith9 = gameNumber % 10 === 9;
  
  if (!isMultipleOf5 && !endsWith9) {
    return []; // No blocked cells for regular levels
  }
  
  const numBlocks = isMultipleOf5 ? 4 : 7; // 4 for multiples of 5, 7 for ending with 9
  
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
export const createBoardWithBlocks = (gameNumber: number): (0 | 1 | 2 | 3)[][] => {
  const board = Array(10).fill(null).map(() => Array(10).fill(0));
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

// Get time limit based on game level
export const getTimeLimitForLevel = (gameNumber: number): number => {
  if (gameNumber >= 100 && gameNumber <= 199) {
    return 12; // 100-199: 12 seconds
  } else if (gameNumber >= 200 && gameNumber <= 299) {
    return 10; // 200-299: 10 seconds
  } else if (gameNumber >= 300 && gameNumber <= 399) {
    return 9; // 300-399: 9 seconds
  } else if (gameNumber >= 400 && gameNumber <= 499) {
    return 8; // 400-499: 8 seconds
  } else if (gameNumber >= 500 && gameNumber <= 599) {
    return 7; // 500-599: 7 seconds
  } else if (gameNumber >= 600 && gameNumber <= 699) {
    return 6; // 600-699: 6 seconds
  } else if (gameNumber >= 700 && gameNumber <= 799) {
    return 4; // 700-799: 4 seconds
  } else if (gameNumber >= 800 && gameNumber <= 899) {
    return 3; // 800-899: 3 seconds
  } else if (gameNumber >= 900 && gameNumber <= 999) {
    return 2; // 900-999: 2 seconds
  } else {
    return 15; // Default: 15 seconds (levels 1-99)
  }
};
