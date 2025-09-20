import React, { useState, useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import AdventureMap from './AdventureMap';
import { soundManager } from '../utils/sounds';
import { getTimeLimitForLevel } from '../utils/gameLogic';

interface AdventureGameProps {
  onBackToMenu: () => void;
}

// Stage names and descriptions for every 100 games
const ADVENTURE_STAGES = [
  {
    name: "The Whispering Egg",
    description: "The prophecy of a hero is laid within a golden cell.",
    games: 1
  },
  {
    name: "Larva of Legends", 
    description: "A tiny creature begins its fabled journey of growth.",
    games: 101
  },
  {
    name: "Chamber of Royal Nectar",
    description: "A mystical hall where power and destiny are forged.",
    games: 201
  },
  {
    name: "Silken Cocoon of Secrets",
    description: "Spinning a magical shell to transform.",
    games: 301
  },
  {
    name: "Dreams of the Pupa Realm",
    description: "Visions of wings and future battles stir inside.",
    games: 401
  },
  {
    name: "Wings of Dawn",
    description: "Breaking free and taking the first heroic flight.",
    games: 501
  },
  {
    name: "Hive of Trials",
    description: "Training in ancient duties and learning hidden arts.",
    games: 601
  },
  {
    name: "Trails of Golden Pollen",
    description: "Quests across wildflower kingdoms to gather treasure.",
    games: 701
  },
  {
    name: "Sentinel of the Hiveheart",
    description: "Standing guard against dark invaders.",
    games: 801
  },
  {
    name: "Crown of the Queen-Bee",
    description: "Ascend the throne, lead the swarm, or begin a new dynasty.",
    games: 901
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
  
  // Match system state
  const [currentMatch, setCurrentMatch] = useState(1);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState(0);
  const [isWaitingForNextGame, setIsWaitingForNextGame] = useState(false);
  const [gameProcessed, setGameProcessed] = useState(false);
  const [showMatchVictoryPopup, setShowMatchVictoryPopup] = useState(false);
  const [matchVictoryMessage, setMatchVictoryMessage] = useState('');
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit: getTimeLimitForLevel(currentGame),
    gameNumber: currentGame
  });

  // Helper functions for match system
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

  // Get grid color for match games
  const getMatchGridColor = (gameNumber: number, matchNumber: number): string => {
    if (!requiresMatchSystem(gameNumber)) {
      // Default color for non-match games
      return '#87CEEB'; // skyblue
    }

    const matchType = getMatchType(gameNumber);
    
    if (matchType === 'best-of-3') {
      switch (matchNumber) {
        case 1: return '#FFFFFF'; // White
        case 2: return '#FFA500'; // Orange
        case 3: return '#87CEEB'; // Default skyblue
        default: return '#87CEEB';
      }
    } else if (matchType === 'best-of-5') {
      switch (matchNumber) {
        case 1: return '#FFFFFF'; // White (same as 3-match series)
        case 2: return '#FFA500'; // Orange (same as 3-match series)
        case 3: return '#FF0000'; // Red
        case 4: return '#00FF00'; // Green
        case 5: return '#87CEEB'; // Default skyblue
        default: return '#87CEEB';
      }
    }
    
    return '#87CEEB';
  };

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Reset all counters on component mount to fix any cached values
  React.useEffect(() => {
    console.log('AdventureGame: Resetting all counters to 0');
    setGamesWon(0);
    setPlayerWins(0);
    setAiWins(0);
    setGameProcessed(false);
  }, []);

   // Countdown timer for match games
   React.useEffect(() => {
     if (isWaitingForNextGame && countdownTimer > 0) {
       const timer = setTimeout(() => {
         setCountdownTimer(prev => prev - 1);
       }, 1000);
       return () => clearTimeout(timer);
     } else if (isWaitingForNextGame && countdownTimer === 0) {
       // Countdown finished, proceed to next game
       setIsWaitingForNextGame(false);
       setCurrentMatch(prev => prev + 1);
       setGameProcessed(false); // Reset the processed flag for the new game
       resetGame();
     }
   }, [isWaitingForNextGame, countdownTimer, resetGame, currentGame, currentMatch, playerWins, aiWins]);

  // Check for stage transitions
  useEffect(() => {
    const stageIndex = Math.floor((currentGame - 1) / 100);
    if (stageIndex !== currentStage && stageIndex < ADVENTURE_STAGES.length) {
      setCurrentStage(stageIndex);
      setShowStageTransition(true);
    }
  }, [currentGame, currentStage]);

  // Show popup when game ends
  React.useEffect(() => {
    if (gameState.winner > 0 && !gameProcessed) {
      setGameProcessed(true); // Mark as processed to prevent multiple executions
      
      if (gameState.winner === 1) {
        soundManager.playVictorySound();
      } else {
        soundManager.playDefeatSound();
      }
      
       // Handle match system
       if (requiresMatchSystem(currentGame)) {
         const newPlayerWins = gameState.winner === 1 ? playerWins + 1 : playerWins;
         const newAiWins = gameState.winner === 2 ? aiWins + 1 : aiWins;
         
         if (gameState.winner === 1) {
           console.log('AdventureGame: Player won game in match, incrementing playerWins');
           setPlayerWins(prev => prev + 1);
         } else {
           console.log('AdventureGame: AI won game in match, incrementing aiWins');
           setAiWins(prev => prev + 1);
         }
         
         // Check if match is complete using updated win counts
         const requiredWins = getRequiredWins(currentGame);
         const totalGames = getTotalGames(currentGame);
         
         console.log(`AdventureGame: Match check - newPlayerWins: ${newPlayerWins}, newAiWins: ${newAiWins}, requiredWins: ${requiredWins}, currentMatch: ${currentMatch}, totalGames: ${totalGames}`);
         
         // Check if someone has won the match or if we've played all games
         if (newPlayerWins >= requiredWins || newAiWins >= requiredWins || (currentMatch >= totalGames)) {
           console.log('AdventureGame: Match is complete!');
           setIsMatchComplete(true);
           
           // Increment gamesWon only if player won the match
           if (newPlayerWins >= requiredWins) {
             console.log('AdventureGame: Player won match, incrementing gamesWon');
             setGamesWon(prev => prev + 1);
             
             // Show match victory popup
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`🎉 Match Victory! 🎉\n\nYou won the ${matchType} match!\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           } else {
             // Show match defeat popup
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`💔 Match Defeat 💔\n\nYou lost the ${matchType} match.\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           }
           
           // Mark the entire game as completed
           setGamesCompleted(prev => {
             if (!prev.includes(currentGame)) {
               return [...prev, currentGame];
             }
             return prev;
           });
           
           // Auto-proceed to next game after 3 seconds
           setTimeout(() => {
             console.log('AdventureGame: Auto-proceeding to next game');
             const nextGame = currentGame + 1;
             setCurrentGame(nextGame);
             setCurrentMatch(1);
             setPlayerWins(0);
             setAiWins(0);
             setIsMatchComplete(false);
             setCountdownTimer(0);
             setIsWaitingForNextGame(false);
             setGameProcessed(false);
             setShowMatchVictoryPopup(false);
             resetGame();
           }, 3000);
         } else {
           // Match is not complete, automatically proceed to next game within match
           console.log('AdventureGame: Auto-proceeding to next game within match');
           setIsWaitingForNextGame(true);
           setCountdownTimer(3);
         }
       } else {
        // Single game - show popup and mark as completed
        const winText = gameState.winner === 1 ? 'Victory!' : 'Defeat!';
        setWinMessage(`${winText} 🐝`);
        setShowWinPopup(true);
        
        if (gameState.winner === 1) {
          console.log('AdventureGame: Player won single game, incrementing gamesWon');
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
      setGameProcessed(true); // Mark as processed to prevent multiple executions
      
      setWinMessage('Draw! 🐝');
      setShowWinPopup(true);
      
      // For draws in match system, continue to next game
      if (requiresMatchSystem(currentGame)) {
        // Draw doesn't count as a win for either side, continue match
      } else {
        // Single game - mark as completed even on draw (no win increment for draws)
        setGamesCompleted(prev => {
          if (!prev.includes(currentGame)) {
            return [...prev, currentGame];
          }
          return prev;
        });
      }
    } else if (gameState.timeLeft === 0 && !gameProcessed) {
      setGameProcessed(true); // Mark as processed to prevent multiple executions
      
      const winText = gameState.currentPlayer === 1 ? 'Time\'s up - Defeat!' : 'Time\'s up - Victory!';
      setWinMessage(`${winText} 🐝`);
      setShowWinPopup(true);
      
       // Handle time-based wins in match system
       if (requiresMatchSystem(currentGame)) {
         const newPlayerWins = gameState.currentPlayer === 2 ? playerWins + 1 : playerWins;
         const newAiWins = gameState.currentPlayer === 1 ? aiWins + 1 : aiWins;
         
         if (gameState.currentPlayer === 2) { // Player wins due to AI timeout
           console.log('AdventureGame: Player won game in match (timeout), incrementing playerWins');
           setPlayerWins(prev => prev + 1);
         } else { // AI wins due to player timeout
           console.log('AdventureGame: AI won game in match (timeout), incrementing aiWins');
           setAiWins(prev => prev + 1);
         }
         
         // Check if match is complete using updated win counts
         const requiredWins = getRequiredWins(currentGame);
         const totalGames = getTotalGames(currentGame);
         
         console.log(`AdventureGame: Timeout match check - newPlayerWins: ${newPlayerWins}, newAiWins: ${newAiWins}, requiredWins: ${requiredWins}, currentMatch: ${currentMatch}, totalGames: ${totalGames}`);
         
         if (newPlayerWins >= requiredWins || newAiWins >= requiredWins || (currentMatch >= totalGames)) {
           console.log('AdventureGame: Timeout match is complete!');
           setIsMatchComplete(true);
           
           // Increment gamesWon only if player won the match
           if (newPlayerWins >= requiredWins) {
             console.log('AdventureGame: Player won timeout match, incrementing gamesWon');
             setGamesWon(prev => prev + 1);
             
             // Show match victory popup
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`🎉 Match Victory! 🎉\n\nYou won the ${matchType} match!\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           } else {
             // Show match defeat popup
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`💔 Match Defeat 💔\n\nYou lost the ${matchType} match.\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           }
           
           setGamesCompleted(prev => {
             if (!prev.includes(currentGame)) {
               return [...prev, currentGame];
             }
             return prev;
           });
           
           // Auto-proceed to next game after 3 seconds
           setTimeout(() => {
             console.log('AdventureGame: Auto-proceeding to next game (timeout)');
             const nextGame = currentGame + 1;
             setCurrentGame(nextGame);
             setCurrentMatch(1);
             setPlayerWins(0);
             setAiWins(0);
             setIsMatchComplete(false);
             setCountdownTimer(0);
             setIsWaitingForNextGame(false);
             setGameProcessed(false);
             setShowMatchVictoryPopup(false);
             resetGame();
           }, 3000);
         } else {
           // Match is not complete, automatically proceed to next game within match
           console.log('AdventureGame: Auto-proceeding to next game within timeout match');
           setIsWaitingForNextGame(true);
           setCountdownTimer(3);
         }
       } else {
        // Single game - show popup and mark as completed
        const winText = gameState.currentPlayer === 1 ? 'Time\'s up - Defeat!' : 'Time\'s up - Victory!';
        setWinMessage(`${winText} 🐝`);
        setShowWinPopup(true);
        
        if (gameState.currentPlayer === 2) { // Player wins due to AI timeout
          console.log('AdventureGame: Player won single game (timeout), incrementing gamesWon');
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

  // AI move logic - Adventure mode uses adaptive difficulty
  React.useEffect(() => {
    if (gameState.currentPlayer === 2 && gameState.isGameActive && gameState.winner === 0) {
      const timer = setTimeout(() => {
        makeAdventureAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.isGameActive, gameState.winner]);

  const makeAdventureAIMove = () => {
    const availableCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (gameState.board[row][col] === 0) {
          availableCells.push({ row, col });
        }
      }
    }

    if (availableCells.length === 0) return;

    // Adaptive difficulty based on current game progress
    const selectedCell = getAdventureAIMove(availableCells);
    handleCellClick(selectedCell.row, selectedCell.col);
  };


  const getAdventureAIMove = (availableCells: {row: number, col: number}[]) => {
    // Use the full hard AI implementation for Adventure mode
    return getHardAIMove(availableCells);
  };

  const getHardAIMove = (availableCells: {row: number, col: number}[]) => {
    // Hard AI: Advanced strategic AI with 8 priority levels
    
    // Priority 1: Win now – If AI can get 5 in a row this move, do it
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 2: Block immediate loss – If the opponent can win next move, block it
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkWinCondition(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 2.5: Block simple 3-in-a-row threats (basic defense)
    const basicThreeInARowMoves = findBasicThreeInARowMoves(availableCells);
    if (basicThreeInARowMoves.length > 0) {
      return basicThreeInARowMoves[0];
    }

    // Priority 3: Block 3-in-a-row with gaps on either side
    const gapBlockingMoves = findGapBlockingMoves(availableCells);
    if (gapBlockingMoves.length > 0) {
      return gapBlockingMoves[0];
    }

    // Priority 4: Create or block double threats – Moves that make (or stop) two winning chances at once
    const doubleThreatMoves = findDoubleThreatMoves(availableCells, 2); // AI double threats
    if (doubleThreatMoves.length > 0) {
      return doubleThreatMoves[0];
    }

    const blockDoubleThreatMoves = findDoubleThreatMoves(availableCells, 1); // Block human double threats
    if (blockDoubleThreatMoves.length > 0) {
      return blockDoubleThreatMoves[0];
    }

    // Priority 5: Build strongest attack – Extend AI's 4- or 3-in-a-row, especially open lines
    const attackMoves = findStrongestAttackMoves(availableCells);
    if (attackMoves.length > 0) {
      return attackMoves[0];
    }

    // Priority 6: Stop dangerous threats – Block opponent's open 4s, then open 3s
    const threatMoves = findDangerousThreatMoves(availableCells);
    if (threatMoves.length > 0) {
      return threatMoves[0];
    }

    // Priority 7: Improve position – Play near AI's stones or the board center to increase future options
    const positionalMoves = findBestPositionalMoves(availableCells);
    if (positionalMoves.length > 0) {
      return positionalMoves[0];
    }

    // Priority 8: Fallback/random – If no good tactical or positional move, play any legal square
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  // Helper function to find basic 3-in-a-row blocking moves
  const findBasicThreeInARowMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const blockingMoves: {row: number, col: number}[] = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1; // Simulate human move
      
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let [dRow, dCol] of directions) {
        if (checkBasicThreeInARow(testBoard, cell.row, cell.col, dRow, dCol, 1)) {
          blockingMoves.push(cell);
          break; // Found a 3-in-a-row pattern in this direction, no need to check others
        }
      }
    }
    
    return blockingMoves;
  };

  // Helper function to check for basic 3-in-a-row patterns
  const checkBasicThreeInARow = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2): boolean => {
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
    
    // Return true if we have exactly 3 in a row
    return count === 3;
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

  // Helper function to check if position is valid
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
      
      // Avoid moves that are too isolated
      let nearbyStones = 0;
      for (let row = Math.max(0, cell.row - 2); row <= Math.min(9, cell.row + 2); row++) {
        for (let col = Math.max(0, cell.col - 2); col <= Math.min(9, cell.col + 2); col++) {
          if (gameState.board[row][col] !== 0) {
            nearbyStones++;
          }
        }
      }
      
      if (nearbyStones === 0) {
        score -= 5; // Penalty for completely isolated moves
      }
      
      positionalMoves.push({...cell, score});
    }
    
    // Sort by score (highest first) and return moves
    positionalMoves.sort((a, b) => b.score - a.score);
    return positionalMoves.map(move => ({row: move.row, col: move.col}));
  };

  // Helper function to check if a line is open (can extend to 5)
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
    
    const posOpen = (posEndRow < 0 || posEndRow >= 10 || posEndCol < 0 || posEndCol >= 10 || board[posEndRow][posEndCol] === 0);
    const negOpen = (negEndRow < 0 || negEndRow >= 10 || negEndCol < 0 || negEndCol >= 10 || board[negEndRow][negEndCol] === 0);
    
    return posOpen && negOpen;
  };

  // Helper function to check if a line is semi-open (can extend to 5 in one direction)
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
    
    const posOpen = (posEndRow < 0 || posEndRow >= 10 || posEndCol < 0 || posEndCol >= 10 || board[posEndRow][posEndCol] === 0);
    const negOpen = (negEndRow < 0 || negEndRow >= 10 || negEndCol < 0 || negEndCol >= 10 || board[negEndRow][negEndCol] === 0);
    
    return posOpen || negOpen;
  };

  const checkWinCondition = (board: (0 | 1 | 2 | 3)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      // Check in positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
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
  };


  const getStatusMessage = () => {
    if (gameState.winner > 0) {
      const winText = gameState.winner === 1 ? 'Victory!' : 'Defeat!';
      return winText;
    }
    if (!gameState.isGameActive && gameState.winner === 0) {
      return 'Draw!';
    }
    if (gameState.timeLeft === 0) {
      const winText = gameState.currentPlayer === 1 ? 'Time\'s up - Defeat!' : 'Time\'s up - Victory!';
      return winText;
    }
    
    return gameState.currentPlayer === 1 ? 'Your turn!' : 'AI is thinking...';
  };

   const handleNextGame = () => {
     setShowWinPopup(false);
     
     if (requiresMatchSystem(currentGame) && !isMatchComplete && !isWaitingForNextGame) {
       // Check if we need to continue the match
       const requiredWins = getRequiredWins(currentGame);
       const totalGames = getTotalGames(currentGame);
       
       // If someone has already won the match or we've played all games, mark as complete
       if (playerWins >= requiredWins || aiWins >= requiredWins || currentMatch >= totalGames) {
         setIsMatchComplete(true);
         setShowMap(true);
       } else {
         // Start countdown for next game in the match
         setIsWaitingForNextGame(true);
         setCountdownTimer(3);
       }
     } else if (requiresMatchSystem(currentGame) && isMatchComplete) {
       // Match is complete - check if next game is also a series game
       const nextGame = currentGame + 1;
       if (requiresMatchSystem(nextGame)) {
         // Next game is also a series game, auto-proceed
         console.log('AdventureGame: Auto-proceeding to next series game');
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
         // Next game is not a series game, go to map
         setShowMap(true);
       }
     } else {
       // Single game, go to map
       setShowMap(true);
     }
   };

  const handleGameSelect = (gameNumber: number) => {
    setCurrentGame(gameNumber);
    setShowMap(false);
    resetGame();
    
    // Reset match state for new game
    setCurrentMatch(1);
    setPlayerWins(0);
    setAiWins(0);
    setIsMatchComplete(false);
    setCountdownTimer(0);
    setIsWaitingForNextGame(false);
    setGameProcessed(false);
    setShowMatchVictoryPopup(false);
  };

  const handleStageTransitionClose = () => {
    setShowStageTransition(false);
    if (soundEnabled) soundManager.playClickSound();
  };

  // Calculate responsive sizes
  const isMobile = window.innerWidth <= 768;

  // Show map if requested
  if (showMap) {
    return (
      <AdventureMap
        currentGame={currentGame}
        gamesCompleted={gamesCompleted}
        onGameSelect={handleGameSelect}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFC30B 0%, #FFD700 50%, #FFC30B 100%)',
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mobile-optimized header */}
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
        {/* Left side: Menu button and title */}
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
              backgroundColor: requiresMatchSystem(currentGame) && !isMatchComplete ? '#ccc' : '#FFC30B',
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

        {/* Controls - stack on mobile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Map button */}
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

          {/* Sound control - hidden on mobile */}
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

          {/* Mobile Settings Icon */}
          {isMobile && (
            <button
              onClick={() => {
                setShowMobileSettings(!showMobileSettings);
                if (soundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: '0.5rem',
                fontSize: '1em',
                backgroundColor: '#FFC30B',
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
          
          {/* Progress display */}
          <div style={{
            padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
            fontSize: isMobile ? '0.9em' : '0.9em',
            backgroundColor: '#FFC30B',
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
            🎯 {currentGame}/1000
            {requiresMatchSystem(currentGame) && (
              <span style={{ fontSize: '0.8em', marginLeft: '0.25rem' }}>
                ({currentMatch}/{getTotalGames(currentGame)})
              </span>
            )}
          </div>
          
          {/* Timer display */}
          <div style={{
            padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
            fontSize: isMobile ? '1em' : '0.9em',
            backgroundColor: '#FFC30B',
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

      {/* Game status bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        textAlign: 'center',
        fontSize: isMobile ? 'clamp(1rem, 4vw, 1.2rem)' : 'clamp(1.1rem, 2.5vw, 1.3rem)',
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9
      }}>
        {getStatusMessage()}
      </div>

      {/* Main game area - fills remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '1rem' : '2rem',
        position: 'relative'
      }}>
        {/* Game board with responsive sizing */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
            <GameCanvas
              gameState={gameState}
              gridColor={getMatchGridColor(currentGame, currentMatch)}
              onCellClick={(row, col) => {
                // Only allow human moves when it's player 1's turn
                if (gameState.currentPlayer === 1) {
                  handleCellClick(row, col);
                }
              }}
            />
        </div>
      </div>

      {/* Volume control (only when sound is enabled) */}
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

      {/* Mobile Settings Dropdown */}
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
          
          {/* Sound Control */}
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

          {/* Volume Control */}
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

          {/* Close button */}
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

      {/* Stage Transition Modal */}
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
            backgroundColor: '#FFC30B',
            padding: '40px',
            borderRadius: '20px',
            border: '4px solid black',
            textAlign: 'center',
            minWidth: '400px',
            maxWidth: '90vw',
            position: 'relative',
            animation: 'popIn 0.5s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Stage Icon */}
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-out infinite'
            }}>
              🐝
            </div>
            
            {/* Stage Name */}
            <h1 style={{
              fontSize: '2.5em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {ADVENTURE_STAGES[currentStage]?.name}
            </h1>
            
            {/* Stage Description */}
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px',
              fontStyle: 'italic'
            }}>
              {ADVENTURE_STAGES[currentStage]?.description}
            </p>
            
            {/* Progress Info */}
            <div style={{
              fontSize: '1.1em',
              color: '#333',
              marginBottom: '30px',
              fontWeight: 'bold'
            }}>
              Games {ADVENTURE_STAGES[currentStage]?.games} - {ADVENTURE_STAGES[currentStage]?.games + 99}
            </div>
            
            {/* Continue Button */}
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

      {/* Winning Popup Modal */}
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
            backgroundColor: '#FFC30B',
            padding: '40px',
            borderRadius: '20px',
            border: '4px solid black',
            textAlign: 'center',
            minWidth: '300px',
            maxWidth: '90vw',
            position: 'relative',
            animation: 'popIn 0.5s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Celebration Icons */}
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-out infinite'
            }}>
              🐝
            </div>
            
            {/* Win Message */}
            <h1 style={{
              fontSize: '2.5em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {winMessage}
            </h1>
            
            {/* Progress Info */}
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px'
            }}>
              Game {currentGame} of 1000 | Wins: {gamesWon}
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
            
            {/* Action Buttons */}
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
              
              {/* Only show "Back to Menu" button if match is complete or single game */}
              {(!requiresMatchSystem(currentGame) || isMatchComplete) && !isWaitingForNextGame && (
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
              )}
            </div>
            
            {/* Close button - only show if match is complete or single game */}
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

      {/* Match Victory Popup Modal */}
      {showMatchVictoryPopup && (
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
            backgroundColor: '#FFC30B',
            padding: '40px',
            borderRadius: '20px',
            border: '4px solid black',
            textAlign: 'center',
            minWidth: '400px',
            maxWidth: '90vw',
            position: 'relative',
            animation: 'popIn 0.5s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Celebration Icons */}
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-out infinite'
            }}>
              🎉🐝🎉
            </div>
            
            {/* Match Victory Message */}
            <div style={{
              fontSize: '1.5em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              whiteSpace: 'pre-line',
              lineHeight: '1.4'
            }}>
              {matchVictoryMessage}
            </div>
            
            {/* Progress Info */}
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '20px'
            }}>
              Game {currentGame} completed! | Total Wins: {gamesWon}
            </p>
            
            {/* Auto-proceed countdown */}
            <div style={{
              fontSize: '1em',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Auto-proceeding to Game {currentGame + 1} in 3 seconds...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdventureGame;
