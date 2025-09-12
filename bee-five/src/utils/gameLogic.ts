// Shared game logic utilities to avoid duplication

export const checkWinCondition = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
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

export const isBoardFull = (board: (0 | 1 | 2)[][]): boolean => {
  return board.every(row => row.every(cell => cell !== 0));
};

export const createEmptyBoard = (): (0 | 1 | 2)[][] => {
  return Array(10).fill(null).map(() => Array(10).fill(0));
};

export const getPlayerName = (player: 1 | 2): string => {
  return player === 1 ? 'Black' : 'Yellow';
};

export const getWinnerName = (winner: 1 | 2): string => {
  return getPlayerName(winner);
};
