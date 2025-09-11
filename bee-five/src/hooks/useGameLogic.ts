import { useState, useCallback, useEffect, useRef } from 'react';

export interface GameState {
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  isGameActive: boolean;
  winner: 0 | 1 | 2;
  timeLeft: number;
}

export interface UseGameLogicOptions {
  isSinglePlayer: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

export const useGameLogic = (options: UseGameLogicOptions) => {
  const { isSinglePlayer, difficulty, timeLimit } = options;
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

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

  // Initialize Web Worker
  useEffect(() => {
    if (isSinglePlayer) {
      workerRef.current = new Worker('/aiWorker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, move, computationTime } = e.data;
        
        if (type === 'bestMoveFound' && move) {
          console.log(`AI computed move in ${computationTime.toFixed(2)}ms`);
          
          // Apply AI move
          setGameState(prevState => {
            const newBoard = prevState.board.map(row => [...row]);
            newBoard[move.row][move.col] = 2; // AI is player 2
            
            const winner = checkWinCondition(newBoard, move.row, move.col, 2);
            
            return {
              ...prevState,
              board: newBoard,
              currentPlayer: winner ? prevState.currentPlayer : 1,
              winner: winner ? 2 : 0,
              isGameActive: !winner && !isBoardFull(newBoard),
              timeLeft: timeLimit
            };
          });
        }
        
        if (type === 'error') {
          console.error('AI Worker error:', e.data.message);
          // Fallback to random move
          makeRandomMove();
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        makeRandomMove();
      };
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [isSinglePlayer]);

  // Timer management
  useEffect(() => {
    if (gameState.isGameActive && gameState.timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
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

  // Make random move (fallback)
  const makeRandomMove = useCallback(() => {
    setGameState(prevState => {
      const emptyCells: { row: number; col: number }[] = [];
      
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (prevState.board[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }
      
      if (emptyCells.length === 0) return prevState;
      
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newBoard = prevState.board.map(row => [...row]);
      newBoard[randomCell.row][randomCell.col] = 2;
      
      const winner = checkWinCondition(newBoard, randomCell.row, randomCell.col, 2);
      
      return {
        ...prevState,
        board: newBoard,
        currentPlayer: winner ? prevState.currentPlayer : 1,
        winner: winner ? 2 : 0,
        isGameActive: !winner && !isBoardFull(newBoard),
        timeLeft: timeLimit
      };
    });
  }, [checkWinCondition, isBoardFull, timeLimit]);

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

      const newState = {
        ...prevState,
        board: newBoard,
        currentPlayer: winner || boardFull ? prevState.currentPlayer : (prevState.currentPlayer === 1 ? 2 : 1) as 1 | 2,
        winner: (winner ? prevState.currentPlayer : 0) as 0 | 1 | 2,
        isGameActive: !winner && !boardFull,
        timeLeft: timeLimit
      };

      // Trigger AI move if it's single player and game is still active
      if (isSinglePlayer && !winner && !boardFull && newState.currentPlayer === 2) {
        // Use Web Worker for AI move
        setTimeout(() => {
          if (workerRef.current) {
            const requestId = ++requestIdRef.current;
            workerRef.current.postMessage({
              type: 'findBestMove',
              board: newBoard,
              difficulty,
              id: requestId
            });
          } else {
            makeRandomMove();
          }
        }, 500); // Small delay for better UX
      }

      return newState;
    });
  }, [gameState.isGameActive, gameState.board, checkWinCondition, isBoardFull, isSinglePlayer, difficulty, makeRandomMove, timeLimit]);

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
