import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { GRID_SIZE, CELL_SIZE, BORDER_WIDTH } from '../constants/gameConstants';

interface GameCanvasProps {
  gameState: {
    board: (0 | 1 | 2 | 3)[][];
    winningPieces: { row: number; col: number }[];
    isBlindPlay: boolean;
    mudZones: { row: number; col: number }[];
    isGameActive?: boolean;
    currentPlayer?: 1 | 2;
    winner?: 0 | 1 | 2;
  };
  onCellClick: (row: number, col: number) => void;
  onGameStateChange?: (gameState: any) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onCellClick,
  onGameStateChange,
}) => {
  const { board, winningPieces, isBlindPlay, mudZones } = gameState;
  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - 40, GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH);
  const cellSize = (canvasSize - (GRID_SIZE + 1) * BORDER_WIDTH) / GRID_SIZE;

  // Debug logging
  console.log('GameCanvas render:', {
    boardExists: !!board,
    boardSize: board?.length,
    winningPieces: winningPieces?.length,
    isBlindPlay,
    mudZones: mudZones?.length
  });

  // Ensure board exists and is properly sized
  if (!board || board.length !== GRID_SIZE || !board[0] || board[0].length !== GRID_SIZE) {
    console.error('Invalid board state:', board);
    return (
      <View style={[styles.canvas, { width: canvasSize, height: canvasSize, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading board...</Text>
      </View>
    );
  }

  const renderCell = (row: number, col: number) => {
    const cellValue = board[row][col];
    const isWinning = winningPieces.some(piece => piece.row === row && piece.col === col);
    const isMudZone = mudZones.some(zone => zone.row === row && zone.col === col);
    const isBlindCell = isBlindPlay && isMudZone;

    let cellStyle = [styles.cell];
    let cellContent = null;

    if (cellValue === 1) {
      cellStyle.push(styles.blackPiece);
      cellContent = <View style={[styles.piece, { backgroundColor: '#000000' }]} />;
    } else if (cellValue === 2) {
      cellStyle.push(styles.yellowPiece);
      cellContent = <View style={[styles.piece, { backgroundColor: '#FFD700' }]} />;
    } else if (cellValue === 3) {
      cellStyle.push(styles.blockedCell);
      cellContent = <Text style={styles.beeEmoji}>🐝</Text>;
    } else {
      cellStyle.push(styles.emptyCell);
    }

    if (isWinning) {
      cellStyle.push(styles.winningCell);
    }

    if (isBlindCell) {
      cellStyle.push(styles.blindCell);
    }

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          cellStyle,
          {
            width: cellSize,
            height: cellSize,
          }
        ]}
        onPress={() => onCellClick(row, col)}
        disabled={cellValue !== 0}
      >
        {cellContent}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.canvas, { width: canvasSize, height: canvasSize }]}>
      {Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))
      )}
      {/* Debug info overlay */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>
          Board: {board.length}x{board[0]?.length || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#8B4513',
    borderRadius: 10,
    padding: BORDER_WIDTH,
  },
  cell: {
    borderWidth: BORDER_WIDTH,
    borderColor: '#654321',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    backgroundColor: '#DEB887',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  blackPiece: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#333333',
  },
  yellowPiece: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  blockedCell: {
    backgroundColor: '#8B4513',
  },
  winningCell: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
    borderWidth: 3,
  },
  blindCell: {
    backgroundColor: '#666',
  },
  piece: {
    width: '90%',
    height: '90%',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  beeEmoji: {
    fontSize: 20,
  },
  debugOverlay: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GameCanvas;

