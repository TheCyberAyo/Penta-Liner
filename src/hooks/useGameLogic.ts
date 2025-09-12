import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState } from '../components/GameCanvas';

export interface UseGameLogicOptions {
  timeLimit: number;
}

export const useGameLogic = (options: UseGameLogicOptions) => {
  const { timeLimit } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize empty board
  const createEmptyBoard = (): (0 | 1 | 2)[][] => {
    return Array(10).fill(null).map(() => Array(10).fill(0));
  };

  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: 1,
    isGameActive: true,
    winner: 0,
    timeLeft: timeLimit
  });

  // Timer management
  useEffect(() => {
    if (gameState.isGameActive && gameState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setGameState(prevState => {
          if (prevState.timeLeft <= 1) {
            // Time's up - other player wins
            const winner = prevState.currentPlayer === 1 ? 2 : 1;
            return {
              ...prevState,
              timeLeft: 0,
              winner,
              isGameActive: false
            };
          }
          return {
            ...prevState,
            timeLeft: prevState.timeLeft - 1
          };
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

  // Check win condition
  const checkWinCondition = useCallback((board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
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
  }, []);

  // Check if board is full
  const isBoardFull = useCallback((board: (0 | 1 | 2)[][]): boolean => {
    return board.every(row => row.every(cell => cell !== 0));
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState.isGameActive || gameState.board[row][col] !== 0) {
      return;
    }

    setGameState(prevState => {
      const newBoard = prevState.board.map(row => [...row]);
      newBoard[row][col] = prevState.currentPlayer;

      const winner = checkWinCondition(newBoard, row, col, prevState.currentPlayer);
      const boardFull = isBoardFull(newBoard);

      return {
        ...prevState,
        board: newBoard,
        currentPlayer: winner || boardFull ? prevState.currentPlayer : (prevState.currentPlayer === 1 ? 2 : 1) as 1 | 2,
        winner: winner ? prevState.currentPlayer : 0,
        isGameActive: !winner && !boardFull,
        timeLeft: timeLimit
      };
    });
  }, [gameState.isGameActive, gameState.board, checkWinCondition, isBoardFull, timeLimit]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      board: createEmptyBoard(),
      currentPlayer: 1,
      isGameActive: true,
      winner: 0,
      timeLeft: timeLimit
    });
  }, [timeLimit]);

  // Update game state (for external updates)
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prevState => ({ ...prevState, ...updates }));
  }, []);

  return {
    gameState,
    handleCellClick,
    resetGame,
    updateGameState
  };
};