import React, { useState, useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import AdventureMap from './AdventureMap';
import { soundManager } from '../utils/sounds';
import { getTimeLimitForLevel, isInMudZone, checkWinCondition } from '../utils/gameLogic';
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
  const [showMatchVictoryPopup, setShowMatchVictoryPopup] = useState(false);
  const [matchVictoryMessage, setMatchVictoryMessage] = useState('');
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit: getTimeLimitForLevel(currentGame),
    gameNumber: currentGame,
    currentMatch: currentMatch
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
             
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`🎉 Match Victory! 🎉\n\nYou won the ${matchType} match!\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           } else {
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
             setShowMatchVictoryPopup(false);
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
             
             const matchType = getMatchType(currentGame);
             setMatchVictoryMessage(`🎉 Match Victory! 🎉\n\nYou won the ${matchType} match!\n\nAuto-proceeding to next game...`);
             setShowMatchVictoryPopup(true);
           } else {
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
             setShowMatchVictoryPopup(false);
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
      const timer = setTimeout(() => {
        makeAdventureAIMove();
      }, 500);
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
    
    const baseMessage = gameState.currentPlayer === 1 ? 'Your turn!' : 'AI is thinking...';
    return gameState.isBlindPlay ? `👁️‍🗨️ BLIND PLAY - ${gameState.currentPlayer === 1 ? 'Your turn!' : 'AI playing randomly...'}` : baseMessage;
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
    setShowMatchVictoryPopup(false);
  };

  const handleStageTransitionClose = () => {
    setShowStageTransition(false);
    if (soundEnabled) soundManager.playClickSound();
  };

  const isMobile = window.innerWidth <= 768;

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
    <BeeLifeStageEffects theme={currentTheme}>
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
          alignItems: 'center'
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
              🎉🐝🎉
            </div>
            
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
            
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '20px'
            }}>
              Game {currentGame} completed! | Total Wins: {gamesWon}
            </p>
            
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
    </BeeLifeStageEffects>
  );
};

export default AdventureGame;
