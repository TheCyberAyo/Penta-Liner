import React, { useState } from 'react';
import GameCanvas from './GameCanvas';
import { useGameLogic } from '../hooks/useGameLogic';

interface GamePageProps {
  isSinglePlayer: boolean;
  onBackToWelcome: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ isSinglePlayer, onBackToWelcome }) => {
  const [difficulty, setDifficulty] = useState<'medium' | 'hard'>('medium');
  const [timeLimit] = useState(15);
  
  const { gameState, handleCellClick, resetGame, updateGameState } = useGameLogic({
    isSinglePlayer,
    difficulty,
    timeLimit
  });

  const getStatusMessage = () => {
    if (gameState.winner > 0) {
      const winnerName = gameState.winner === 1 ? 'Black' : 'Yellow';
      return `${winnerName} wins!`;
    }
    if (!gameState.isGameActive && gameState.winner === 0) {
      return 'Game Over - Draw!';
    }
    if (gameState.timeLeft === 0) {
      const winner = gameState.currentPlayer === 1 ? 'Yellow' : 'Black';
      return `${winner} wins due to time limit!`;
    }
    
    const currentPlayerName = gameState.currentPlayer === 1 ? 'Black' : 'Yellow';
    return `${currentPlayerName}, Play!`;
  };

  const handleDifficultyChange = (newDifficulty: 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="game-title">
          Bee-<span>Five</span>
        </h1>
        
        {isSinglePlayer && (
          <div className="difficulty-selector">
            <label>AI Difficulty:</label>
            <select 
              value={difficulty} 
              onChange={(e) => handleDifficultyChange(e.target.value as 'medium' | 'hard')}
              disabled={gameState.isGameActive && gameState.board.some(row => row.some(cell => cell !== 0))}
            >
              <option value="medium">Medium (Easy)</option>
              <option value="hard">Impossible to Win</option>
            </select>
          </div>
        )}
        
        <div className="timer">
          Time Left: {gameState.timeLeft}s
        </div>
      </div>

      <div className="game-content">
        <GameCanvas
          gameState={gameState}
          onCellClick={handleCellClick}
          onGameStateChange={updateGameState}
          isSinglePlayer={isSinglePlayer}
        />
      </div>

      <div className="game-status">
        <div className="status-text">
          {getStatusMessage()}
        </div>
      </div>

      <div className="game-controls">
        <button className="control-button restart-button" onClick={resetGame}>
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
