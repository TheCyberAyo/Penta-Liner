import React, { useState, useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import BeeAdventureMap from './BeeAdventureMap';
import { soundManager } from '../utils/sounds';
import { getTimeLimitForLevel, isInMudZone, checkWinCondition, getAdventureStartingPlayer } from '../utils/gameLogic';
import { useTheme } from '../hooks/useTheme';
import BeeLifeStageEffects from './BeeLifeStageEffects';

interface AdventureGameProps {
  onBackToMenu: () => void;
}

const ADVENTURE_STAGES = [
  {
    name: "The Whispering Egg",
    description: "The prophecy of a hero is laid within a golden cell.",
    games: 1
  },
  {
    name: "Larva of Legends", 
    description: "A tiny creature begins its fabled journey of growth.",
    games: 201
  },
  {
    name: "Chamber of Royal Nectar",
    description: "A mystical hall where power and destiny are forged.",
    games: 401
  },
  {
    name: "Silken Cocoon of Secrets",
    description: "Spinning a magical shell to transform.",
    games: 601
  },
  {
    name: "Dreams of the Pupa Realm",
    description: "Visions of wings and future battles stir inside.",
    games: 801
  },
  {
    name: "Wings of Dawn",
    description: "Breaking free and taking the first heroic flight.",
    games: 1001
  },
  {
    name: "Hive of Trials",
    description: "Training in ancient duties and learning hidden arts.",
    games: 1201
  },
  {
    name: "Trails of Golden Pollen",
    description: "Quests across wildflower kingdoms to gather treasure.",
    games: 1401
  },
  {
    name: "Sentinel of the Hiveheart",
    description: "Standing guard against dark invaders.",
    games: 1601
  },
  {
    name: "Crown of the Queen-Bee",
    description: "Ascend the throne, lead the swarm, or begin a new dynasty.",
    games: 1801
  }
];

const AdventureGame: React.FC<AdventureGameProps> = ({ onBackToMenu }) => {
  const [currentGame, setCurrentGame] = useState(1);
  const [gamesWon, setGamesWon] = useState(0);
  const [gamesCompleted, setGamesCompleted] = useState<number[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  
  const [currentMatch, setCurrentMatch] = useState(1);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState(0);
  const [isWaitingForNextGame, setIsWaitingForNextGame] = useState(false);
  const [gameProcessed, setGameProcessed] = useState(false);
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit: getTimeLimitForLevel(currentGame),
    gameNumber: currentGame,
    currentMatch: currentMatch,
    startingPlayer: getAdventureStartingPlayer(currentGame)
  });

  const { currentTheme } = useTheme({ gameNumber: currentGame });
  const isMultipleOf10 = (gameNumber: number): boolean => {
    return gameNumber % 10 === 0;
  };

  const isMultipleOf50 = (gameNumber: number): boolean => {
    return gameNumber % 50 === 0;
  };

  const requiresMatchSystem = (gameNumber: number): boolean => {
    return isMultipleOf10(gameNumber) || isMultipleOf50(gameNumber);
  };

  const getMatchType = (gameNumber: number): 'best-of-3' | 'best-of-5' | 'single' => {
    if (isMultipleOf50(gameNumber)) {
      return 'best-of-5';
    } else if (isMultipleOf10(gameNumber)) {
      return 'best-of-3';
    }
    return 'single';
  };

  const getRequiredWins = (gameNumber: number): number => {
    const matchType = getMatchType(gameNumber);
    switch (matchType) {
      case 'best-of-3': return 2;
      case 'best-of-5': return 3;
      default: return 1;
    }
  };

  const getTotalGames = (gameNumber: number): number => {
    const matchType = getMatchType(gameNumber);
    switch (matchType) {
      case 'best-of-3': return 3;
      case 'best-of-5': return 5;
      default: return 1;
    }
  };

  const getMatchGridColor = (gameNumber: number, matchNumber: number): string => {
    if (!requiresMatchSystem(gameNumber)) {
      return '#87CEEB';
    }

    const matchType = getMatchType(gameNumber);
    
    if (matchType === 'best-of-3') {
      switch (matchNumber) {
        case 1: return '#FFFFFF';
        case 2: return '#FFA500';
        case 3: return '#87CEEB';
        default: return '#87CEEB';
      }
    } else if (matchType === 'best-of-5') {
      switch (matchNumber) {
        case 1: return '#FFFFFF';
        case 2: return '#FFA500';
        case 3: return '#FF0000';
        case 4: return '#00FF00';
        case 5: return '#87CEEB';
        default: return '#87CEEB';
      }
    }
    
    return '#87CEEB';
  };

  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  React.useEffect(() => {
    setGamesWon(0);
    setPlayerWins(0);
    setAiWins(0);
    setGameProcessed(false);
  }, []);

   React.useEffect(() => {
     if (isWaitingForNextGame && countdownTimer > 0) {
       const timer = setTimeout(() => {
         setCountdownTimer(prev => prev - 1);
       }, 1000);
       return () => clearTimeout(timer);
     } else if (isWaitingForNextGame && countdownTimer === 0) {
       setIsWaitingForNextGame(false);
       setCurrentMatch(prev => prev + 1);
       setGameProcessed(false);
       resetGame();
     }
   }, [isWaitingForNextGame, countdownTimer, resetGame, currentGame, currentMatch, playerWins, aiWins]);

  useEffect(() => {
    const stageIndex = Math.floor((currentGame - 1) / 200);
    if (stageIndex !== currentStage && stageIndex < ADVENTURE_STAGES.length) {
      setCurrentStage(stageIndex);
      setShowStageTransition(true);
    }
  }, [currentGame, currentStage]);

  React.useEffect(() => {
    if (gameState.winner > 0 && !gameProcessed) {
      setGameProcessed(true);
      
      if (gameState.winner === 1) {
        soundManager.playVictorySound();
      } else {
        soundManager.playDefeatSound();
      }
      
       if (requiresMatchSystem(currentGame)) {
         const newPlayerWins = gameState.winner === 1 ? playerWins + 1 : playerWins;
         const newAiWins = gameState.winner === 2 ? aiWins + 1 : aiWins;
         
         if (gameState.winner === 1) {
           setPlayerWins(prev => prev + 1);
         } else {
           setAiWins(prev => prev + 1);
         }
         
         const requiredWins = getRequiredWins(currentGame);
         const totalGames = getTotalGames(currentGame);
         
         if (newPlayerWins >= requiredWins || newAiWins >= requiredWins || (currentMatch >= totalGames)) {
           setIsMatchComplete(true);
           
           if (newPlayerWins >= requiredWins) {
             setGamesWon(prev => prev + 1);
             
            // Match victory message removed
           } else {
            // Match defeat message removed
           }
           
           setGamesCompleted(prev => {
             if (!prev.includes(currentGame)) {
               return [...prev, currentGame];
             }
             return prev;
           });
           
           setTimeout(() => {
             const nextGame = currentGame + 1;
             setCurrentGame(nextGame);
             setCurrentMatch(1);
             setPlayerWins(0);
             setAiWins(0);
             setIsMatchComplete(false);
             setCountdownTimer(0);
             setIsWaitingForNextGame(false);
             setGameProcessed(false);
             resetGame();
           }, 3000);
         } else {
           setIsWaitingForNextGame(true);
           setCountdownTimer(3);
         }
       } else {
        const winText = gameState.winner === 1 ? 'Victory!' : 'Defeat!';
        setWinMessage(`${winText} 🐝`);
        setShowWinPopup(true);
        
         if (gameState.winner === 1) {
           setGamesWon(prev => prev + 1);
         }
        setGamesCompleted(prev => {
          if (!prev.includes(currentGame)) {
            return [...prev, currentGame];
          }
          return prev;
        });
      }
    } else if (!gameState.isGameActive && gameState.winner === 0 && !gameProcessed) {
      setGameProcessed(true);
      
      setWinMessage('Draw! 🐝');
      setShowWinPopup(true);
      
      if (requiresMatchSystem(currentGame)) {
      } else {
        setGamesCompleted(prev => {
          if (!prev.includes(currentGame)) {
            return [...prev, currentGame];
          }
          return prev;
        });
      }
    } else if (gameState.timeLeft === 0 && !gameProcessed) {
      setGameProcessed(true);
      
      const winText = gameState.currentPlayer === 1 ? 'Time\'s up - Defeat!' : 'Time\'s up - Victory!';
      setWinMessage(`${winText} 🐝`);
      setShowWinPopup(true);
      
       if (requiresMatchSystem(currentGame)) {
         const newPlayerWins = gameState.currentPlayer === 2 ? playerWins + 1 : playerWins;
         const newAiWins = gameState.currentPlayer === 1 ? aiWins + 1 : aiWins;
         
         if (gameState.currentPlayer === 2) {
           setPlayerWins(prev => prev + 1);
         } else {
           setAiWins(prev => prev + 1);
         }
         
         const requiredWins = getRequiredWins(currentGame);
         const totalGames = getTotalGames(currentGame);
         
         if (newPlayerWins >= requiredWins || newAiWins >= requiredWins || (currentMatch >= totalGames)) {
           setIsMatchComplete(true);
           
           if (newPlayerWins >= requiredWins) {
             setGamesWon(prev => prev + 1);
             
            // Match victory message removed
           } else {
            // Match defeat message removed
           }
           
           setGamesCompleted(prev => {
             if (!prev.includes(currentGame)) {
               return [...prev, currentGame];
             }
             return prev;
           });
           
           setTimeout(() => {
             const nextGame = currentGame + 1;
             setCurrentGame(nextGame);
             setCurrentMatch(1);
             setPlayerWins(0);
             setAiWins(0);
             setIsMatchComplete(false);
             setCountdownTimer(0);
             setIsWaitingForNextGame(false);
             setGameProcessed(false);
             resetGame();
           }, 3000);
         } else {
           setIsWaitingForNextGame(true);
           setCountdownTimer(3);
         }
       } else {
        const winText = gameState.currentPlayer === 1 ? 'Time\'s up - Defeat!' : 'Time\'s up - Victory!';
        setWinMessage(`${winText} 🐝`);
        setShowWinPopup(true);
        
         if (gameState.currentPlayer === 2) {
           setGamesWon(prev => prev + 1);
         }
        setGamesCompleted(prev => {
          if (!prev.includes(currentGame)) {
            return [...prev, currentGame];
          }
          return prev;
        });
      }
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer, currentGame, currentMatch, playerWins, aiWins, gameProcessed]);

  React.useEffect(() => {
    if (gameState.currentPlayer === 2 && gameState.isGameActive && gameState.winner === 0) {
      // AI must play in 1000ms for games 1801-2000, otherwise use 1500ms
      const aiDelay = (currentGame >= 1801 && currentGame <= 2000) ? 1000 : 1500;
      const timer = setTimeout(() => {
        makeAdventureAIMove();
      }, aiDelay);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.isGameActive, gameState.winner, gameState.board, gameState.isBlindPlay, gameState.mudZones]);

  const makeAdventureAIMove = () => {
    const availableCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (gameState.board[row][col] === 0) {
          if (gameState.isBlindPlay && isInMudZone(row, col, gameState.mudZones)) {
            continue;
          }
          availableCells.push({ row, col });
        }
      }
    }

    if (availableCells.length === 0) return;

    const selectedCell = gameState.isBlindPlay ? getRandomAIMove(availableCells) : getAdventureAIMove(availableCells);
    handleCellClick(selectedCell.row, selectedCell.col);
  };


  const getAdventureAIMove = (availableCells: {row: number, col: number}[]) => {
    // Use hard AI for levels 601 and above
    if (currentGame >= 601) {
      return getHardAIMove(availableCells);
    }
    return getMediumAIMove(availableCells);
  };

  const getRandomAIMove = (availableCells: {row: number, col: number}[]) => {
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
  };

  const getMediumAIMove = (availableCells: {row: number, col: number}[]) => {
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkWinCondition(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  const checkThreeInARow = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      for (let i = 1; i < 4; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      for (let i = 1; i < 4; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 3) {
        return true;
      }
    }

    return false;
  };

  const checkTwoInARow = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      for (let i = 1; i < 3; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      for (let i = 1; i < 3; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 2) {
        return true;
      }
    }

    return false;
  };

  const canReachFive = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2): boolean => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (let [dr, dc] of directions) {
      let count = 1;
      let emptySpaces = 0;
      
      for (let direction = -1; direction <= 1; direction += 2) {
        for (let i = 1; i <= 4; i++) {
          const newRow = row + (dr * i * direction);
          const newCol = col + (dc * i * direction);
          
          if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) break;
          
          if (board[newRow][newCol] === player) {
            count++;
          } else if (board[newRow][newCol] === 0) {
            emptySpaces++;
          } else {
            break;
          }
        }
      }
      
      if (count + emptySpaces >= 5) {
        return true;
      }
    }
    
    return false;
  };

  // Hard AI implementation for levels 601+
  const getHardAIMove = (availableCells: {row: number, col: number}[]) => {
    // Hard AI: Advanced strategic AI with 8 priority levels
    
    // Priority 1: Win now – If AI can get 5 in a row this move, do it
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        console.log('Hard AI: Winning move at', cell.row, cell.col);
        return cell;
      }
    }

    // Priority 2: Block immediate loss – If the opponent can win next move, block it
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkWinCondition(testBoard, cell.row, cell.col, 1)) {
        console.log('Hard AI: Blocking immediate loss at', cell.row, cell.col);
        return cell;
      }
    }

    // Priority 3: Block 3-in-a-row with gaps on either side
    const gapBlockingMoves = findGapBlockingMoves(availableCells);
    if (gapBlockingMoves.length > 0) {
      console.log('Hard AI: Blocking 3-in-a-row with gaps at', gapBlockingMoves[0].row, gapBlockingMoves[0].col);
      return gapBlockingMoves[0];
    }

    // Priority 4: Create or block double threats – Moves that make (or stop) two winning chances at once
    const doubleThreatMoves = findDoubleThreatMoves(availableCells, 2); // AI double threats
    if (doubleThreatMoves.length > 0) {
      console.log('Hard AI: Creating double threat at', doubleThreatMoves[0].row, doubleThreatMoves[0].col);
      return doubleThreatMoves[0];
    }

    const blockDoubleThreatMoves = findDoubleThreatMoves(availableCells, 1); // Block human double threats
    if (blockDoubleThreatMoves.length > 0) {
      console.log('Hard AI: Blocking double threat at', blockDoubleThreatMoves[0].row, blockDoubleThreatMoves[0].col);
      return blockDoubleThreatMoves[0];
    }

    // Priority 5: Build strongest attack – Extend AI's 4- or 3-in-a-row, especially open lines
    const attackMoves = findStrongestAttackMoves(availableCells);
    if (attackMoves.length > 0) {
      console.log('Hard AI: Building attack at', attackMoves[0].row, attackMoves[0].col);
      return attackMoves[0];
    }

    // Priority 6: Stop dangerous threats – Block opponent's open 4s, then open 3s
    const threatMoves = findDangerousThreatMoves(availableCells);
    if (threatMoves.length > 0) {
      console.log('Hard AI: Blocking dangerous threat at', threatMoves[0].row, threatMoves[0].col);
      return threatMoves[0];
    }

    // Priority 7: Improve position – Play near AI's stones or the board center to increase future options
    const positionalMoves = findBestPositionalMoves(availableCells);
    if (positionalMoves.length > 0) {
      console.log('Hard AI: Improving position at', positionalMoves[0].row, positionalMoves[0].col);
      return positionalMoves[0];
    }

    // Priority 8: Fallback/random – If no good tactical or positional move, play any legal square
    console.log('Hard AI: Fallback random move');
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  // Helper function to find gap blocking moves (block 3-in-a-row with gaps on either side)
  const findGapBlockingMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const gapBlockingMoves: {row: number, col: number}[] = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1; // Simulate human move
      
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let [dRow, dCol] of directions) {
        if (checkGapPattern(testBoard, cell.row, cell.col, dRow, dCol, 1)) {
          gapBlockingMoves.push(cell);
          break; // Found a gap pattern in this direction, no need to check others
        }
      }
    }
    
    return gapBlockingMoves;
  };

  // Helper function to check for gap patterns (like X _ X X or X X _ X)
  const checkGapPattern = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2): boolean => {
    // Check patterns: _ X X X _, X _ X X, X X _ X, X _ _ X X, X X _ _ X, etc.
    const patterns = [
      // Pattern: _ X X X _ (gaps on both sides - very dangerous!)
      () => {
        const pos1 = {row: row + dRow, col: col + dCol};
        const pos2 = {row: row + 2 * dRow, col: col + 2 * dCol};
        const pos3 = {row: row + 3 * dRow, col: col + 3 * dCol};
        const neg1 = {row: row - dRow, col: col - dCol};
        const pos4 = {row: row + 4 * dRow, col: col + 4 * dCol};
        
        return (isValidPosition(pos1) && board[pos1.row][pos1.col] === player &&
                isValidPosition(pos2) && board[pos2.row][pos2.col] === player &&
                isValidPosition(pos3) && board[pos3.row][pos3.col] === player &&
                isValidPosition(neg1) && board[neg1.row][neg1.col] === 0 &&
                isValidPosition(pos4) && board[pos4.row][pos4.col] === 0);
      },
      
      // Pattern: X _ X X (gap at position -1)
      () => {
        const pos1 = {row: row + dRow, col: col + dCol};
        const pos2 = {row: row + 2 * dRow, col: col + 2 * dCol};
        const pos3 = {row: row + 3 * dRow, col: col + 3 * dCol};
        const neg1 = {row: row - dRow, col: col - dCol};
        
        return (isValidPosition(pos1) && board[pos1.row][pos1.col] === player &&
                isValidPosition(pos2) && board[pos2.row][pos2.col] === player &&
                isValidPosition(pos3) && board[pos3.row][pos3.col] === player &&
                isValidPosition(neg1) && board[neg1.row][neg1.col] === 0);
      },
      
      // Pattern: X X _ X (gap at position +1)
      () => {
        const neg1 = {row: row - dRow, col: col - dCol};
        const neg2 = {row: row - 2 * dRow, col: col - 2 * dCol};
        const pos1 = {row: row + dRow, col: col + dCol};
        
        return (isValidPosition(neg1) && board[neg1.row][neg1.col] === player &&
                isValidPosition(neg2) && board[neg2.row][neg2.col] === player &&
                isValidPosition(pos1) && board[pos1.row][pos1.col] === player &&
                isValidPosition({row: row + 2 * dRow, col: col + 2 * dCol}) && board[row + 2 * dRow][col + 2 * dCol] === 0);
      },
      
      // Pattern: X _ _ X X (gap at positions -1, -2)
      () => {
        const pos1 = {row: row + dRow, col: col + dCol};
        const pos2 = {row: row + 2 * dRow, col: col + 2 * dCol};
        const pos3 = {row: row + 3 * dRow, col: col + 3 * dCol};
        const neg1 = {row: row - dRow, col: col - dCol};
        const neg2 = {row: row - 2 * dRow, col: col - 2 * dCol};
        
        return (isValidPosition(pos1) && board[pos1.row][pos1.col] === player &&
                isValidPosition(pos2) && board[pos2.row][pos2.col] === player &&
                isValidPosition(pos3) && board[pos3.row][pos3.col] === player &&
                isValidPosition(neg1) && board[neg1.row][neg1.col] === 0 &&
                isValidPosition(neg2) && board[neg2.row][neg2.col] === 0);
      },
      
      // Pattern: X X _ _ X (gap at positions +1, +2)
      () => {
        const neg1 = {row: row - dRow, col: col - dCol};
        const neg2 = {row: row - 2 * dRow, col: col - 2 * dCol};
        const pos1 = {row: row + dRow, col: col + dCol};
        const pos2 = {row: row + 2 * dRow, col: col + 2 * dCol};
        
        return (isValidPosition(neg1) && board[neg1.row][neg1.col] === player &&
                isValidPosition(neg2) && board[neg2.row][neg2.col] === player &&
                isValidPosition(pos1) && board[pos1.row][pos1.col] === player &&
                isValidPosition(pos2) && board[pos2.row][pos2.col] === 0 &&
                isValidPosition({row: row + 3 * dRow, col: col + 3 * dCol}) && board[row + 3 * dRow][col + 3 * dCol] === 0);
      }
    ];
    
    // Check all patterns
    for (let patternCheck of patterns) {
      if (patternCheck()) {
        return true;
      }
    }
    
    return false;
  };

  // Helper function to check if a position is valid
  const isValidPosition = (pos: {row: number, col: number}): boolean => {
    return pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10;
  };

  // Helper function to find double threat moves (moves that create or block two winning chances)
  const findDoubleThreatMoves = (availableCells: {row: number, col: number}[], player: 1 | 2): {row: number, col: number}[] => {
    const doubleThreatMoves: {row: number, col: number}[] = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      
      let threatCount = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let [dRow, dCol] of directions) {
        if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, player, 4)) {
          threatCount++;
        }
      }
      
      if (threatCount >= 2) {
        doubleThreatMoves.push(cell);
      }
    }
    
    return doubleThreatMoves;
  };

  // Helper function to find the strongest attack moves (extend 4s and 3s, especially open lines)
  const findStrongestAttackMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const attackMoves: {row: number, col: number, score: number}[] = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      
      let score = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let [dRow, dCol] of directions) {
        // Check for open 4-in-a-row (highest priority)
        if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 2, 4)) {
          score += 100;
        }
        // Check for open 3-in-a-row
        else if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 2, 3)) {
          score += 50;
        }
        // Check for semi-open 3-in-a-row
        else if (checkSemiOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 2, 3)) {
          score += 25;
        }
        // Check for open 2-in-a-row
        else if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 2, 2)) {
          score += 10;
        }
      }
      
      if (score > 0) {
        attackMoves.push({...cell, score});
      }
    }
    
    // Sort by score (highest first) and return moves
    attackMoves.sort((a, b) => b.score - a.score);
    return attackMoves.map(move => ({row: move.row, col: move.col}));
  };

  // Helper function to find dangerous threat moves (block opponent's open 4s, then open 3s)
  const findDangerousThreatMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const threatMoves: {row: number, col: number, priority: number}[] = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      
      let maxPriority = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let [dRow, dCol] of directions) {
        // Check for open 4-in-a-row (highest priority)
        if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 1, 4)) {
          maxPriority = Math.max(maxPriority, 100);
        }
        // Check for open 3-in-a-row
        else if (checkOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 1, 3)) {
          maxPriority = Math.max(maxPriority, 50);
        }
        // Check for semi-open 3-in-a-row
        else if (checkSemiOpenLine(testBoard, cell.row, cell.col, dRow, dCol, 1, 3)) {
          maxPriority = Math.max(maxPriority, 25);
        }
      }
      
      if (maxPriority > 0) {
        threatMoves.push({...cell, priority: maxPriority});
      }
    }
    
    // Sort by priority (highest first) and return moves
    threatMoves.sort((a, b) => b.priority - a.priority);
    return threatMoves.map(move => ({row: move.row, col: move.col}));
  };

  // Helper function to find best positional moves (near AI stones or board center)
  const findBestPositionalMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const positionalMoves: {row: number, col: number, score: number}[] = [];
    
    for (let cell of availableCells) {
      let score = 0;
      
      // Distance from center (prefer moves closer to center)
      const centerDistance = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
      score += Math.max(0, 10 - centerDistance);
      
      // Proximity to AI stones (prefer moves near existing AI stones)
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (gameState.board[row][col] === 2) {
            const distance = Math.abs(cell.row - row) + Math.abs(cell.col - col);
            if (distance <= 2) {
              score += 5 - distance;
            }
          }
        }
      }
      
      // Proximity to human stones (prefer moves near human stones for blocking)
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (gameState.board[row][col] === 1) {
            const distance = Math.abs(cell.row - row) + Math.abs(cell.col - col);
            if (distance <= 2) {
              score += 3 - distance;
            }
          }
        }
      }
      
      if (score > 0) {
        positionalMoves.push({...cell, score});
      }
    }
    
    // Sort by score (highest first) and return moves
    positionalMoves.sort((a, b) => b.score - a.score);
    return positionalMoves.map(move => ({row: move.row, col: move.col}));
  };

  // Helper function to check if a line is open (can extend to 5 in both directions)
  const checkOpenLine = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2, targetCount: number): boolean => {
    let count = 1; // Count the current piece
    
    // Count in positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    // Count in negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dRow;
      const newCol = col - i * dCol;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    if (count < targetCount) return false;
    
    // Check if the line can extend to 5 (has open spaces on both ends)
    const posEndRow = row + count * dRow;
    const posEndCol = col + count * dCol;
    const negEndRow = row - count * dRow;
    const negEndCol = col - count * dCol;
    
    const posEndValid = posEndRow >= 0 && posEndRow < 10 && posEndCol >= 0 && posEndCol < 10 && board[posEndRow][posEndCol] === 0;
    const negEndValid = negEndRow >= 0 && negEndRow < 10 && negEndCol >= 0 && negEndCol < 10 && board[negEndRow][negEndCol] === 0;
    
    return posEndValid && negEndValid;
  };

  // Helper function to check if a line is semi-open (can extend to 5 in at least one direction)
  const checkSemiOpenLine = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2, targetCount: number): boolean => {
    let count = 1; // Count the current piece
    
    // Count in positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    // Count in negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dRow;
      const newCol = col - i * dCol;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    if (count < targetCount) return false;
    
    // Check if the line can extend to 5 in at least one direction
    const posEndRow = row + count * dRow;
    const posEndCol = col + count * dCol;
    const negEndRow = row - count * dRow;
    const negEndCol = col - count * dCol;
    
    const posEndValid = posEndRow >= 0 && posEndRow < 10 && posEndCol >= 0 && posEndCol < 10 && board[posEndRow][posEndCol] === 0;
    const negEndValid = negEndRow >= 0 && negEndRow < 10 && negEndCol >= 0 && negEndCol < 10 && board[negEndRow][negEndCol] === 0;
    
    return posEndValid || negEndValid;
  };



   const handleNextGame = () => {
     setShowWinPopup(false);
     
     if (requiresMatchSystem(currentGame) && !isMatchComplete && !isWaitingForNextGame) {
       const requiredWins = getRequiredWins(currentGame);
       const totalGames = getTotalGames(currentGame);
       
       if (playerWins >= requiredWins || aiWins >= requiredWins || currentMatch >= totalGames) {
         setIsMatchComplete(true);
         setShowMap(true);
       } else {
         setIsWaitingForNextGame(true);
         setCountdownTimer(3);
       }
     } else if (requiresMatchSystem(currentGame) && isMatchComplete) {
       const nextGame = currentGame + 1;
       if (requiresMatchSystem(nextGame)) {
         setCurrentGame(nextGame);
         setCurrentMatch(1);
         setPlayerWins(0);
         setAiWins(0);
         setIsMatchComplete(false);
         setCountdownTimer(0);
         setIsWaitingForNextGame(false);
         setGameProcessed(false);
         resetGame();
       } else {
         setShowMap(true);
       }
     } else {
       setShowMap(true);
     }
   };

  const handleGameSelect = (gameNumber: number) => {
    setCurrentGame(gameNumber);
    setShowMap(false);
    resetGame();
    
    setCurrentMatch(1);
    setPlayerWins(0);
    setAiWins(0);
    setIsMatchComplete(false);
    setCountdownTimer(0);
    setIsWaitingForNextGame(false);
    setGameProcessed(false);
  };

  const handleStageTransitionClose = () => {
    setShowStageTransition(false);
    if (soundEnabled) soundManager.playClickSound();
  };

  const isMobile = window.innerWidth <= 768;

  if (showMap) {
    return (
      <BeeAdventureMap
        currentGame={currentGame}
        gamesCompleted={gamesCompleted}
        onGameSelect={handleGameSelect}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  return (
    <BeeLifeStageEffects theme={currentTheme}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          @keyframes aiMoveHighlight {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
          }
        `}
      </style>
      <div style={{ 
        background: currentTheme.backgroundGradient,
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          <button 
            onClick={() => {
              onBackToMenu();
              if (soundEnabled) soundManager.playClickSound();
            }}
            disabled={requiresMatchSystem(currentGame) && !isMatchComplete}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '1.2em' : '1em',
              backgroundColor: requiresMatchSystem(currentGame) && !isMatchComplete ? '#ccc' : currentTheme.buttonColor,
              color: 'black',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: requiresMatchSystem(currentGame) && !isMatchComplete ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: requiresMatchSystem(currentGame) && !isMatchComplete ? 0.6 : 1
            }}
          >
            {isMobile ? '🏠' : '🏠 Menu'}
          </button>
          
          <h1 style={{ 
            color: '#FFC30B', 
            margin: 0,
            fontSize: isMobile ? 'clamp(1.2rem, 4vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2rem)',
            textShadow: '2px 2px 0px black',
            fontWeight: 'bold'
          }}>
            🗺️ Adventure
          </h1>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setShowMap(true);
              if (soundEnabled) soundManager.playClickSound();
            }}
            disabled={requiresMatchSystem(currentGame) && !isMatchComplete}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '1em',
              backgroundColor: requiresMatchSystem(currentGame) && !isMatchComplete ? '#ccc' : '#2196F3',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: requiresMatchSystem(currentGame) && !isMatchComplete ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              minWidth: '60px',
              height: '40px',
              opacity: requiresMatchSystem(currentGame) && !isMatchComplete ? 0.6 : 1
            }}
          >
            🗺️ Map
          </button>

          {!isMobile && (
            <button
              onClick={() => {
                const newSoundEnabled = !soundEnabled;
                setSoundEnabled(newSoundEnabled);
                soundManager.setMuted(!newSoundEnabled);
                if (newSoundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
                fontSize: '1em',
                backgroundColor: soundEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => {
                setShowMobileSettings(!showMobileSettings);
                if (soundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: '0.5rem',
                fontSize: '1em',
                backgroundColor: currentTheme.buttonColor,
                color: 'black',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                height: '40px'
              }}
            >
              ⚙️
            </button>
          )}
          
          <div style={{
            padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
            fontSize: isMobile ? '0.9em' : '0.9em',
            backgroundColor: currentTheme.cardBackground,
            color: 'black',
            border: '2px solid black',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            minWidth: '120px',
            justifyContent: 'center'
          }}>
            {gameState.isBlindPlay ? '👁️‍🗨️' : '🎯'} {currentGame}/2000
            {requiresMatchSystem(currentGame) && (
              <span style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}>
                ({currentMatch}/{getTotalGames(currentGame)})
              </span>
            )}
          </div>
          
          <div style={{
            padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
            fontSize: isMobile ? '1em' : '0.9em',
            backgroundColor: currentTheme.cardBackground,
            color: 'black',
            border: '2px solid black',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            minWidth: '80px',
            justifyContent: 'center'
          }}>
            ⏱️ {gameState.timeLeft}s
          </div>
        </div>
      </div>


      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '1rem' : '2rem',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: gameState.currentPlayer === 2 ? 'aiMoveHighlight 1.5s ease-out' : 'none'
        }}>
            <GameCanvas
              gameState={gameState}
              gridColor={getMatchGridColor(currentGame, currentMatch)}
              gameNumber={currentGame}
              onCellClick={(row, col) => {
                if (gameState.currentPlayer === 1) {
                  handleCellClick(row, col);
                }
              }}
            />
        </div>
      </div>

      {soundEnabled && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '0.5rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.85rem',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <span style={{ color: '#333', fontWeight: 'bold' }}>🔊 Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              soundManager.setVolume(newVolume);
            }}
            style={{ 
              width: isMobile ? '120px' : '150px',
              accentColor: '#FFC30B'
            }}
          />
          <span style={{ color: '#666', fontSize: '0.8em' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {isMobile && showMobileSettings && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '10px',
          border: '2px solid black',
          padding: '1rem',
          minWidth: '200px',
          maxWidth: '90vw',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            color: '#FFC30B', 
            textAlign: 'center',
            fontSize: '1.1em',
            fontWeight: 'bold'
          }}>
            Settings
          </h3>
          
          <div style={{
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <span style={{ fontWeight: 'bold', color: '#333' }}>Sound:</span>
            <button
              onClick={() => {
                const newSoundEnabled = !soundEnabled;
                setSoundEnabled(newSoundEnabled);
                soundManager.setMuted(!newSoundEnabled);
                if (newSoundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: '0.4rem 0.6rem',
                fontSize: '1em',
                backgroundColor: soundEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: '2px solid black',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {soundEnabled ? '🔊 On' : '🔇 Off'}
            </button>
          </div>

          {soundEnabled && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <span style={{ fontWeight: 'bold', color: '#333' }}>Volume:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    soundManager.setVolume(newVolume);
                  }}
                  style={{ 
                    width: '80px',
                    accentColor: '#FFC30B'
                  }}
                />
                <span style={{ color: '#666', fontSize: '0.8em', minWidth: '30px' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowMobileSettings(false)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              cursor: 'pointer',
              color: '#666',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {showStageTransition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            padding: '40px',
            borderRadius: '20px',
            border: `4px solid ${currentTheme.borderColor}`,
            textAlign: 'center',
            minWidth: '400px',
            maxWidth: '90vw',
            position: 'relative',
            animation: 'popIn 0.5s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-out infinite'
            }}>
              🐝
            </div>
            
            <h1 style={{
              fontSize: '2.5em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {currentTheme.stageEmoji} {currentTheme.name}
            </h1>
            
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px',
              fontStyle: 'italic'
            }}>
              {currentTheme.description || 'Continue your journey through the bee life cycle!'}
            </p>
            
            <div style={{
              fontSize: '1.1em',
              color: '#333',
              marginBottom: '30px',
              fontWeight: 'bold'
            }}>
              Games {currentGame - (currentGame % 200) + 1} - {Math.min(currentGame - (currentGame % 200) + 200, 2000)}
            </div>
            
            <button 
              onClick={handleStageTransitionClose}
              style={{
                padding: '12px 24px',
                fontSize: '1.1em',
                fontWeight: 'bold',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: '2px solid black',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '120px'
              }}
            >
              Continue Adventure
            </button>
          </div>
        </div>
      )}

      {showWinPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBackground,
            padding: '40px',
            borderRadius: '20px',
            border: `4px solid ${currentTheme.borderColor}`,
            textAlign: 'center',
            minWidth: '300px',
            maxWidth: '90vw',
            position: 'relative',
            animation: 'popIn 0.5s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-out infinite'
            }}>
              🐝
            </div>
            
            <h1 style={{
              fontSize: '2.5em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {winMessage}
            </h1>
            
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px'
            }}>
              Game {currentGame} of 2000 | Wins: {gamesWon}
              {requiresMatchSystem(currentGame) && (
                <div style={{ fontSize: '1em', marginTop: '10px' }}>
                  Match Progress: {playerWins} - {aiWins}
                  <br />
                  Game {currentMatch} of {getTotalGames(currentGame)}
                  {isMatchComplete ? (
                    <div style={{ fontWeight: 'bold', color: playerWins > aiWins ? '#4CAF50' : '#f44336', marginTop: '5px' }}>
                      {playerWins > aiWins ? 'Match Won!' : 'Match Lost!'}
                    </div>
                  ) : isWaitingForNextGame ? (
                    <div style={{ fontWeight: 'bold', color: '#FF9800', marginTop: '5px' }}>
                      Next game in {countdownTimer} seconds...
                    </div>
                  ) : (
                    <div style={{ fontWeight: 'bold', color: '#FF9800', marginTop: '5px' }}>
                      Complete all {getTotalGames(currentGame)} games to proceed!
                    </div>
                  )}
                </div>
              )}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleNextGame}
                disabled={isWaitingForNextGame}
                style={{
                  padding: '12px 24px',
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  backgroundColor: isWaitingForNextGame ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: '2px solid black',
                  borderRadius: '10px',
                  cursor: isWaitingForNextGame ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  opacity: isWaitingForNextGame ? 0.6 : 1
                }}
              >
                {isWaitingForNextGame ? 
                  `⏳ Waiting... (${countdownTimer}s)` :
                  requiresMatchSystem(currentGame) && !isMatchComplete ? 
                    `🎮 Next Game (${currentMatch + 1}/${getTotalGames(currentGame)})` : 
                    '🗺️ Go to Map'
                }
              </button>
              
              {(!requiresMatchSystem(currentGame) || isMatchComplete) && !isWaitingForNextGame && (
                <>
                  {(gameState.winner === 1 || (gameState.timeLeft === 0 && gameState.currentPlayer === 2)) && (
                    <button 
                      onClick={() => {
                        setShowWinPopup(false);
                        const nextGame = currentGame + 1;
                        setCurrentGame(nextGame);
                        setCurrentMatch(1);
                        setPlayerWins(0);
                        setAiWins(0);
                        setIsMatchComplete(false);
                        setCountdownTimer(0);
                        setIsWaitingForNextGame(false);
                        setGameProcessed(false);
                        resetGame();
                        if (soundEnabled) soundManager.playClickSound();
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: '2px solid black',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minWidth: '120px'
                      }}
                    >
                      ➡️ Continue
                    </button>
                  )}
                  
                  {(gameState.winner === 2 || (gameState.timeLeft === 0 && gameState.currentPlayer === 1)) && (
                    <button 
                      onClick={() => {
                        setShowWinPopup(false);
                        resetGame();
                        setGameProcessed(false);
                        if (soundEnabled) soundManager.playClickSound();
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: '2px solid black',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minWidth: '120px'
                      }}
                    >
                      🔄 Replay
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      setShowWinPopup(false);
                      onBackToMenu();
                    }}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: '2px solid black',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '120px'
                    }}
                  >
                    Back to Menu
                  </button>
                </>
              )}
            </div>
            
            {(!requiresMatchSystem(currentGame) || isMatchComplete) && !isWaitingForNextGame && (
              <button
                onClick={() => setShowWinPopup(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      </div>
    </BeeLifeStageEffects>
  );
};

export default AdventureGame;
