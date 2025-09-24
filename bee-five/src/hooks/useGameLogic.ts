import { useState, useCallback, useEffect, useRef } from 'react';
import { checkWinCondition, isBoardFull, createEmptyBoard, createBoardWithBlocks, removeTwoBlockedCells, gameEndsWith3, gameEndsWith7Or8After1000, isMultipleOf7Between500And1000, isMultipleOf4From1000, getProgressiveBlockRules, addProgressiveBlocks, shiftAllBlocks, removeOldestPiecesOfPlayer, ageAllPieces, initializePieceAges, generateMudZones, isInMudZone, processMudZoneEffects, gameEndsWith1InSpecifiedRanges, addStrategicBlock, gameEndsWith2SpecificPattern, isMultipleOf50Match2, isMultipleOf13, enforcePieceCapacity, shouldRearrangeBoard, rearrangeBoard } from '../utils/gameLogic';

export interface GameState {
  board: (0 | 1 | 2 | 3)[][];
  currentPlayer: 1 | 2;
  isGameActive: boolean;
  winner: 0 | 1 | 2;
  timeLeft: number;
  humanMoveCount: number; // Track human moves for disappearing blocks
  pieceAges: number[][]; // Track how long pieces have been on the board
  player1MoveCount: number; // Track moves made by player 1
  player2MoveCount: number; // Track moves made by player 2
  mudZones: { row: number; col: number }[]; // Track mud zone positions
  stuckPieces: { [key: string]: number }; // Track pieces stuck in mud (key: "row,col", value: turns remaining)
  isBlindPlay: boolean; // Track if game is in blind play mode
  totalMoveCount: number; // Track total moves made in the game
}

export interface UseGameLogicOptions {
  timeLimit: number;
  startingPlayer?: 1 | 2;
  gameNumber?: number;
  currentMatch?: number;
}

export const useGameLogic = (options: UseGameLogicOptions) => {
  const { timeLimit, startingPlayer = 1, gameNumber = 1, currentMatch = 1 } = options;
  const timerRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    board: gameNumber ? createBoardWithBlocks(gameNumber, gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : createEmptyBoard(),
    currentPlayer: startingPlayer,
    isGameActive: true,
    winner: 0,
    timeLeft: timeLimit,
    humanMoveCount: 0,
    pieceAges: initializePieceAges(),
    player1MoveCount: 0,
    player2MoveCount: 0,
    mudZones: gameNumber ? generateMudZones(gameNumber) : [],
    stuckPieces: {},
    isBlindPlay: gameNumber ? (gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : false,
    totalMoveCount: 0
  });

  // Update time limit when game number changes
  useEffect(() => {
    setGameState(prevState => ({
      ...prevState,
      timeLeft: timeLimit
    }));
  }, [timeLimit]);

  // Update board when game number changes
  useEffect(() => {
    setGameState(prevState => ({
      ...prevState,
      board: gameNumber ? createBoardWithBlocks(gameNumber, gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : createEmptyBoard(),
      currentPlayer: startingPlayer,
      isGameActive: true,
      winner: 0,
      timeLeft: timeLimit,
      humanMoveCount: 0,
      pieceAges: initializePieceAges(),
      player1MoveCount: 0,
      player2MoveCount: 0,
      mudZones: gameNumber ? generateMudZones(gameNumber) : [],
      stuckPieces: {},
      isBlindPlay: gameNumber ? (gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : false,
      totalMoveCount: 0
    }));
  }, [gameNumber, startingPlayer, timeLimit, currentMatch]);


  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState.isGameActive || gameState.board[row][col] !== 0) {
      return;
    }

    // In blind play mode, also check if the cell is not in a mud zone
    if (gameState.isBlindPlay && isInMudZone(row, col, gameState.mudZones)) {
      return;
    }

    // Process mud zone effects - reduce stuck turns
    const updatedStuckPieces = processMudZoneEffects(gameState.stuckPieces);

    // Age all existing pieces (both player 1 and player 2) after each move
    let updatedPieceAges = ageAllPieces(gameState.board, gameState.pieceAges);
    
    // Place the new piece
    const newBoard = gameState.board.map(r => [...r]);
    newBoard[row][col] = gameState.currentPlayer;
    
    // Set age for the newly placed piece to 0
    updatedPieceAges[row][col] = 0;
    
    // Check if the piece was placed in a mud zone
    const pieceKey = `${row},${col}`;
    let finalStuckPieces = updatedStuckPieces;
    if (isInMudZone(row, col, gameState.mudZones)) {
      // Piece gets stuck for 1 turn
      finalStuckPieces = { ...updatedStuckPieces, [pieceKey]: 1 };
    }
    
    // Increment the current player's move count
    const newPlayer1MoveCount = gameState.currentPlayer === 1 ? gameState.player1MoveCount + 1 : gameState.player1MoveCount;
    const newPlayer2MoveCount = gameState.currentPlayer === 2 ? gameState.player2MoveCount + 1 : gameState.player2MoveCount;
    
    // Increment total move count
    const newTotalMoveCount = gameState.totalMoveCount + 1;
    
    // Handle piece capacity limitation for multiples of 13 levels (max 35 pieces)
    let finalBoard = newBoard;
    if (gameNumber && isMultipleOf13(gameNumber)) {
      // Enforce 35 piece capacity - remove oldest pieces when 36th piece is played
      let result = enforcePieceCapacity(newBoard, updatedPieceAges, 35);
      finalBoard = result.board;
      updatedPieceAges = result.pieceAges;
    }

    // Handle disappearing pieces based on individual player move counts (Adventure Game only, within specified ranges)
    if (gameNumber && (isMultipleOf7Between500And1000(gameNumber) || isMultipleOf4From1000(gameNumber))) {
      const currentPlayerMoveCount = gameState.currentPlayer === 1 ? newPlayer1MoveCount : newPlayer2MoveCount;
      
      if (currentPlayerMoveCount % 4 === 0) {
        // When a player makes their 4th move (or multiple of 4), remove 2 pieces of the opponent
        const opponent = gameState.currentPlayer === 1 ? 2 : 1;
        
        // Remove 2 oldest pieces of the opponent
        let result = removeOldestPiecesOfPlayer(finalBoard, updatedPieceAges, opponent, 2);
        
        finalBoard = result.board;
        updatedPieceAges = result.pieceAges;
      }
    }

    const winner = checkWinCondition(finalBoard, row, col, gameState.currentPlayer) ? gameState.currentPlayer : 0;
    const boardFull = isBoardFull(finalBoard);
    const newGameActive = winner === 0 && !boardFull;

    // Track human moves and handle special blocking systems
    let updatedBoard = finalBoard;
    let newHumanMoveCount = gameState.humanMoveCount;
    
    if (gameState.currentPlayer === 1) {
      // Human made a move
      newHumanMoveCount = gameState.humanMoveCount + 1;
      
      if (gameNumber && gameNumber % 10 === 4) {
        // Games ending with 4: Every 3 human moves, remove 2 blocked cells
        if (newHumanMoveCount % 3 === 0) {
          updatedBoard = removeTwoBlockedCells(finalBoard);
        }
      } else if (gameEndsWith3(gameNumber)) {
        // Games ending with 3: Progressive blocking system
        const rules = getProgressiveBlockRules(gameNumber);
        if (rules.blocksToAdd > 0 && newHumanMoveCount % rules.movesInterval === 0) {
          updatedBoard = addProgressiveBlocks(finalBoard, rules.blocksToAdd);
        }
      } else if (gameNumber && gameNumber % 50 === 0 && currentMatch === 1) {
        // First match of best-of-5 levels only (200, 250, 300, etc.): Every 8 human moves, add 1 strategic block
        if (newHumanMoveCount % 8 === 0) {
          updatedBoard = addStrategicBlock(finalBoard);
        }
      } else if (gameNumber && gameEndsWith1InSpecifiedRanges(gameNumber)) {
        // Games ending with 1 in ranges 11-191 and 1001-1591: Every 8 human moves, add 1 strategic block
        if (newHumanMoveCount % 8 === 0) {
          updatedBoard = addStrategicBlock(finalBoard);
        }
      }
    }
    
    // Handle block shifting for games ending with 7 or 8 after game 1000
    if (gameEndsWith7Or8After1000(gameNumber)) {
      // Shift all blocks one position each turn (after any move)
      updatedBoard = shiftAllBlocks(updatedBoard);
      // Note: Block shifting doesn't affect piece ages since it only moves blocks, not pieces
    }

    // Handle board rearrangement for multiples of 10 from 799-1999 (excluding multiples of 50) in match 1/3
    // Only rearrange after multiples of 23 moves
    if (gameNumber && shouldRearrangeBoard(gameNumber) && currentMatch === 1 && newTotalMoveCount % 23 === 0) {
      // Rearrange board while preserving all pieces and win conditions
      let result = rearrangeBoard(updatedBoard, updatedPieceAges);
      updatedBoard = result.board;
      updatedPieceAges = result.pieceAges;
    }

    setGameState(prevState => ({
      ...prevState,
      board: updatedBoard,
      currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
      winner,
      isGameActive: newGameActive,
      timeLeft: newGameActive ? timeLimit : prevState.timeLeft,
      humanMoveCount: newHumanMoveCount,
      pieceAges: updatedPieceAges,
      player1MoveCount: newPlayer1MoveCount,
      player2MoveCount: newPlayer2MoveCount,
      stuckPieces: finalStuckPieces,
      totalMoveCount: newTotalMoveCount
    }));
  }, [gameState.isGameActive, gameState.board, gameState.currentPlayer, gameState.humanMoveCount, gameState.player1MoveCount, gameState.player2MoveCount, gameState.mudZones, gameState.stuckPieces, gameNumber, checkWinCondition, isBoardFull, timeLimit]);

  // Reset game
  const resetGame = useCallback((newStartingPlayer?: 1 | 2) => {
    setGameState({
      board: gameNumber ? createBoardWithBlocks(gameNumber, gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : createEmptyBoard(),
      currentPlayer: newStartingPlayer || startingPlayer,
      isGameActive: true,
      winner: 0,
      timeLeft: timeLimit,
      humanMoveCount: 0,
      pieceAges: initializePieceAges(),
      player1MoveCount: 0,
      player2MoveCount: 0,
      mudZones: gameNumber ? generateMudZones(gameNumber) : [],
      stuckPieces: {},
      isBlindPlay: gameNumber ? (gameEndsWith2SpecificPattern(gameNumber) || isMultipleOf50Match2(gameNumber, currentMatch)) : false,
      totalMoveCount: 0
    });
  }, [timeLimit, startingPlayer, gameNumber, currentMatch]);

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