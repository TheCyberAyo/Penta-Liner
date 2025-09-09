import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { soundManager } from './utils/sounds';
import { type RoomInfo } from './utils/p2pMultiplayer';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGame } from './components/MultiplayerGame';

// Simple Game Component with Canvas and AI
function SimpleGame({ onBackToMenu, isSinglePlayer }: { onBackToMenu: () => void; isSinglePlayer: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [board, setBoard] = useState<(0 | 1 | 2)[][]>(() => 
    Array(10).fill(null).map(() => Array(10).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [gameActive, setGameActive] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [animatingPieces, setAnimatingPieces] = useState<Map<string, { 
    player: 1 | 2; 
    startTime: number; 
    row: number; 
    col: number; 
  }>>(new Map());
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);

  const GRID_SIZE = 10;
  const BORDER_WIDTH = 2;
  
  // Calculate responsive sizes
  const isMobile = window.innerWidth <= 768;
  const maxBoardSize = isMobile 
    ? Math.min(window.innerWidth - 40, window.innerHeight - 200) 
    : Math.min(500, window.innerWidth * 0.6, window.innerHeight * 0.7);
  
  const CELL_SIZE = Math.floor((maxBoardSize - (GRID_SIZE + 1) * BORDER_WIDTH) / GRID_SIZE);
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH;

  // Initialize Web Worker for AI
  useEffect(() => {
    if (isSinglePlayer) {
      workerRef.current = new Worker('/aiWorker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, move, computationTime } = e.data;
        
        if (type === 'bestMoveFound' && move) {
          console.log(`AI computed move in ${computationTime.toFixed(2)}ms`);
          setAiThinking(false);
          
          // Apply AI move
          setBoard(prevBoard => {
            const newBoard = prevBoard.map(row => [...row]);
            newBoard[move.row][move.col] = 2; // AI is player 2
            
            if (checkWin(newBoard, move.row, move.col, 2)) {
              setTimeout(() => {
                setWinner(2);
                setGameActive(false);
              }, 0);
            } else {
              setTimeout(() => {
                setCurrentPlayer(1); // Switch back to human player
              }, 0);
            }
            
            return newBoard;
          });
        }
        
        if (type === 'error') {
          console.error('AI Worker error:', e.data.message);
          setAiThinking(false);
          // Fallback to smart move
          makeSmartAiMove();
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setAiThinking(false);
        makeSmartAiMove();
      };
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [isSinglePlayer]);

  // Check for win condition
  const checkWin = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (const [dRow, dCol] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && board[newRow][newCol] === player) {
          count++;
        } else break;
      }
      
      if (count >= 5) return true;
    }
    return false;
  };

  // Smart AI move with strategic thinking
  const makeSmartAiMove = useCallback(() => {
    setAiThinking(false);
    setBoard(prevBoard => {
      let bestMove = findBestMove(prevBoard, difficulty);
      
      if (!bestMove) {
        // Fallback to random if no move found
        const emptyCells: { row: number; col: number }[] = [];
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            if (prevBoard[row][col] === 0) {
              emptyCells.push({ row, col });
            }
          }
        }
        if (emptyCells.length === 0) return prevBoard;
        bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      
      const newBoard = prevBoard.map(row => [...row]);
      newBoard[bestMove.row][bestMove.col] = 2;
      
      // Play AI buzz sound for piece placement
      if (soundEnabled) {
        setTimeout(() => {
          soundManager.playAIBuzzSound();
        }, 100); // Small delay to distinguish from human sound
      }
      
      // Start animation for AI piece
      const pieceKey = `${bestMove.row}-${bestMove.col}`;
      setAnimatingPieces(prev => {
        const newMap = new Map(prev);
        newMap.set(pieceKey, {
          player: 2,
          startTime: Date.now(),
          row: bestMove.row,
          col: bestMove.col
        });
        return newMap;
      });
      
      if (checkWin(newBoard, bestMove.row, bestMove.col, 2)) {
        setTimeout(() => {
          setWinner(2);
          setGameActive(false);
          
          // Show AI win popup
          setTimeout(() => {
            setWinMessage('AI Wins!');
            setShowWinPopup(true);
            
            // Play defeat sound for AI win
            if (soundEnabled) {
              soundManager.playDefeatSound();
            }
          }, 500);
        }, 0);
      } else {
        setTimeout(() => {
          setCurrentPlayer(1); // Switch back to human player
        }, 0);
      }
      
      return newBoard;
    });
  }, [checkWin, difficulty]);

  // Find the best move for AI using strategic analysis with strong defense
  const findBestMove = (board: (0 | 1 | 2)[][], difficulty: 'easy' | 'medium' | 'hard') => {
    const moves = getAvailableMoves(board);
    if (moves.length === 0) return null;

    // 1. Check for immediate winning moves
    for (const move of moves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = 2;
      if (checkWin(testBoard, move.row, move.col, 2)) {
        console.log('AI found winning move!');
        return move;
      }
    }

    // 2. Check for critical defensive moves (block human wins)
    for (const move of moves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = 1; // Test if human would win here
      if (checkWin(testBoard, move.row, move.col, 1)) {
        console.log('AI blocking human win!');
        return move; // Block this winning move
      }
    }

    // 3. Look for multiple threats (human has 2+ ways to win next turn)
    const criticalDefense = findCriticalDefense(board);
    if (criticalDefense) {
      console.log('AI defending against multiple threats!');
      return criticalDefense;
    }

    // 4. Strategic move evaluation
    let bestMove = null;
    let bestScore = -Infinity;

    const depthMap = { easy: 1, medium: 2, hard: 3 };
    const maxDepth = depthMap[difficulty];

    for (const move of moves) {
      const score = evaluateMove(board, move, 2, maxDepth);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || moves[0];
  };

  // Find critical defensive moves against multiple threats
  const findCriticalDefense = (board: (0 | 1 | 2)[][]) => {
    const moves = getAvailableMoves(board);
    const humanThreats = [];

    // Find all positions where human could win next turn
    for (const move of moves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = 1;
      if (checkWin(testBoard, move.row, move.col, 1)) {
        humanThreats.push(move);
      }
    }

    // If human has 2+ winning threats, try to find a move that blocks multiple
    if (humanThreats.length >= 2) {
      // Look for moves that create our own threats while defending
      for (const move of moves) {
        const testBoard = board.map(row => [...row]);
        testBoard[move.row][move.col] = 2;
        
        // Check if this move creates a winning threat for us
        const aiThreatCount = countThreats(testBoard, 2);
        const originalAiThreats = countThreats(board, 2);
        
        if (aiThreatCount > originalAiThreats) {
          return move; // This creates a counter-threat
        }
      }
      
      // If no counter-threat possible, block the most dangerous threat
      return humanThreats[0];
    }

    return null;
  };

  // Count the number of immediate winning threats for a player
  const countThreats = (board: (0 | 1 | 2)[][], player: 1 | 2): number => {
    const moves = getAvailableMoves(board);
    let threats = 0;

    for (const move of moves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = player;
      if (checkWin(testBoard, move.row, move.col, player)) {
        threats++;
      }
    }

    return threats;
  };

  // Get all available moves
  const getAvailableMoves = (board: (0 | 1 | 2)[][]) => {
    const moves: { row: number; col: number }[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  };

  // Evaluate a move's strategic value
  const evaluateMove = (board: (0 | 1 | 2)[][], move: { row: number; col: number }, player: 1 | 2, depth: number): number => {
    const newBoard = board.map(row => [...row]);
    newBoard[move.row][move.col] = player;

    // Check for immediate win
    if (checkWin(newBoard, move.row, move.col, player)) {
      return player === 2 ? 1000 : -1000;
    }

    if (depth === 0) {
      return evaluatePosition(newBoard, move.row, move.col, player);
    }

    // Simple minimax for deeper analysis
    const opponent = player === 1 ? 2 : 1;
    const opponentMoves = getAvailableMoves(newBoard);
    
    if (player === 2) {
      // Maximizing for AI
      let maxScore = -Infinity;
      for (const opponentMove of opponentMoves.slice(0, 5)) { // Limit for performance
        const score = evaluateMove(newBoard, opponentMove, opponent, depth - 1);
        maxScore = Math.max(maxScore, score);
      }
      return maxScore;
    } else {
      // Minimizing for human
      let minScore = Infinity;
      for (const opponentMove of opponentMoves.slice(0, 5)) { // Limit for performance
        const score = evaluateMove(newBoard, opponentMove, opponent, depth - 1);
        minScore = Math.min(minScore, score);
      }
      return minScore;
    }
  };

  // Evaluate the strategic value of a position with strong defensive focus
  const evaluatePosition = (board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): number => {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    // Evaluate offensive potential
    for (const [dRow, dCol] of directions) {
      score += evaluateLine(board, row, col, dRow, dCol, player);
    }

    // Evaluate defensive value (blocking opponent)
    const opponent = player === 1 ? 2 : 1;
    for (const [dRow, dCol] of directions) {
      const defensiveValue = evaluateLine(board, row, col, dRow, dCol, opponent);
      // Defensive moves are highly valued
      score += Math.abs(defensiveValue) * 1.5;
    }

    // Bonus for center positions
    const centerDistance = Math.abs(row - 5) + Math.abs(col - 5);
    score += (10 - centerDistance) * 2;

    // Penalty for edge positions (less strategic value)
    if (row === 0 || row === 9 || col === 0 || col === 9) {
      score -= 5;
    }

    // Bonus for positions that support multiple lines
    let lineCount = 0;
    for (const [dRow, dCol] of directions) {
      if (hasLineSupport(board, row, col, dRow, dCol, player)) {
        lineCount++;
      }
    }
    score += lineCount * 3;

    return score;
  };

  // Check if a position supports building a line
  const hasLineSupport = (board: (0 | 1 | 2)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2): boolean => {
    let supportCount = 0;
    
    // Check both directions for friendly pieces or empty spaces
    for (let i = 1; i <= 4; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === player || board[newRow][newCol] === 0) {
          supportCount++;
        } else {
          break;
        }
      }
    }
    
    for (let i = 1; i <= 4; i++) {
      const newRow = row - i * dRow;
      const newCol = col - i * dCol;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        if (board[newRow][newCol] === player || board[newRow][newCol] === 0) {
          supportCount++;
        } else {
          break;
        }
      }
    }
    
    return supportCount >= 4; // Need at least 4 supporting positions for a potential line
  };

  // Evaluate a line in a specific direction
  const evaluateLine = (board: (0 | 1 | 2)[][], row: number, col: number, dRow: number, dCol: number, player: 1 | 2): number => {
    let count = 0;
    let blocked = 0;
    let score = 0;

    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        count++;
      } else if (board[newRow][newCol] !== 0) {
        blocked++;
        break;
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dRow;
      const newCol = col - i * dCol;
      
      if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        count++;
      } else if (board[newRow][newCol] !== 0) {
        blocked++;
        break;
      } else {
        break;
      }
    }

    // Score based on count and blocking with enhanced defensive values
    if (blocked === 2) return 0; // Completely blocked
    
    if (player === 2) { // AI scoring
      if (count >= 4) return 1000; // AI about to win
      if (count === 3) return blocked === 0 ? 100 : 50; // Strong position
      if (count === 2) return blocked === 0 ? 20 : 10;
      if (count === 1) return 5;
    } else { // Human scoring (for defensive evaluation)
      if (count >= 4) return -1000; // Must block human win
      if (count === 3) return blocked === 0 ? -200 : -100; // Critical to block
      if (count === 2) return blocked === 0 ? -40 : -20; // Important to block
      if (count === 1) return -10;
    }
    
    return score;
  };

  // Animation constants
  const ANIMATION_DURATION = 400; // ms
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Draw the game board with smooth animations
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = Date.now();
    let needsRedraw = false;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw cells and pieces
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (CELL_SIZE + BORDER_WIDTH) + BORDER_WIDTH;
        const y = row * (CELL_SIZE + BORDER_WIDTH) + BORDER_WIDTH;

        // Cell background
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // Draw static pieces (already placed)
        const cellValue = board[row][col];
        const pieceKey = `${row}-${col}`;
        const animatingPiece = animatingPieces.get(pieceKey);

        if (cellValue !== 0) {
          let scale = 1;
          let opacity = 1;

          // Check if this piece is animating
          if (animatingPiece) {
            const elapsed = currentTime - animatingPiece.startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            
            // Smooth easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Scale animation: start small and grow
            scale = 0.1 + (0.9 * easeOut);
            
            // Opacity animation: fade in
            opacity = easeOut;

            if (progress < 1) {
              needsRedraw = true;
            } else {
              // Animation complete, remove from animating pieces
              setAnimatingPieces(prev => {
                const newMap = new Map(prev);
                newMap.delete(pieceKey);
                return newMap;
              });
            }
          }

          // Draw piece with animation effects
          ctx.save();
          ctx.globalAlpha = opacity;
          
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;
          const radius = (CELL_SIZE / 3) * scale;

          if (cellValue === 1) {
            ctx.fillStyle = '#000000'; // black
          } else {
            ctx.fillStyle = '#FFC30B'; // yellow
          }

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Add a subtle glow effect for new pieces
          if (animatingPiece && scale < 0.8) {
            ctx.shadowColor = cellValue === 1 ? '#333333' : '#FFD700';
            ctx.shadowBlur = 10 * (1 - scale);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }

        // Draw hover effect
        if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col && 
            cellValue === 0 && gameActive && !aiThinking && 
            (!isSinglePlayer || currentPlayer === 1)) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;
          const radius = CELL_SIZE / 3;

          if (currentPlayer === 1) {
            ctx.fillStyle = '#000000'; // black preview
          } else {
            ctx.fillStyle = '#FFC30B'; // yellow preview
          }

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }

        // Cell borders
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = BORDER_WIDTH;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Continue animation if needed
    if (needsRedraw) {
      animationFrameRef.current = requestAnimationFrame(drawGame);
    }
  }, [board, animatingPieces, hoveredCell, gameActive, aiThinking, currentPlayer, isSinglePlayer]);

  // Start animation loop
  useEffect(() => {
    drawGame();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawGame]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameActive || winner > 0 || aiThinking) return;
    if (isSinglePlayer && currentPlayer === 2) return; // AI's turn

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor((x - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && board[row][col] === 0) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      
      // Start animation for the new piece
      const pieceKey = `${row}-${col}`;
      setAnimatingPieces(prev => {
        const newMap = new Map(prev);
        newMap.set(pieceKey, {
          player: currentPlayer,
          startTime: Date.now(),
          row,
          col
        });
        return newMap;
      });
      
      setBoard(newBoard);
      
      // Play buzz sound for piece placement
      if (soundEnabled) {
        soundManager.playBuzzSound();
      }
      
      if (checkWin(newBoard, row, col, currentPlayer)) {
        setWinner(currentPlayer);
        setGameActive(false);
        
        // Show win popup with delay to let animation finish
        setTimeout(() => {
          const winnerName = isSinglePlayer 
            ? (currentPlayer === 1 ? 'You Win!' : 'AI Wins!')
            : (currentPlayer === 1 ? 'Black Wins!' : 'Yellow Wins!');
          setWinMessage(winnerName);
          setShowWinPopup(true);
          
          // Play victory or defeat sound
          if (soundEnabled) {
            if (isSinglePlayer && currentPlayer === 1) {
              soundManager.playVictorySound(); // Human wins
            } else if (isSinglePlayer && currentPlayer === 2) {
              soundManager.playDefeatSound(); // AI wins
            } else {
              soundManager.playVictorySound(); // Multiplayer win
            }
          }
        }, 500);
      } else {
        if (isSinglePlayer && currentPlayer === 1) {
          // Trigger AI move
          setCurrentPlayer(2);
          setAiThinking(true);
          
          setTimeout(() => {
            makeSmartAiMove();
          }, 500); // Small delay for better UX
        } else {
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }
      }
    }
  };

  // Handle mouse move for hover effect
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor((x - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const newCell = { row, col };
      const isNewHover = !hoveredCell || hoveredCell.row !== row || hoveredCell.col !== col;
      
      // Only play hover sound for new cells and if it's a valid move
      if (isNewHover && board[row][col] === 0 && gameActive && !aiThinking && 
          (!isSinglePlayer || currentPlayer === 1) && soundEnabled) {
        soundManager.playHoverSound();
      }
      
      setHoveredCell(newCell);
    } else {
      setHoveredCell(null);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(10).fill(null).map(() => Array(10).fill(0)));
    setCurrentPlayer(1);
    setWinner(0);
    setGameActive(true);
    setAiThinking(false);
    setAnimatingPieces(new Map()); // Clear all animations
    setShowWinPopup(false); // Hide popup
    setWinMessage('');
  };

  // Initialize sound manager settings
  useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  // Draw game when board changes
  useEffect(() => {
    drawGame();
  }, [drawGame]);

  const getStatusMessage = () => {
    if (winner > 0) {
      const winnerName = winner === 1 ? 'Black (You)' : 'Yellow (AI)';
      return isSinglePlayer ? `${winnerName} wins!` : `${winner === 1 ? 'Black' : 'Yellow'} wins!`;
    }
    if (aiThinking) {
      return 'AI is thinking...';
    }
    if (isSinglePlayer) {
      return currentPlayer === 1 ? 'Your turn (Black)' : 'AI turn (Yellow)';
    }
    return `${currentPlayer === 1 ? 'Black' : 'Yellow'}, Play!`;
  };

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
        
        {/* AI thinking indicator */}
        {aiThinking && (
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#FFC30B',
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ fontSize: '0.9em', color: '#666' }}>AI calculating best move...</span>
          </div>
        )}
      </div>

      {/* AI Difficulty selector for single player (mobile-optimized) */}
      {isSinglePlayer && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
          <label style={{ color: '#333', fontWeight: 'bold' }}>
            AI Level:
          </label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            disabled={gameActive && (board.some(row => row.some(cell => cell !== 0)) || aiThinking)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: '2px solid #ccc',
              backgroundColor: 'white',
              color: '#333',
              fontWeight: 'bold',
              fontSize: 'inherit'
            }}
          >
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
          
          {!isMobile && (
            <span style={{ color: '#666', fontSize: '0.8em', fontStyle: 'italic' }}>
              {difficulty === 'easy' && '1-move lookahead'}
              {difficulty === 'medium' && '2-move + blocking'}
              {difficulty === 'hard' && '3-move + counter-attacks'}
            </span>
          )}
        </div>
      )}

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
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              border: `${isMobile ? 3 : 4}px solid black`,
              borderRadius: isMobile ? '12px' : '15px',
              cursor: gameActive ? 'pointer' : 'default',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              background: 'rgba(135, 206, 235, 0.9)',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
          
          {/* Row numbers for larger screens */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              left: '-2rem',
              top: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: 'rgba(0,0,0,0.6)'
            }}>
              {Array.from({length: GRID_SIZE}, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
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
              {winMessage.includes('You Win') ? '🐝' : 
               winMessage.includes('AI Wins') ? '🐝' : '🐝'}
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
              {winMessage.includes('You Win') ? 'Sweet victory! 🍯' :
               winMessage.includes('AI Wins') ? 'The hive strikes back! 🍯' :
               'Game Over!'}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Play Again
              </button>
              
              <button 
                onClick={() => {
                  onBackToMenu();
                  if (soundEnabled) soundManager.playClickSound();
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Main Menu
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
  const [gameMode, setGameMode] = useState<'menu' | 'local-multiplayer' | 'single-player' | 'online-lobby' | 'online-game'>('menu');
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(1);

  // Handle single-player mode
  if (gameMode === 'single-player') {
    return <SimpleGame onBackToMenu={() => setGameMode('menu')} isSinglePlayer={true} />;
  }

  // Handle local multiplayer mode
  if (gameMode === 'local-multiplayer') {
    return <SimpleGame onBackToMenu={() => setGameMode('menu')} isSinglePlayer={false} />;
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
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'clamp(1rem, 4vw, 2rem)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'auto'
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
        padding: 'clamp(2rem, 6vw, 4rem)',
        width: '100%',
        maxWidth: 'min(90vw, 600px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 3px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        animation: 'slideIn 0.6s ease-out'
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
          <p style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.3rem)', 
            fontWeight: '600', 
            color: '#333',
            margin: 0,
            opacity: 0.8
          }}>
            Connect 5 pieces in a row to win!
          </p>
        </div>

        {/* Game mode buttons */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1rem)',
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
          maxWidth: '100%'
        }}>
          <button 
            onClick={() => {
              soundManager.playClickSound();
              setGameMode('single-player');
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
              minHeight: '60px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🤖</span>
            <span>vs Smart AI</span>
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
              minHeight: '60px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>👥</span>
            <span>Local Play</span>
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
              minHeight: '60px'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>🌐</span>
            <span>Online Play</span>
        </button>
        </div>

        {/* Feature highlights */}
        <div style={{ 
          background: 'rgba(135, 206, 235, 0.1)',
          borderRadius: 'clamp(8px, 2vw, 12px)',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
          border: '2px solid rgba(135, 206, 235, 0.3)'
        }}>
          <h3 style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#333',
            margin: '0 0 clamp(0.5rem, 2vw, 1rem) 0',
            fontWeight: 'bold'
          }}>
            🎮 Game Features
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 480 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
            color: '#555',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧠</span>
              <span><strong>Smart AI:</strong> 3 difficulty levels</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎵</span>
              <span><strong>Sound Effects:</strong> Bee-themed audio</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✨</span>
              <span><strong>Animations:</strong> Smooth gameplay</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏆</span>
              <span><strong>Win Celebration:</strong> Victory popup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🌐</span>
              <span><strong>P2P Multiplayer:</strong> No server needed!</span>
            </div>
          </div>
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