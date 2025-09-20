import React, { useState } from 'react';
import { soundManager } from '../utils/sounds';

interface AdventureMapProps {
  currentGame: number;
  gamesCompleted: number[];
  onGameSelect: (gameNumber: number) => void;
  onBackToMenu: () => void;
}

// Stage names and descriptions for every 100 games
const ADVENTURE_STAGES = [
  {
    name: "The Whispering Egg",
    description: "The prophecy of a hero is laid within a golden cell.",
    games: 1,
    color: "#FFD700"
  },
  {
    name: "Larva of Legends", 
    description: "A tiny creature begins its fabled journey of growth.",
    games: 101,
    color: "#FFA500"
  },
  {
    name: "Chamber of Royal Nectar",
    description: "A mystical hall where power and destiny are forged.",
    games: 201,
    color: "#FF6347"
  },
  {
    name: "Silken Cocoon of Secrets",
    description: "Spinning a magical shell to transform.",
    games: 301,
    color: "#9370DB"
  },
  {
    name: "Dreams of the Pupa Realm",
    description: "Visions of wings and future battles stir inside.",
    games: 401,
    color: "#4169E1"
  },
  {
    name: "Wings of Dawn",
    description: "Breaking free and taking the first heroic flight.",
    games: 501,
    color: "#00CED1"
  },
  {
    name: "Hive of Trials",
    description: "Training in ancient duties and learning hidden arts.",
    games: 601,
    color: "#32CD32"
  },
  {
    name: "Trails of Golden Pollen",
    description: "Quests across wildflower kingdoms to gather treasure.",
    games: 701,
    color: "#FFC30B"
  },
  {
    name: "Sentinel of the Hiveheart",
    description: "Standing guard against dark invaders.",
    games: 801,
    color: "#DC143C"
  },
  {
    name: "Crown of the Queen-Bee",
    description: "Ascend the throne, lead the swarm, or begin a new dynasty.",
    games: 901,
    color: "#8B008B"
  }
];

const AdventureMap: React.FC<AdventureMapProps> = ({ 
  currentGame, 
  gamesCompleted, 
  onGameSelect, 
  onBackToMenu 
}) => {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [showStageInfo, setShowStageInfo] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  const getGameStatus = (gameNumber: number) => {
    if (gamesCompleted.includes(gameNumber)) return 'completed';
    if (gameNumber === currentGame) return 'current';
    return 'available'; // All games are now accessible
  };

  const getGameColor = (gameNumber: number) => {
    const status = getGameStatus(gameNumber);
    const stageIndex = Math.floor((gameNumber - 1) / 100);
    const stage = ADVENTURE_STAGES[stageIndex];
    
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Green for completed
      case 'current':
        return '#FFC30B'; // Yellow for current
      case 'available':
        return stage?.color || '#2196F3'; // Stage color for available
      default:
        return '#2196F3';
    }
  };

  const handleGameClick = (gameNumber: number) => {
    setSelectedGame(gameNumber);
    if (soundEnabled) soundManager.playClickSound();
  };

  const handleStartGame = () => {
    if (selectedGame) {
      onGameSelect(selectedGame);
      if (soundEnabled) soundManager.playClickSound();
    }
  };

  const getStageForGame = (gameNumber: number) => {
    return ADVENTURE_STAGES[Math.floor((gameNumber - 1) / 100)];
  };

  const renderGameNode = (gameNumber: number) => {
    const status = getGameStatus(gameNumber);
    const stage = getStageForGame(gameNumber);
    
    return (
      <div
        key={gameNumber}
        onClick={() => handleGameClick(gameNumber)}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: getGameColor(gameNumber),
          border: selectedGame === gameNumber ? '3px solid #000' : '2px solid #000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 'bold',
          color: status === 'completed' ? '#000' : '#fff',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.2)';
          e.currentTarget.style.zIndex = '10';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '1';
        }}
        title={`Game ${gameNumber} - ${stage?.name || 'Unknown Stage'}`}
      >
        {status === 'completed' ? '✓' : status === 'current' ? '●' : gameNumber % 100 === 1 ? '★' : ''}
      </div>
    );
  };

  const renderStageSection = (stageIndex: number) => {
    const stage = ADVENTURE_STAGES[stageIndex];
    const startGame = stageIndex * 100 + 1;
    const endGame = Math.min((stageIndex + 1) * 100, 1000);
    const games = Array.from({ length: endGame - startGame + 1 }, (_, i) => startGame + i);
    
    return (
      <div key={stageIndex} style={{ marginBottom: '2rem' }}>
        {/* Stage Header */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${stage.color}20, ${stage.color}40)`,
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            border: `2px solid ${stage.color}`,
            cursor: 'pointer'
          }}
          onClick={() => setShowStageInfo(showStageInfo === stageIndex ? null : stageIndex)}
        >
          <h3 style={{ 
            margin: 0, 
            color: stage.color,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            {stage.name}
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.9rem',
            color: '#333',
            fontStyle: 'italic'
          }}>
            Games {startGame} - {endGame}
          </p>
        </div>

        {/* Stage Description */}
        {showStageInfo === stageIndex && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #ddd'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>
              {stage.description}
            </p>
          </div>
        )}

        {/* Games Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '0.5rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          {games.map(gameNumber => renderGameNode(gameNumber))}
        </div>
      </div>
    );
  };


  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FFC30B 0%, #FFD700 50%, #FFC30B 100%)',
      minHeight: '100vh',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#FFC30B',
        padding: '1rem',
        borderRadius: '10px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🗺️ Adventure Map
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
          Current Game: {currentGame} | Completed: {gamesCompleted.length}/1000
        </p>
      </div>

      {/* Map Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '1.5rem',
        marginBottom: '1rem',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        {ADVENTURE_STAGES.map((_, index) => renderStageSection(index))}
      </div>

      {/* Game Selection Panel */}
      {selectedGame && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          border: '2px solid #FFC30B',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
            Selected Game: {selectedGame}
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            {getStageForGame(selectedGame)?.name}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleStartGame}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Start Game
            </button>
            <button
              onClick={() => setSelectedGame(null)}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: '#666',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '1rem',
        borderRadius: '10px',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Sound Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              const newSoundEnabled = !soundEnabled;
              setSoundEnabled(newSoundEnabled);
              soundManager.setMuted(!newSoundEnabled);
              if (newSoundEnabled) soundManager.playClickSound();
            }}
            style={{
              padding: '0.5rem',
              fontSize: '1.2em',
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
          
          {soundEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Volume:</span>
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
                  width: '100px',
                  accentColor: '#FFC30B'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            onBackToMenu();
            if (soundEnabled) soundManager.playClickSound();
          }}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: '#FFC30B',
            color: 'black',
            border: '2px solid black',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🏠 Back to Menu
        </button>
      </div>

      {/* Legend */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '1rem',
        borderRadius: '10px',
        marginTop: '1rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Map Legend:</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4CAF50', border: '1px solid #000' }}></div>
            <span>Completed Games</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFC30B', border: '1px solid #000' }}></div>
            <span>Current Game</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#2196F3', border: '1px solid #000' }}></div>
            <span>Available Games</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFC30B', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>★</div>
            <span>Stage Start</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureMap;
