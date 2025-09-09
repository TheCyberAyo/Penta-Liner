import { useState, useRef, useEffect, useCallback } from 'react';
import { p2pClient, type GameMove, type RoomInfo } from '../utils/p2pMultiplayer';
import { simpleMultiplayerClient, type SimpleMove, type SimpleGameState } from '../utils/simpleMultiplayer';
import { soundManager } from '../utils/sounds';

interface MultiplayerGameProps {
  roomInfo: RoomInfo;
  playerNumber: 1 | 2;
  onBackToLobby: () => void;
}

export function MultiplayerGame({ roomInfo, playerNumber, onBackToLobby }: MultiplayerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<(0 | 1 | 2)[][]>(() => 
    Array(10).fill(null).map(() => Array(10).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [gameActive, setGameActive] = useState(true);
  const [animatingPieces, setAnimatingPieces] = useState<Map<string, { 
    player: 1 | 2; 
    startTime: number; 
    row: number; 
    col: number; 
  }>>(new Map());
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [opponentName, setOpponentName] = useState<string>('');

  const GRID_SIZE = 10;
  const CELL_SIZE = 40;
  const BORDER_WIDTH = 2;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH;
  const ANIMATION_DURATION = 400;
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize multiplayer event handlers
  useEffect(() => {
    // Find opponent name
    const opponent = roomInfo.players.find(p => p.playerNumber !== playerNumber);
    setOpponentName(opponent?.name || 'Opponent');

    // Set up simple multiplayer client
    simpleMultiplayerClient.createRoom(roomInfo.roomId, playerNumber);
    
    // Set up move callback
    simpleMultiplayerClient.onMove((move: SimpleMove) => {
      console.log('📥 Received move from opponent:', move);
      applyMove(move);
    });

    // Set up game state callback
    simpleMultiplayerClient.onGameState((gameState: SimpleGameState) => {
      console.log('📥 Received game state from opponent:', gameState);
      setBoard(gameState.board);
      setCurrentPlayer(gameState.currentPlayer);
      setWinner(gameState.winner);
      setGameActive(gameState.gameActive);
    });

    // Set up P2P event handlers as backup
    p2pClient.onGameMove = (move: GameMove) => {
      // Only process moves from opponent
      if (move.player !== playerNumber) {
        applyMove(move);
      }
    };

    p2pClient.onGameReset = () => {
      resetGameState();
    };

    p2pClient.onDisconnected = () => {
      setConnectionStatus('disconnected');
    };

    p2pClient.onConnected = () => {
      setConnectionStatus('connected');
    };

    // No need for onRoomLeft in P2P - handled by disconnect

    return () => {
      // Clean up event handlers
      p2pClient.onGameMove = null;
      p2pClient.onGameReset = null;
      p2pClient.onDisconnected = null;
      p2pClient.onConnected = null;
    };
  }, [roomInfo, playerNumber, onBackToLobby]);

  // Apply a move to the game board (handles both SimpleMove and GameMove)
  const applyMove = useCallback((move: SimpleMove | GameMove) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      newBoard[move.row][move.col] = move.player;
      return newBoard;
    });

    // Start animation for the move
    const pieceKey = `${move.row}-${move.col}`;
    setAnimatingPieces(prev => {
      const newMap = new Map(prev);
      newMap.set(pieceKey, {
        player: move.player,
        startTime: Date.now(),
        row: move.row,
        col: move.col
      });
      return newMap;
    });

    // Play sound for opponent moves
    if (move.player !== playerNumber) {
      soundManager.playAIBuzzSound();
    }

    // Check for win condition
    const newBoard = board.map(row => [...row]);
    newBoard[move.row][move.col] = move.player;
    
    if (checkWin(newBoard, move.row, move.col, move.player)) {
      setTimeout(() => {
        setWinner(move.player);
        setGameActive(false);
        
        setTimeout(() => {
          const isPlayerWin = move.player === playerNumber;
          setWinMessage(isPlayerWin ? 'You Win!' : `${opponentName} Wins!`);
          setShowWinPopup(true);
          
          if (isPlayerWin) {
            soundManager.playVictorySound();
          } else {
            soundManager.playDefeatSound();
          }
        }, 500);
      }, 0);
    } else {
      // Switch turns
      setCurrentPlayer(move.player === 1 ? 2 : 1);
    }
  }, [board, playerNumber, opponentName]);

  // Check for win condition
  const checkWin = useCallback((board: (0 | 1 | 2)[][], row: number, col: number, player: 1 | 2): boolean => {
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
  }, []);

  // Draw the game board with animations
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
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            scale = 0.1 + (0.9 * easeOut);
            opacity = easeOut;

            if (progress < 1) {
              needsRedraw = true;
            } else {
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

          // Add glow effect for new pieces
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

        // Draw hover effect (only for current player's turn)
        if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col && 
            cellValue === 0 && gameActive && currentPlayer === playerNumber) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          
          const centerX = x + CELL_SIZE / 2;
          const centerY = y + CELL_SIZE / 2;
          const radius = CELL_SIZE / 3;

          if (playerNumber === 1) {
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
  }, [board, animatingPieces, hoveredCell, gameActive, currentPlayer, playerNumber]);

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
    if (!gameActive || winner > 0 || currentPlayer !== playerNumber) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor((x - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && board[row][col] === 0) {
      // Make the move locally
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);

      // Add animation
      const animationKey = `${row}-${col}`;
      setAnimatingPieces(prev => new Map(prev).set(animationKey, {
        player: currentPlayer,
        startTime: Date.now(),
        row,
        col
      }));

      // Check for win
      const winResult = checkWin(newBoard, row, col, currentPlayer);
      let newWinner: 0 | 1 | 2 = 0;
      let newGameActive: boolean = gameActive;
      
      if (winResult) {
        newWinner = currentPlayer;
        newGameActive = false;
        setWinner(newWinner);
        setGameActive(false);
        setShowWinPopup(true);
        setWinMessage(newWinner === playerNumber ? 'You won! 🐝' : 'Opponent won! 🐝');
        soundManager.playVictorySound();
      } else {
        // Switch turns
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }

      // Send move to other players via simple multiplayer
      simpleMultiplayerClient.sendMove(row, col);
      
      // Send game state to other players
      const gameState: SimpleGameState = {
        board: newBoard,
        currentPlayer: currentPlayer === 1 ? 2 : 1,
        winner: newWinner,
        gameActive: newGameActive,
        lastMove: {
          row,
          col,
          player: currentPlayer,
          timestamp: Date.now(),
          roomId: roomInfo.roomId
        }
      };
      simpleMultiplayerClient.sendGameState(gameState);

      // Also send via P2P as backup
      const move: GameMove = {
        row,
        col,
        player: playerNumber,
        timestamp: Date.now()
      };
      p2pClient.sendGameMove(move);
      
      // Play sound
      soundManager.playBuzzSound();
    }
  };

  // Handle mouse move for hover effect
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentPlayer !== playerNumber || !gameActive) return;

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
      
      if (isNewHover && board[row][col] === 0) {
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

  // Reset game state
  const resetGameState = () => {
    setBoard(Array(10).fill(null).map(() => Array(10).fill(0)));
    setCurrentPlayer(1);
    setWinner(0);
    setGameActive(true);
    setAnimatingPieces(new Map());
    setShowWinPopup(false);
    setWinMessage('');
  };

  // Reset game (host only)
  const resetGame = () => {
    resetGameState();
    p2pClient.sendGameReset();
    soundManager.playClickSound();
  };

  // Leave game
  const handleLeaveGame = () => {
    p2pClient.leaveRoom();
    soundManager.playClickSound();
  };

  const getStatusMessage = () => {
    if (winner > 0) {
      const winnerName = winner === playerNumber ? 'You' : opponentName;
      return `${winnerName} wins!`;
    }
    
    if (connectionStatus === 'disconnected') {
      return '❌ Disconnected from server';
    }
    
    if (connectionStatus === 'reconnecting') {
      return '🔄 Reconnecting...';
    }
    
    if (currentPlayer === playerNumber) {
      return `Your turn (${playerNumber === 1 ? 'Black' : 'Yellow'})`;
    } else {
      return `${opponentName}'s turn (${currentPlayer === 1 ? 'Black' : 'Yellow'})`;
    }
  };

  const isHost = roomInfo.players.find(p => p.playerNumber === playerNumber)?.isHost || false;

  return (
    <div style={{ 
      backgroundColor: '#FFC30B', 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Header with game info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%', 
        maxWidth: '500px', 
        marginBottom: '20px' 
      }}>
        <div>
          <h1 style={{ color: 'black', margin: 0 }}>
            Bee-<span style={{ color: 'black' }}>Five</span>
          </h1>
          <div style={{ fontSize: '0.8em', color: 'black' }}>
            Room: {roomInfo.roomId}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9em', color: 'black', marginBottom: '5px' }}>
            You: {playerNumber === 1 ? 'Black' : 'Yellow'}
          </div>
          <div style={{ fontSize: '0.9em', color: 'black' }}>
            {opponentName}: {playerNumber === 1 ? 'Yellow' : 'Black'}
          </div>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          border: '2px solid black',
          borderRadius: '8px',
          cursor: (gameActive && currentPlayer === playerNumber) ? 'pointer' : 'default',
          marginBottom: '20px'
        }}
      />
      
      <div style={{ 
        fontSize: '1.2em', 
        fontWeight: 'bold', 
        color: 'black',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        {getStatusMessage()}
      </div>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        {isHost && (
          <button 
            onClick={resetGame}
            disabled={connectionStatus !== 'connected'}
            style={{
              padding: '10px 20px',
              fontSize: '1em',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              cursor: connectionStatus !== 'connected' ? 'not-allowed' : 'pointer',
              opacity: connectionStatus !== 'connected' ? 0.5 : 1
            }}
          >
            🔄 Restart Game
          </button>
        )}
        
        <button 
          onClick={handleLeaveGame}
          style={{
            padding: '10px 20px',
            fontSize: '1em',
            backgroundColor: '#f44336',
            color: 'white',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🚪 Leave Game
        </button>
      </div>

      {/* Connection Status Indicator */}
      {connectionStatus !== 'connected' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: connectionStatus === 'disconnected' ? '#f44336' : '#ff9800',
          color: 'white',
          borderRadius: '5px',
          border: '2px solid black',
          fontSize: '0.9em'
        }}>
          {connectionStatus === 'disconnected' ? '❌ Disconnected' : '🔄 Reconnecting...'}
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
              {winMessage.includes('You Win') ? 'Sweet victory! 🍯' : 'The hive strikes back! 🍯'}
            </p>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {isHost && (
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
              )}
              
              <button 
                onClick={handleLeaveGame}
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
                Leave Game
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
