import React, { useState } from 'react';
import './App.css';
import { soundManager } from './utils/sounds';
import { type RoomInfo } from './utils/p2pMultiplayer';
import { getPlayerName, getWinnerName } from './utils/gameLogic';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import { useGameLogic } from './hooks/useGameLogic';
import GameCanvas from './components/GameCanvas';

// Simple Game Component - Multiplayer Only
function SimpleGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [timeLimit] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  const getStatusMessage = () => {
    if (gameState.winner > 0) {
      return `${getWinnerName(gameState.winner as 1 | 2)} wins!`;
    }
    if (!gameState.isGameActive && gameState.winner === 0) {
      return 'Game Over - Draw!';
    }
    if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 2 : 1;
      return `${getPlayerName(winner)} wins due to time limit!`;
    }
    
    return `${getPlayerName(gameState.currentPlayer)}, Play!`;
  };

  // Calculate responsive sizes
  const isMobile = window.innerWidth <= 768;

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
        background: 'rgba(0, 0, 0, 0.9)',
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
        {/* Title and back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              onBackToMenu();
              if (soundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '1.2em' : '1em',
              backgroundColor: '#FFC30B',
              color: 'black',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
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
            🐝 Bee-Five
          </h1>
        </div>

        {/* Controls - stack on mobile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Sound control */}
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
          
          {/* New Game button */}
          <button 
            onClick={() => {
              resetGame();
              if (soundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '1em' : '0.9em',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isMobile ? '🔄' : '🔄 New'}
          </button>
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
              onCellClick={handleCellClick}
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
    </div>
  );
}

// AI Game Component with intelligent AI opponent
function AIGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [timeLimit] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [playerSkillLevel, setPlayerSkillLevel] = useState(0); // Dynamic difficulty tracking
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // AI move logic
  React.useEffect(() => {
    if (gameState.currentPlayer === 2 && gameState.isGameActive && gameState.winner === 0) {
      // AI's turn - make a move after a short delay
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.isGameActive, gameState.winner]);

  // Track game results for dynamic difficulty
  React.useEffect(() => {
    if (gameState.winner > 0) {
      if (gameState.winner === 1) {
        updatePlayerSkillLevel('win'); // Human won
      } else if (gameState.winner === 2) {
        updatePlayerSkillLevel('loss'); // AI won
      }
    }
  }, [gameState.winner]);

  const makeAIMove = () => {
    // Get available cells
    const availableCells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (gameState.board[row][col] === 0) {
          availableCells.push({ row, col });
        }
      }
    }

    if (availableCells.length === 0) return;

    // Always call getBestAIMove to get the proper AI strategy
    const selectedCell = getBestAIMove(availableCells);

    // Make the AI move
    handleCellClick(selectedCell.row, selectedCell.col);
  };

  const getBestAIMove = (availableCells: {row: number, col: number}[]) => {
    if (aiDifficulty === 'easy') {
      return getEasyAIMove(availableCells);
    } else if (aiDifficulty === 'medium') {
      return getMediumAIMove(availableCells);
    } else {
      return getHardAIMove(availableCells);
    }
  };

  const getEasyAIMove = (availableCells: {row: number, col: number}[]) => {
    // Easy AI: Focus on building 5-in-a-row, only block when human has 4-in-a-row
    
    // Priority 1: Check if AI can win in one move
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 2: Block human from winning (only when human has 4-in-a-row)
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkWinCondition(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 3: Look for AI opportunities (3-in-a-row and 4-in-a-row) - only if they can reach 5
    const aiOpportunities = findThreatCells(availableCells, 2);
    for (let cell of aiOpportunities) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 4: Look for AI 2-in-a-row opportunities - only if they can reach 5
    const aiTwoInARow = findTwoInARowCells(availableCells, 2);
    for (let cell of aiTwoInARow) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 5: Random move
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  const getMediumAIMove = (availableCells: {row: number, col: number}[]) => {
    // Medium AI: Fixed logic with proper threat detection
    
    // Priority 1: Check if AI can win in one move
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 2: Block human from winning (defend against 4-in-a-row)
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkWinCondition(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 3: Block human 3-in-a-row threats (direct simulation)
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 4: Look for AI opportunities (3-in-a-row) - only if they can reach 5
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 5: Block human 2-in-a-row threats
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 6: Look for AI 2-in-a-row opportunities - only if they can reach 5
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 7: Random move if no strategic options
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };

  const getHardAIMove = (availableCells: {row: number, col: number}[]) => {
    // Hard AI: Advanced minimax algorithm with alpha-beta pruning and deep lookahead
    
    // Check opening book for early game optimal moves
    const openingMove = getAdvancedOpeningMove(availableCells);
    if (openingMove) {
      return openingMove;
    }
    
    // CRITICAL: Always check for immediate threats first (defense priority)
    // Priority 1: Check if AI can win in one move
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 2: Block human from winning (defend against 4-in-a-row)
    for (let cell of availableCells) {
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        let humanCount = 0;
        let emptySpaces = 0;
        
        // Check the line in both directions
        for (let i = -4; i <= 4; i++) {
          const checkRow = cell.row + i * dRow;
          const checkCol = cell.col + i * dCol;
          if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
            if (gameState.board[checkRow][checkCol] === 1) {
              humanCount++;
            } else if (gameState.board[checkRow][checkCol] === 0) {
              emptySpaces++;
            }
          }
        }
        
        // If there are 4 human pieces and at least 1 empty space, block it
        if (humanCount >= 4 && emptySpaces >= 1) {
          console.log('Hard AI: Blocking 4-in-a-row threat at', cell.row, cell.col);
          return cell;
        }
      }
    }

    // Priority 3: Block human 3-in-a-row threats
    for (let cell of availableCells) {
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        let humanCount = 0;
        let emptySpaces = 0;
        
        // Check the line in both directions
        for (let i = -4; i <= 4; i++) {
          const checkRow = cell.row + i * dRow;
          const checkCol = cell.col + i * dCol;
          if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
            if (gameState.board[checkRow][checkCol] === 1) {
              humanCount++;
            } else if (gameState.board[checkRow][checkCol] === 0) {
              emptySpaces++;
            }
          }
        }
        
        // If there are 3 human pieces and enough empty spaces to reach 5, block it
        if (humanCount >= 3 && emptySpaces >= 2) {
          console.log('Hard AI: Blocking 3-in-a-row threat at', cell.row, cell.col);
          return cell;
        }
      }
    }

    // Priority 4: Block human 2-in-a-row threats
    for (let cell of availableCells) {
      // Check if this cell would block a human 2-in-a-row threat
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        let humanCount = 0;
        let emptySpaces = 0;
        
        // Check the line in both directions
        for (let i = -4; i <= 4; i++) {
          const checkRow = cell.row + i * dRow;
          const checkCol = cell.col + i * dCol;
          if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
            if (gameState.board[checkRow][checkCol] === 1) {
              humanCount++;
            } else if (gameState.board[checkRow][checkCol] === 0) {
              emptySpaces++;
            }
          }
        }
        
        // If there are 2 human pieces and enough empty spaces to reach 5, block it
        if (humanCount >= 2 && emptySpaces >= 3) {
          console.log('Hard AI: Blocking 2-in-a-row threat at', cell.row, cell.col);
          return cell;
        }
      }
    }

    // Priority 5: Block "X X _ X" pattern
    const gapBlockingMoves = findGapBlockingMoves(availableCells);
    if (gapBlockingMoves.length > 0) {
      return gapBlockingMoves[0];
    }
    
    // Dynamic difficulty adjustment based on player skill
    const adjustedDepth = getAdjustedDepth();
    
    // Use minimax algorithm for optimal move selection (dynamic depth)
    // Only use minimax if no immediate threats were found above
    const bestMove = minimax(gameState.board, adjustedDepth, -Infinity, Infinity, true, 2);
    if (bestMove.move) {
      return bestMove.move;
    }

    // Fallback to advanced threat detection if minimax fails
    return getAdvancedThreatMove(availableCells);
  };

  // Dynamic difficulty adjustment based on player performance
  const getAdjustedDepth = (): number => {
    // Base depth is 3, adjust based on player skill level
    const baseDepth = 3;
    
    if (playerSkillLevel < -2) {
      return Math.max(1, baseDepth - 2); // Easier for struggling players
    } else if (playerSkillLevel < 0) {
      return Math.max(2, baseDepth - 1); // Slightly easier
    } else if (playerSkillLevel > 2) {
      return Math.min(4, baseDepth + 1); // Harder for skilled players
    } else if (playerSkillLevel > 5) {
      return Math.min(5, baseDepth + 2); // Much harder for experts
    }
    
    return baseDepth; // Default depth
  };

  // Track player performance for dynamic difficulty
  const updatePlayerSkillLevel = (gameResult: 'win' | 'loss' | 'draw') => {
    if (gameResult === 'win') {
      setPlayerSkillLevel(prev => Math.min(10, prev + 1)); // Player getting better
    } else if (gameResult === 'loss') {
      setPlayerSkillLevel(prev => Math.max(-10, prev - 1)); // Player struggling
    }
    // Draw doesn't change skill level
  };

  // Advanced opening book for optimal first 8-10 moves
  const getAdvancedOpeningMove = (availableCells: {row: number, col: number}[]): {row: number, col: number} | null => {
    const totalMoves = 100 - availableCells.length;
    
    // First move - always center
    if (totalMoves === 0) {
      const center = availableCells.find(cell => cell.row === 4 && cell.col === 4) ||
                    availableCells.find(cell => cell.row === 5 && cell.col === 5) ||
                    availableCells.find(cell => cell.row === 4 && cell.col === 5) ||
                    availableCells.find(cell => cell.row === 5 && cell.col === 4);
      return center || null;
    }
    
    // Second move - adjacent to center
    if (totalMoves === 1) {
      const centerAdjacent = availableCells.filter(cell => {
        const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
        return distFromCenter <= 2 && distFromCenter > 0;
      });
      if (centerAdjacent.length > 0) {
        return centerAdjacent[Math.floor(Math.random() * centerAdjacent.length)];
      }
    }
    
    // Third move - strategic positioning
    if (totalMoves === 2) {
      const strategicCells = availableCells.filter(cell => {
        const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
        return distFromCenter <= 3;
      });
      if (strategicCells.length > 0) {
        return strategicCells[Math.floor(Math.random() * strategicCells.length)];
      }
    }
    
    // Fourth move - create threats
    if (totalMoves === 3) {
      const threatCells = availableCells.filter(cell => {
        const testBoard = gameState.board.map(row => [...row]);
        testBoard[cell.row][cell.col] = 2;
        return checkTwoInARow(testBoard, cell.row, cell.col, 2);
      });
      if (threatCells.length > 0) {
        return threatCells[0];
      }
    }
    
    // Fifth move - block human threats
    if (totalMoves === 4) {
      const blockCells = availableCells.filter(cell => {
        const testBoard = gameState.board.map(row => [...row]);
        testBoard[cell.row][cell.col] = 1;
        return checkTwoInARow(testBoard, cell.row, cell.col, 1);
      });
      if (blockCells.length > 0) {
        return blockCells[0];
      }
    }
    
    // Moves 6-8 - advanced positioning
    if (totalMoves >= 5 && totalMoves <= 7) {
      const strategicCells = availableCells.filter(cell => {
        const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
        return distFromCenter <= 4;
      });
      if (strategicCells.length > 0) {
        return strategicCells[Math.floor(Math.random() * strategicCells.length)];
      }
    }
    
    return null; // No opening book move available
  };

  // Advanced threat detection fallback
  const getAdvancedThreatMove = (availableCells: {row: number, col: number}[]): {row: number, col: number} => {
    // Priority 1: Check if AI can win in one move
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 2: Block human from winning
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkFourInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 3: Block human 3-in-a-row threats
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 4: Block human 2-in-a-row threats
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 1)) {
        return cell;
      }
    }

    // Priority 5: Block "X X _ X" pattern
    const gapBlockingMoves = findGapBlockingMoves(availableCells);
    if (gapBlockingMoves.length > 0) {
      return gapBlockingMoves[0];
    }

    // Priority 6: Create AI 3-in-a-row opportunities
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkThreeInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 7: Create AI 2-in-a-row opportunities
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 2;
      if (checkTwoInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
        return cell;
      }
    }

    // Priority 8: Center control
    const centerCells = availableCells.filter(cell => {
      const centerRow = Math.abs(cell.row - 4.5);
      const centerCol = Math.abs(cell.col - 4.5);
      return centerRow <= 2 && centerCol <= 2;
    });
    
    if (centerCells.length > 0) {
      return centerCells[Math.floor(Math.random() * centerCells.length)];
    }

    // Priority 9: Random move
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  };




  // Minimax algorithm with alpha-beta pruning for optimal move selection
  const minimax = (board: (0 | 1 | 2)[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, player: 1 | 2): {score: number, move?: {row: number, col: number}} => {
    // Base cases
    if (depth === 0) {
      return { score: evaluateBoardAdvanced(board, player) };
    }

    const availableCells = getAvailableCells(board);
    
    // Check for terminal states
    for (let cell of availableCells) {
      const testBoard = board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      if (checkWinCondition(testBoard, cell.row, cell.col, player)) {
        return { score: isMaximizing ? 100000 : -100000, move: cell };
      }
    }

    if (availableCells.length === 0) {
      return { score: 0 }; // Draw
    }

    let bestMove: {row: number, col: number} | undefined;
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let cell of availableCells) {
        const testBoard = board.map(row => [...row]);
        testBoard[cell.row][cell.col] = player;
        
        const result = minimax(testBoard, depth - 1, alpha, beta, false, player === 1 ? 2 : 1);
        const score = result.score;
        
        if (score > maxScore) {
          maxScore = score;
          bestMove = cell;
        }
        
        alpha = Math.max(alpha, score);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;
      for (let cell of availableCells) {
        const testBoard = board.map(row => [...row]);
        testBoard[cell.row][cell.col] = player;
        
        const result = minimax(testBoard, depth - 1, alpha, beta, true, player === 1 ? 2 : 1);
        const score = result.score;
        
        if (score < minScore) {
          minScore = score;
          bestMove = cell;
        }
        
        beta = Math.min(beta, score);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      return { score: minScore, move: bestMove };
    }
  };

  // Advanced evaluation function with weighted scoring
  const evaluateBoardAdvanced = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    
    // Evaluate all positions on the board
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === player) {
          score += evaluatePositionAdvanced(board, row, col, player);
        } else if (board[row][col] === opponent) {
          score -= evaluatePositionAdvanced(board, row, col, opponent);
        }
      }
    }
    
    // Bonus for center control
    score += getCenterControlBonus(board, player);
    
    // Bonus for mobility (available moves)
    score += getMobilityBonus(board);
    
    // Bonus for threat patterns
    score += getThreatPatternBonus(board, player);
    
    return score;
  };

  const evaluatePositionAdvanced = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): number => {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (let [dr, dc] of directions) {
      const lineScore = evaluateLineAdvanced(board, row, col, dr, dc, player);
      score += lineScore;
    }
    
    return score;
  };

  const evaluateLineAdvanced = (board: (0 | 1 | 2)[][], row: number, col: number, dr: number, dc: number, player: 1 | 2): number => {
    let count = 1; // Count the current piece
    let emptySpaces = 0;
    let blocked = false;
    
    // Check both directions
    for (let direction = -1; direction <= 1; direction += 2) {
      for (let i = 1; i <= 4; i++) {
        const newRow = row + (dr * i * direction);
        const newCol = col + (dc * i * direction);
        
        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) {
          blocked = true;
          break;
        }
        
        if (board[newRow][newCol] === player) {
          count++;
        } else if (board[newRow][newCol] === 0) {
          emptySpaces++;
        } else {
          blocked = true;
          break;
        }
      }
    }
    
    // Advanced scoring based on line potential and threats
    if (count >= 5) return 100000; // Win
    if (count === 4 && emptySpaces >= 1) return 10000; // 4-in-a-row
    if (count === 3 && emptySpaces >= 2) return 1000; // 3-in-a-row
    if (count === 2 && emptySpaces >= 3) return 100; // 2-in-a-row
    if (count === 1 && emptySpaces >= 4) return 10; // 1-in-a-row
    
    // Bonus for unblocked lines
    if (!blocked) {
      return 5;
    }
    
    return 0;
  };

  const getCenterControlBonus = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    let bonus = 0;
    const centerCells = [
      [4, 4], [4, 5], [5, 4], [5, 5],
      [3, 4], [3, 5], [4, 3], [4, 6],
      [5, 3], [5, 6], [6, 4], [6, 5]
    ];
    
    for (let [row, col] of centerCells) {
      if (board[row][col] === player) {
        bonus += 10;
      } else if (board[row][col] !== 0) {
        bonus -= 10;
      }
    }
    
    return bonus;
  };

  const getMobilityBonus = (board: (0 | 1 | 2)[][]): number => {
    const availableCells = getAvailableCells(board);
    return availableCells.length * 2; // More available moves = better position
  };

  const getThreatPatternBonus = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    let bonus = 0;
    
    // Check for forks (multiple threats)
    const forks = detectForks(board, player);
    bonus += forks * 500;
    
    // Check for double threats
    const doubleThreats = detectDoubleThreats(board, player);
    bonus += doubleThreats * 200;
    
    return bonus;
  };

  const detectForks = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    let forkCount = 0;
    const availableCells = getAvailableCells(board);
    
    for (let cell of availableCells) {
      const testBoard = board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      
      let threats = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let _ of directions) {
        if (checkThreeInARow(testBoard, cell.row, cell.col, player)) {
          threats++;
        }
      }
      
      if (threats >= 2) {
        forkCount++;
      }
    }
    
    return forkCount;
  };

  const detectDoubleThreats = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    let doubleThreatCount = 0;
    const availableCells = getAvailableCells(board);
    
    for (let cell of availableCells) {
      const testBoard = board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      
      let threats = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (let _ of directions) {
        if (checkTwoInARow(testBoard, cell.row, cell.col, player)) {
          threats++;
        }
      }
      
      if (threats >= 2) {
        doubleThreatCount++;
      }
    }
    
    return doubleThreatCount;
  };

  const getAvailableCells = (board: (0 | 1 | 2)[][]): {row: number, col: number}[] => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  };

  // Find moves that block the "X X _ X" pattern (3 pieces with 1 gap)
  const findGapBlockingMoves = (availableCells: {row: number, col: number}[]): {row: number, col: number}[] => {
    const blockingMoves = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = 1; // Test placing human piece
      
      // Check if this would create a gap pattern with 2+ human pieces
      if (hasGapPatternWithTwoPlus(testBoard, cell.row, cell.col, 1)) {
        blockingMoves.push(cell);
      }
    }
    
    return blockingMoves;
  };

  // Check if a position has the specific "X X _ X" pattern (3 pieces with 1 gap)
  const hasGapPatternWithTwoPlus = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical  
      [1, 1],   // diagonal \
      [1, -1]   // diagonal /
    ];

    for (let [dr, dc] of directions) {
      // Check both directions from the placed piece
      for (let direction = -1; direction <= 1; direction += 2) {
        let count = 1; // Count the piece we just placed
        let emptySpaces = 0;
        let hasSingleGap = false;
        
        // Look in the specified direction
        for (let i = 1; i <= 4; i++) {
          const newRow = row + (dr * i * direction);
          const newCol = col + (dc * i * direction);
          
          if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) break;
          
          if (board[newRow][newCol] === player) {
            count++;
          } else if (board[newRow][newCol] === 0) {
            emptySpaces++;
            if (emptySpaces === 1) {
              hasSingleGap = true;
            }
            if (emptySpaces > 1) break; // Only care about single gaps
          } else {
            break; // Opponent piece blocks the pattern
          }
        }
        
        // Only block if we have exactly 3 pieces with exactly 1 gap (X X _ X pattern)
        if (count === 3 && hasSingleGap && emptySpaces === 1) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Check if a line has potential to reach 5 pieces
  const canReachFive = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical  
      [1, 1],   // diagonal \
      [1, -1]   // diagonal /
    ];

    for (let [dr, dc] of directions) {
      let count = 1; // Count the piece we just placed
      let emptySpaces = 0;
      
      // Check both directions from the placed piece
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
            break; // Opponent piece blocks the line
          }
        }
      }
      
      // If we can potentially reach 5 pieces (count + empty spaces >= 5)
      if (count + emptySpaces >= 5) {
        return true;
      }
    }
    
    return false;
  };

  const findThreatCells = (availableCells: {row: number, col: number}[], player: 1 | 2) => {
    const threats = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      
      if (checkThreeInARow(testBoard, cell.row, cell.col, player)) {
        threats.push(cell);
      }
    }
    
    return threats;
  };


  const findTwoInARowCells = (availableCells: {row: number, col: number}[], player: 1 | 2) => {
    const threats = [];
    
    for (let cell of availableCells) {
      const testBoard = gameState.board.map(row => [...row]);
      testBoard[cell.row][cell.col] = player;
      
      if (checkTwoInARow(testBoard, cell.row, cell.col, player)) {
        threats.push(cell);
      }
    }
    
    return threats;
  };


  const checkThreeInARow = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
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

  const checkTwoInARow = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      // Check in positive direction
      for (let i = 1; i < 3; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
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


  const checkWinCondition = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
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

  const checkFourInARow = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 4) {
        return true;
      }
    }

    return false;
  };

  const getStatusMessage = () => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'You' : 'AI';
      return `${winnerName} win!`;
    }
    if (!gameState.isGameActive && gameState.winner === 0) {
      return 'Game Over - Draw!';
    }
    if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 'AI' : 'You';
      return `${winner} wins due to time limit!`;
    }
    
    return gameState.currentPlayer === 1 ? 'Your turn!' : 'AI is thinking...';
  };

  // Calculate responsive sizes
  const isMobile = window.innerWidth <= 768;

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
        background: 'rgba(0, 0, 0, 0.9)',
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
        {/* Title and back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              onBackToMenu();
              if (soundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '1.2em' : '1em',
              backgroundColor: '#FFC30B',
              color: 'black',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
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
            🤖 AI Challenge ({aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})
          </h1>
        </div>

        {/* Controls - stack on mobile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Difficulty selection */}
          <button
            onClick={() => {
              setShowDifficultyModal(true);
              if (soundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: '1em',
              backgroundColor: '#FFC30B',
              color: 'black',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isMobile ? '⚙️' : '⚙️ Difficulty'}
          </button>

          {/* Sound control */}
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
          
          {/* New Game button */}
          <button 
            onClick={() => {
              resetGame();
              if (soundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: isMobile ? '0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '1em' : '0.9em',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isMobile ? '🔄' : '🔄 New'}
          </button>
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

      {/* Difficulty Selection Modal */}
      {showDifficultyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ 
              color: '#FFC30B',
              marginBottom: '1rem',
              fontSize: '1.5rem',
              textShadow: '2px 2px 0px black'
            }}>
              Select AI Difficulty
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#333' }}>
              Choose the difficulty level for the AI opponent:
            </p>
            <div style={{ 
              position: 'relative',
              marginBottom: '1.5rem'
            }}>
              <select
                value={aiDifficulty}
                onChange={(e) => {
                  setAiDifficulty(e.target.value);
                  if (soundEnabled) soundManager.playClickSound();
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23333' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1rem',
                  paddingRight: '2.5rem',
                  color: '#333',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                <option value="easy" style={{ padding: '0.5rem', backgroundColor: 'white' }}>
                  🟢 Easy
                </option>
                <option value="medium" style={{ padding: '0.5rem', backgroundColor: 'white' }}>
                  🟡 Medium
                </option>
                <option value="hard" style={{ padding: '0.5rem', backgroundColor: 'white' }}>
                  🔴 Hard
                </option>
              </select>
            </div>
            <button
              onClick={() => {
                setShowDifficultyModal(false);
                if (soundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple inline welcome component to avoid import issues
function SimpleWelcome() {
  const [gameMode, setGameMode] = useState<'menu' | 'local-multiplayer' | 'online-lobby' | 'online-game' | 'ai-game'>('menu');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(1);

  // Handle local multiplayer mode
  if (gameMode === 'local-multiplayer') {
    return <SimpleGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle AI game mode
  if (gameMode === 'ai-game') {
    return <AIGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle online multiplayer lobby
  if (gameMode === 'online-lobby') {
    return (
      <MultiplayerLobby 
        onGameStart={(roomInfo: RoomInfo, playerNum: 1 | 2) => {
          setCurrentRoom(roomInfo);
          setPlayerNumber(playerNum);
          setGameMode('online-game');
        }}
        onBackToMenu={() => setGameMode('menu')}
      />
    );
  }

  // Handle online multiplayer game
  if (gameMode === 'online-game' && currentRoom) {
    return (
      <MultiplayerGame 
        roomInfo={currentRoom}
        playerNumber={playerNumber}
        onBackToLobby={() => setGameMode('online-lobby')}
        useCrossDevice={true}
      />
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFC30B 0%, #FFD700 50%, #FFC30B 100%)',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'clamp(0.5rem, 2vw, 1rem)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Decorative bee pattern background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        fontSize: 'clamp(2rem, 8vw, 4rem)',
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '2rem',
        padding: '2rem',
        zIndex: 0
      }}>
        {['🐝', '🍯', '🐝', '🍯', '🐝', '🍯', '🐝', '🍯', '🐝'].map((emoji, i) => (
          <div key={i} style={{ textAlign: 'center', transform: `rotate(${i * 15}deg)` }}>
            {emoji}
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 'clamp(15px, 3vw, 25px)',
        padding: 'clamp(1rem, 3vw, 2rem)',
        width: '100%',
        maxWidth: 'min(90vw, 450px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 3px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        animation: 'slideIn 0.6s ease-out',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Title */}
        <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
            color: '#FFC30B',
            textShadow: '3px 3px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black',
            margin: '0 0 clamp(0.5rem, 2vw, 1rem) 0',
            lineHeight: '1.1',
            fontWeight: 'bold'
          }}>
            🐝 Bee-<span style={{ color: 'black', textShadow: '3px 3px 0px #FFC30B, -1px -1px 0px #FFC30B, 1px -1px 0px #FFC30B, -1px 1px 0px #FFC30B' }}>Five</span> 🐝
          </h1>
        </div>

        {/* Game mode buttons */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(0.75rem, 2vw, 1rem)',
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
          width: '100%',
          maxWidth: '100%',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => {
              soundManager.playClickSound();
              setGameMode('local-multiplayer');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              fontWeight: 'bold',
              backgroundColor: 'black',
              color: '#FFC30B',
              border: '3px solid #FFC30B',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '60px',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>👥</span>
            <span>Take Turns</span>
          </button>

          <button 
            onClick={() => {
              soundManager.playClickSound();
              setGameMode('online-lobby');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              fontWeight: 'bold',
              backgroundColor: 'black',
              color: '#FFC30B',
              border: '3px solid #FFC30B',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '60px',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🌐</span>
            <span>Online Play</span>
          </button>

          <button 
            onClick={() => {
              soundManager.playClickSound();
              setGameMode('ai-game');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              fontWeight: 'bold',
              backgroundColor: 'black',
              color: '#FFC30B',
              border: '3px solid #FFC30B',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '60px',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🤖</span>
            <span>Play AI</span>
          </button>
        </div>

        {/* How to play */}
        <div style={{ 
          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
          color: '#666',
          lineHeight: '1.5',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>How to play:</strong> Click to place your pieces and try to get 5 in a row!
          </p>
          <p style={{ margin: 0 }}>
            🖤 <strong>Black pieces</strong> vs 🟡 <strong>Yellow pieces</strong>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: 'clamp(1rem, 3vw, 2rem)',
        color: 'rgba(0,0,0,0.6)',
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
        textAlign: 'center',
        zIndex: 1
      }}>
        <p style={{ margin: 0 }}>
          &copy; 2025 Bee-Five. Made with 🐝 and ❤️
        </p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .mobile-stack {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 480px) {
          .mobile-single {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <SimpleWelcome />
    </div>
  );
}

export default App;
