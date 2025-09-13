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
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Show popup when game ends
  React.useEffect(() => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'Black' : 'Yellow';
      setWinMessage(`${winnerName} wins! 🐝`);
      setShowWinPopup(true);
      
      if (gameState.winner === 1) {
        soundManager.playVictorySound();
      } else {
        soundManager.playDefeatSound();
      }
    } else if (!gameState.isGameActive && gameState.winner === 0) {
      setWinMessage('Game Over - Draw! 🐝');
      setShowWinPopup(true);
    } else if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 'Yellow' : 'Black';
      setWinMessage(`${winner} wins due to time limit! 🐝`);
      setShowWinPopup(true);
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

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
            
            {/* Subtitle */}
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px'
            }}>
              {winMessage.includes('Black') ? 'Sweet victory! 🍯' : winMessage.includes('Yellow') ? 'The hive strikes back! 🍯' : 'Great game! 🍯'}
            </p>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => {
                  resetGame();
                  setShowWinPopup(false);
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
                Play Again
              </button>
              
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
            </div>
            
            {/* Close button */}
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
          </div>
        </div>
      )}
    </div>
  );
}

// AI Game Component with intelligent AI opponent
function AIGame({ onBackToMenu, initialDifficulty = 'medium' }: { onBackToMenu: () => void; initialDifficulty?: string }) {
  const [timeLimit] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [aiDifficulty] = useState(initialDifficulty);
  // const [playerSkillLevel, setPlayerSkillLevel] = useState(0); // Dynamic difficulty tracking (currently unused)
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Show popup when game ends
  React.useEffect(() => {
    if (gameState.winner > 0) {
      // const winnerName = gameState.winner === 1 ? 'You' : 'You';
      const winText = gameState.winner === 1 ? 'You win!' : 'You lost!';
      setWinMessage(`${winText} 🐝`);
      setShowWinPopup(true);
      
      if (gameState.winner === 1) {
        soundManager.playVictorySound();
      } else {
        soundManager.playDefeatSound();
      }
    } else if (!gameState.isGameActive && gameState.winner === 0) {
      setWinMessage('Game Over - Draw! 🐝');
      setShowWinPopup(true);
    } else if (gameState.timeLeft === 0) {
      // const winner = gameState.currentPlayer === 1 ? 'You lost' : 'You';
      const winText = gameState.currentPlayer === 1 ? 'You lost due to time limit!' : 'You win due to time limit!';
      setWinMessage(`${winText} 🐝`);
      setShowWinPopup(true);
    }
  }, [gameState.winner, gameState.isGameActive, gameState.timeLeft, gameState.currentPlayer]);

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
        // updatePlayerSkillLevel('win'); // Human won (currently unused)
      } else if (gameState.winner === 2) {
        // updatePlayerSkillLevel('loss'); // AI won (currently unused)
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
  const checkGapPattern = (board: (0 | 1 | 2)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2): boolean => {
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

  // Helper function to check if position is valid
  const isValidPosition = (pos: {row: number, col: number}): boolean => {
    return pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10;
  };

  // Helper function to check if a line has potential to reach 5 pieces
  const canReachFive = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
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
  const checkOpenLine = (board: (0 | 1 | 2)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2, targetCount: number): boolean => {
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
  const checkSemiOpenLine = (board: (0 | 1 | 2)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2, targetCount: number): boolean => {
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

  // Dynamic difficulty adjustment based on player performance (currently unused)
  // const getAdjustedDepth = (): number => {
  //   // Base depth is 3, adjust based on player skill level
  //   const baseDepth = 3;
  //   
  //   if (playerSkillLevel < -2) {
  //     return Math.max(1, baseDepth - 2); // Easier for struggling players
  //   } else if (playerSkillLevel < 0) {
  //     return Math.max(2, baseDepth - 1); // Slightly easier
  //   } else if (playerSkillLevel > 2) {
  //     return Math.min(4, baseDepth + 1); // Harder for skilled players
  //   } else if (playerSkillLevel > 5) {
  //     return Math.min(5, baseDepth + 2); // Much harder for experts
  //   }
  //   
  //   return baseDepth; // Default depth
  // };

  // Track player performance for dynamic difficulty (currently unused)
  // const updatePlayerSkillLevel = (gameResult: 'win' | 'loss' | 'draw') => {
  //   if (gameResult === 'win') {
  //     setPlayerSkillLevel(prev => Math.min(10, prev + 1)); // Player getting better
  //   } else if (gameResult === 'loss') {
  //     setPlayerSkillLevel(prev => Math.max(-10, prev - 1)); // Player struggling
  //   }
  //   // Draw doesn't change skill level
  // };

  // Advanced opening book for optimal first 8-10 moves (currently unused)
  // const getAdvancedOpeningMove = (availableCells: {row: number, col: number}[]): {row: number, col: number} | null => {
  //   const totalMoves = 100 - availableCells.length;
  //   
  //   // First move - always center
  //   if (totalMoves === 0) {
  //     const center = availableCells.find(cell => cell.row === 4 && cell.col === 4) ||
  //                   availableCells.find(cell => cell.row === 5 && cell.col === 5) ||
  //                   availableCells.find(cell => cell.row === 4 && cell.col === 5) ||
  //                   availableCells.find(cell => cell.row === 5 && cell.col === 4);
  //     return center || null;
  //   }
  //   
  //   // Second move - adjacent to center
  //   if (totalMoves === 1) {
  //     const centerAdjacent = availableCells.filter(cell => {
  //       const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
  //       return distFromCenter <= 2 && distFromCenter > 0;
  //     });
  //     if (centerAdjacent.length > 0) {
  //       return centerAdjacent[Math.floor(Math.random() * centerAdjacent.length)];
  //     }
  //   }
  //   
  //   // Third move - strategic positioning
  //   if (totalMoves === 2) {
  //     const strategicCells = availableCells.filter(cell => {
  //       const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
  //       return distFromCenter <= 3;
  //     });
  //     if (strategicCells.length > 0) {
  //       return strategicCells[Math.floor(Math.random() * strategicCells.length)];
  //     }
  //   }
  //   
  //   // Fourth move - create threats
  //   if (totalMoves === 3) {
  //     const threatCells = availableCells.filter(cell => {
  //       const testBoard = gameState.board.map(row => [...row]);
  //       testBoard[cell.row][cell.col] = 2;
  //       return checkTwoInARow(testBoard, cell.row, cell.col, 2);
  //     });
  //     if (threatCells.length > 0) {
  //       return threatCells[0];
  //     }
  //   }
  //   
  //   // Fifth move - block human threats
  //   if (totalMoves === 4) {
  //     const blockCells = availableCells.filter(cell => {
  //       const testBoard = gameState.board.map(row => [...row]);
  //       testBoard[cell.row][cell.col] = 1;
  //       return checkTwoInARow(testBoard, cell.row, cell.col, 1);
  //     });
  //     if (blockCells.length > 0) {
  //       return blockCells[0];
  //     }
  //   }
  //   
  //   // Moves 6-8 - advanced positioning
  //   if (totalMoves >= 5 && totalMoves <= 7) {
  //     const strategicCells = availableCells.filter(cell => {
  //       const distFromCenter = Math.abs(cell.row - 4.5) + Math.abs(cell.col - 4.5);
  //       return distFromCenter <= 4;
  //     });
  //     if (strategicCells.length > 0) {
  //       return strategicCells[Math.floor(Math.random() * strategicCells.length)];
  //     }
  //   }
  //   
  //   return null; // No opening book move available
  // };

  // Advanced threat detection fallback (currently unused)
  // const getAdvancedThreatMove = (availableCells: {row: number, col: number}[]): {row: number, col: number} => {
  //   // Priority 1: Check if AI can win in one move
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 2;
  //     if (checkWinCondition(testBoard, cell.row, cell.col, 2)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 2: Block human from winning
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 1;
  //     if (checkFourInARow(testBoard, cell.row, cell.col, 1)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 3: Block human 3-in-a-row threats
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 1;
  //     if (checkThreeInARow(testBoard, cell.row, cell.col, 1)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 4: Block human 2-in-a-row threats
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 1;
  //     if (checkTwoInARow(testBoard, cell.row, cell.col, 1)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 5: Block "X X _ X" pattern
  //   const gapBlockingMoves = findGapBlockingMoves(availableCells);
  //   if (gapBlockingMoves.length > 0) {
  //     return gapBlockingMoves[0];
  //   }

  //   // Priority 6: Create AI 3-in-a-row opportunities
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 2;
  //     if (checkThreeInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 7: Create AI 2-in-a-row opportunities
  //   for (let cell of availableCells) {
  //     const testBoard = gameState.board.map(row => [...row]);
  //     testBoard[cell.row][cell.col] = 2;
  //     if (checkTwoInARow(testBoard, cell.row, cell.col, 2) && canReachFive(testBoard, cell.row, cell.col, 2)) {
  //       return cell;
  //     }
  //   }

  //   // Priority 8: Center control
  //   const centerCells = availableCells.filter(cell => {
  //     const centerRow = Math.abs(cell.row - 4.5);
  //     const centerCol = Math.abs(cell.col - 4.5);
  //     return centerRow <= 2 && centerCol <= 2;
  //   });
  //   
  //   if (centerCells.length > 0) {
  //     return centerCells[Math.floor(Math.random() * centerCells.length)];
  //   }

  //   // Priority 9: Random move
  //   return availableCells[Math.floor(Math.random() * availableCells.length)];
  // };




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

  // const checkFourInARow = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2) => {
  //   const directions = [
  //     [0, 1],   // horizontal
  //     [1, 0],   // vertical
  //     [1, 1],   // diagonal /
  //     [1, -1]   // diagonal \
  //   ];

  //   for (const [dRow, dCol] of directions) {
  //     let count = 1;

  //     // Check in positive direction
  //     for (let i = 1; i < 4; i++) {
  //       const newRow = row + i * dRow;
  //       const newCol = col + i * dCol;
  //       if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
  //         count++;
  //       } else {
  //         break;
  //       }
  //     }

  //     // Check in negative direction
  //     for (let i = 1; i < 4; i++) {
  //       const newRow = row - i * dRow;
  //       const newCol = col - i * dCol;
  //       if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
  //         count++;
  //       } else {
  //         break;
  //       }
  //     }

  //     if (count >= 4) {
  //       return true;
  //     }
  //   }

  //   return false;
  // };

  const getStatusMessage = () => {
    if (gameState.winner > 0) {
      const winText = gameState.winner === 1 ? 'You win!' : 'You lost!';
      return winText;
    }
    if (!gameState.isGameActive && gameState.winner === 0) {
      return 'Game Over - Draw!';
    }
    if (gameState.timeLeft === 0) {
      const winText = gameState.currentPlayer === 1 ? 'You lost due to time limit!' : 'You win due to time limit!';
      return winText;
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
        {/* Back button */}
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
        
        {/* Centered Title */}
        <h1 style={{ 
          color: '#FFC30B', 
          margin: 0,
          fontSize: isMobile ? 'clamp(1.2rem, 4vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2rem)',
          textShadow: '2px 2px 0px black',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          🤖 AI
        </h1>

        {/* Controls - stack on mobile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Play button - only show when game is over */}
          {(!gameState.isGameActive || gameState.winner > 0) && (
            <button
              onClick={() => {
                resetGame();
                if (soundEnabled) soundManager.playClickSound();
              }}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1em',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                minWidth: '60px',
                height: '40px'
              }}
            >
              ▶️ Play
            </button>
          )}

          {/* Level display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '2px solid black',
            borderRadius: '8px',
            overflow: 'hidden',
            minWidth: '120px',
            height: '40px'
          }}>
            <div style={{
              backgroundColor: 'black',
              color: '#FFC30B',
              padding: '0.5rem 0.75rem',
              fontSize: '0.9em',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '1'
            }}>
              Level
            </div>
            <div style={{
              backgroundColor: '#FFC30B',
              color: 'black',
              padding: '0.5rem 0.75rem',
              fontSize: '0.9em',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '1'
            }}>
              {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}
            </div>
          </div>

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
            
            {/* Subtitle */}
            <p style={{
              fontSize: '1.2em',
              color: '#333',
              marginBottom: '30px'
            }}>
              {winMessage.includes('You win') ? 'Sweet victory! 🍯' : winMessage.includes('AI win') ? 'The AI strikes back! 🍯' : 'Great game! 🍯'}
            </p>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => {
                  resetGame();
                  setShowWinPopup(false);
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
                Play Again
              </button>
              
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
            </div>
            
            {/* Close button */}
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
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  // Handle local multiplayer mode
  if (gameMode === 'local-multiplayer') {
    return <SimpleGame onBackToMenu={() => setGameMode('menu')} />;
  }

  // Handle AI game mode
  if (gameMode === 'ai-game') {
    return <AIGame onBackToMenu={() => setGameMode('menu')} initialDifficulty={aiDifficulty} />;
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
              setShowDifficultyModal(true);
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
            backgroundColor: '#FFC30B',
            padding: '40px',
            borderRadius: '20px',
            border: '4px solid black',
            textAlign: 'center',
            minWidth: '300px',
            maxWidth: '90vw',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '2em',
              color: 'black',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              Select AI Difficulty
            </h2>
            <p style={{
              fontSize: '1.1em',
              color: '#333',
              marginBottom: '30px'
            }}>
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
                  soundManager.playClickSound();
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
                setGameMode('ai-game');
                soundManager.playClickSound();
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

function App() {
  return (
    <div className="app">
      <SimpleWelcome />
    </div>
  );
}

export default App;
