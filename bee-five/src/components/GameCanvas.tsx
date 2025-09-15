import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type GameState } from '../hooks/useGameLogic';
import { GRID_SIZE, CELL_SIZE, BORDER_WIDTH, CANVAS_SIZE, MULTIPLAYER_CELL_SIZE, MULTIPLAYER_CANVAS_SIZE } from '../constants/gameConstants';

export interface GameCanvasProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onCellClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [touchedCell, setTouchedCell] = useState<{ row: number; col: number } | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Detect device type and calculate optimal sizing
  const isMobile = windowSize.width <= 768;
  const isTablet = windowSize.width <= 1024 && windowSize.width > 768;
  
  // Calculate optimal cell size based on screen size
  let currentCellSize: number;
  let currentCanvasSize: number;
  
  if (isMobile) {
    currentCellSize = MULTIPLAYER_CELL_SIZE;
    currentCanvasSize = MULTIPLAYER_CANVAS_SIZE;
  } else if (isTablet) {
    // Medium size for tablets
    currentCellSize = 50;
    currentCanvasSize = GRID_SIZE * currentCellSize + (GRID_SIZE + 1) * BORDER_WIDTH;
  } else {
    // Full size for desktop
    currentCellSize = CELL_SIZE;
    currentCanvasSize = CANVAS_SIZE;
  }

  // Optimized rendering function
  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, currentCanvasSize, currentCanvasSize);

    // Draw grid background
    ctx.fillStyle = '#87CEEB'; // skyblue
    ctx.fillRect(0, 0, currentCanvasSize, currentCanvasSize);

    // Draw cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (currentCellSize + BORDER_WIDTH) + BORDER_WIDTH;
        const y = row * (currentCellSize + BORDER_WIDTH) + BORDER_WIDTH;

        // Cell background
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, currentCellSize, currentCellSize);

        // Cell content based on game state
        const cellValue = gameState.board[row][col];
        if (cellValue === 1) {
          ctx.fillStyle = '#000000'; // black
          ctx.beginPath();
          ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (cellValue === 2) {
          ctx.fillStyle = '#FFC30B'; // yellow
          ctx.beginPath();
          ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Touch feedback effect (stronger than hover)
        if (touchedCell && touchedCell.row === row && touchedCell.col === col && cellValue === 0) {
          ctx.fillStyle = gameState.currentPlayer === 1 ? 'rgba(0,0,0,0.5)' : 'rgba(255,195,11,0.5)';
          ctx.beginPath();
          ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Hover effect (only show if not touched)
        else if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col && cellValue === 0) {
          ctx.fillStyle = gameState.currentPlayer === 1 ? 'rgba(0,0,0,0.3)' : 'rgba(255,195,11,0.3)';
          ctx.beginPath();
          ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cell borders
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = BORDER_WIDTH;
        ctx.strokeRect(x, y, currentCellSize, currentCellSize);
      }
    }

    // Draw winning line if game is over
    if (gameState.winner > 0) {
      drawWinningLine(ctx);
    }
  }, [gameState, hoveredCell, touchedCell, currentCellSize, currentCanvasSize]);

  const drawWinningLine = (ctx: CanvasRenderingContext2D) => {
    // This would be enhanced to show the actual winning line
    // For now, just highlight the winner
    ctx.strokeStyle = gameState.winner === 1 ? '#000000' : '#FFC30B';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(2, 2, currentCanvasSize - 4, currentCanvasSize - 4);
    ctx.setLineDash([]);
  };

  // Handle canvas click/touch
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.isGameActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling factor due to CSS maxWidth/maxHeight
    const scaleX = currentCanvasSize / rect.width;
    const scaleY = currentCanvasSize / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Convert canvas coordinates to grid coordinates
    const col = Math.floor((x - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      onCellClick(row, col);
    }
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameState.isGameActive) return;

    // Prevent default touch behaviors like scrolling and zooming
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    
    // Calculate scaling factor due to CSS maxWidth/maxHeight
    const scaleX = currentCanvasSize / rect.width;
    const scaleY = currentCanvasSize / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Convert canvas coordinates to grid coordinates
    const col = Math.floor((x - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      // Show touch feedback
      setTouchedCell({ row, col });
      
      // Clear touch feedback after a short delay
      setTimeout(() => {
        setTouchedCell(null);
      }, 150);
      
      onCellClick(row, col);
    }
  };

  // Prevent touch move from interfering with the game
  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  // Prevent touch end from causing issues
  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  // Handle mouse move for hover effect
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling factor due to CSS maxWidth/maxHeight
    const scaleX = currentCanvasSize / rect.width;
    const scaleY = currentCanvasSize / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const col = Math.floor((x - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (currentCellSize + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      drawGame(ctx);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawGame]);

  return (
    <canvas
      ref={canvasRef}
      width={currentCanvasSize}
      height={currentCanvasSize}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        border: '2px solid #FFC30B',
        borderRadius: '8px',
        cursor: gameState.isGameActive ? 'pointer' : 'default',
        maxWidth: isMobile ? '90vw' : 'min(80vw, 80vh, 700px)',
        maxHeight: isMobile ? '90vw' : 'min(80vw, 80vh, 700px)',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        touchAction: 'none', // Prevent default touch behaviors
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
};

export default GameCanvas;