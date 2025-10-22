import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { GRID_SIZE, CELL_SIZE, BORDER_WIDTH } from '../constants/gameConstants';

interface GameCanvasProps {
  board: (0 | 1 | 2 | 3)[][];
  onCellClick: (row: number, col: number) => void;
  winningPieces: { row: number; col: number }[];
  isBlindPlay: boolean;
  mudZones: { row: number; col: number }[];
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  board,
  onCellClick,
  winningPieces,
  isBlindPlay,
  mudZones,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - 40, GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH);
  const cellSize = (canvasSize - (GRID_SIZE + 1) * BORDER_WIDTH) / GRID_SIZE;

  const renderCell = (row: number, col: number) => {
    const cellValue = board[row][col];
    const isWinning = winningPieces.some(piece => piece.row === row && piece.col === col);
    const isMudZone = mudZones.some(zone => zone.row === row && zone.col === col);
    const isBlindCell = isBlindPlay && isMudZone;

    let cellStyle = [styles.cell];
    let cellContent = null;

    if (cellValue === 1) {
      cellStyle.push(styles.blackPiece);
      cellContent = <View style={styles.piece} />;
    } else if (cellValue === 2) {
      cellStyle.push(styles.yellowPiece);
      cellContent = <View style={styles.piece} />;
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
  },
  blackPiece: {
    backgroundColor: '#DEB887',
  },
  yellowPiece: {
    backgroundColor: '#DEB887',
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
    width: '80%',
    height: '80%',
    borderRadius: 50,
  },
  beeEmoji: {
    fontSize: 20,
  },
});

export default GameCanvas;
