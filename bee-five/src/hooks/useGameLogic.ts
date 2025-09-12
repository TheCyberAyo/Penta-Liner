import { useState, useCallback, useEffect, useRef } from 'react';
import { checkWinCondition, isBoardFull, createEmptyBoard } from '../utils/gameLogic';

export interface GameState {
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  isGameActive: boolean;
  winner: 0 | 1 | 2;
  timeLeft: number;
}

export interface UseGameLogicOptions {
  timeLimit: number;
}

export const useGameLogic = (options: UseGameLogicOptions) => {
  const { timeLimit } = options;
  const timerRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPlayer: 1,
    isGameActive: true,
    winner: 0,
    timeLeft: timeLimit
  });


  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState.isGameActive || gameState.board[row][col] !== 0) {
      return;
    }

    const newBoard = gameState.board.map(r => [...r]);
    newBoard[row][col] = gameState.currentPlayer;

    const winner = checkWinCondition(newBoard, row, col, gameState.currentPlayer) ? gameState.currentPlayer : 0;
    const boardFull = isBoardFull(newBoard);
    const newGameActive = winner === 0 && !boardFull;

    setGameState(prevState => ({
      ...prevState,
      board: newBoard,
      currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
      winner,
      isGameActive: newGameActive,
      timeLeft: newGameActive ? timeLimit : prevState.timeLeft
    }));
  }, [gameState.isGameActive, gameState.board, gameState.currentPlayer, checkWinCondition, isBoardFull, timeLimit]);

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
  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prevState => ({
      ...prevState,
      ...newState
    }));
  }, []);

  // Timer effect
  useEffect(() => {
    if (!gameState.isGameActive || gameState.winner > 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setGameState(prevState => {
        if (prevState.timeLeft <= 1) {
          // Time's up - current player loses
          return {
            ...prevState,
            timeLeft: 0,
            isGameActive: false,
            winner: prevState.currentPlayer === 1 ? 2 : 1
          };
        }
        return {
          ...prevState,
          timeLeft: prevState.timeLeft - 1
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.isGameActive, gameState.winner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    handleCellClick,
    resetGame,
    updateGameState
  };
};