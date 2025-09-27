import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface GameState {
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  isGameActive: boolean;
  winner: 0 | 1 | 2;
  timeLeft: number;
  winningPieces?: { row: number; col: number }[]; // Optional for backward compatibility
}

export interface GameCanvasProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onGameStateChange: (newState: Partial<GameState>) => void;
}

const GRID_SIZE = 10;
const CELL_SIZE = 50;
const BORDER_WIDTH = 2;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH;

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onCellClick, 
  onGameStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Optimized rendering function
  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid background
    ctx.fillStyle = '#87CEEB'; // skyblue
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (CELL_SIZE + BORDER_WIDTH) + BORDER_WIDTH;
        const y = row * (CELL_SIZE + BORDER_WIDTH) + BORDER_WIDTH;

        // Cell background
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // Cell content based on game state
        const cellValue = gameState.board[row][col];
        const isWinningPiece = gameState.winningPieces && gameState.winningPieces.some(piece => piece.row === row && piece.col === col);
        
        if (cellValue === 1) {
          ctx.fillStyle = isWinningPiece ? '#FFD700' : '#000000'; // Gold for winning pieces, black otherwise
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (cellValue === 2) {
          ctx.fillStyle = isWinningPiece ? '#FFD700' : '#FFC30B'; // Gold for winning pieces, yellow otherwise
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Hover effect
        if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col && cellValue === 0) {
          ctx.fillStyle = gameState.currentPlayer === 1 ? 'rgba(0,0,0,0.3)' : 'rgba(255,195,11,0.3)';
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cell borders
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = BORDER_WIDTH;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw winning line if game is over
    if (gameState.winner > 0) {
      drawWinningLine(ctx);
    }
  }, [gameState, hoveredCell]);

  const drawWinningLine = (ctx: CanvasRenderingContext2D) => {
    // This would be enhanced to show the actual winning line
    // For now, just highlight the winner
    ctx.strokeStyle = gameState.winner === 1 ? '#000000' : '#FFC30B';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
    ctx.setLineDash([]);
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.isGameActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert canvas coordinates to grid coordinates
    const col = Math.floor((x - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));
    const row = Math.floor((y - BORDER_WIDTH) / (CELL_SIZE + BORDER_WIDTH));

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      onCellClick(row, col);
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
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        border: '2px solid #FFC30B',
        borderRadius: '8px',
        cursor: gameState.isGameActive ? 'pointer' : 'default',
        maxWidth: '90vw',
        maxHeight: '90vw',
        objectFit: 'contain'
      }}
    />
  );
};

export default GameCanvas;
