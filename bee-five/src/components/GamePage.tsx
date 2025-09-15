import React from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import GameCanvas from './GameCanvas';
import { getPlayerName, getWinnerName } from '../utils/gameLogic';

interface GamePageProps {
  onBackToWelcome: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ onBackToWelcome }) => {
  const [timeLimit] = React.useState(15);
  
  const { gameState, handleCellClick, resetGame } = useGameLogic({
    timeLimit
  });

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

  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="game-title">
          Bee-<span>Five</span>
        </h1>
        
        <div className="timer">
          Time Left: {gameState.timeLeft}s
        </div>
      </div>

      <div className="game-content">
        <GameCanvas
          gameState={gameState}
          onCellClick={handleCellClick}
        />
      </div>

      <div className="game-status">
        <div className="status-text">
          {getStatusMessage()}
        </div>
      </div>

      <div className="game-controls">
        <button className="control-button restart-button" onClick={() => resetGame()}>
          Restart
        </button>
        <button className="control-button back-button" onClick={onBackToWelcome}>
          Back to Menu
        </button>
      </div>

      <footer className="game-footer">
        &copy; 2025 PentAyo. All rights reserved.
      </footer>
    </div>
  );
};

export default GamePage;