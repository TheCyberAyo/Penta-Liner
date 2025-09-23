import React, { useState } from 'react';
import { soundManager } from '../utils/sounds';
import { useTheme, ADVENTURE_THEMES } from '../hooks/useTheme';
import BeeLifeStageEffects from './BeeLifeStageEffects';

interface AdventureMapProps {
  currentGame: number;
  gamesCompleted: number[];
  onGameSelect: (gameNumber: number) => void;
  onBackToMenu: () => void;
}

// Use the centralized adventure stages from the theme system

const AdventureMap: React.FC<AdventureMapProps> = ({ 
  currentGame, 
  gamesCompleted, 
  onGameSelect, 
  onBackToMenu 
}) => {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  
  // Use theme system
  const { currentTheme, getStageIndex } = useTheme({ gameNumber: currentGame });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);

  const getGameStatus = (gameNumber: number): 'completed' | 'current' | 'available' => {
    // Unlock all stages for development
    if (gamesCompleted.includes(gameNumber)) return 'completed';
    if (gameNumber === currentGame) return 'current';
    return 'available'; // All games are now accessible for development
  };

  const getGameColor = (gameNumber: number) => {
    const status = getGameStatus(gameNumber);
    const stageIndex = Math.floor((gameNumber - 1) / 200);
    
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Green for completed
      case 'current':
        return '#FFC30B'; // Yellow for current
      case 'available':
        return ADVENTURE_THEMES[stageIndex]?.primaryColor || '#2196F3'; // Stage color for available
      default:
        return '#2196F3';
    }
  };

  // Get location emoji based on game number and stage
  const getLocationEmoji = (gameNumber: number) => {
    const stageIndex = getStageIndex(gameNumber);
    const positionInStage = ((gameNumber - 1) % 200) + 1;
    
    // Special emojis for milestone levels
    if (positionInStage === 1) return '🏁'; // Stage start
    if (positionInStage === 50) return '⛰️'; // Mid-stage checkpoint
    if (positionInStage === 100) return '🏔️'; // High checkpoint
    if (positionInStage === 150) return '🗻'; // Higher checkpoint
    if (positionInStage === 200) return '🏆'; // Stage end
    
    // Stage-specific location emojis
    switch (stageIndex) {
      case 0: // Egg stage
        return ['🥚', '🍳', '⚪', '🔴', '🟡'][positionInStage % 5];
      case 1: // Larva stage
        return ['🐛', '🪱', '🟢', '🟤', '🟫'][positionInStage % 5];
      case 2: // Nectar stage
        return ['🍯', '🍯', '🟨', '🟧', '🟠'][positionInStage % 5];
      case 3: // Cocoon stage
        return ['🕸️', '🕷️', '🟣', '🟪', '🟦'][positionInStage % 5];
      case 4: // Pupa stage
        return ['🦋', '💭', '☁️', '🌫️', '💙'][positionInStage % 5];
      case 5: // Emergence stage
        return ['🌅', '🌄', '🌞', '☀️', '🌤️'][positionInStage % 5];
      case 6: // Nurse stage
        return ['🏠', '🏡', '🏘️', '🌱', '🌿'][positionInStage % 5];
      case 7: // Forager stage
        return ['🌻', '🌸', '🌺', '🌼', '🌷'][positionInStage % 5];
      case 8: // Guard stage
        return ['🛡️', '⚔️', '🗡️', '🔰', '🛡️'][positionInStage % 5];
      case 9: // Queen stage
        return ['👑', '💎', '🔮', '✨', '🌟'][positionInStage % 5];
      default:
        return '📍';
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
    return ADVENTURE_THEMES[Math.floor((gameNumber - 1) / 200)];
  };

  const renderGameNode = (gameNumber: number) => {
    const status = getGameStatus(gameNumber);
    const stage = getStageForGame(gameNumber);
    const locationEmoji = getLocationEmoji(gameNumber);
    
    return (
      <div
        key={gameNumber}
        onClick={() => handleGameClick(gameNumber)}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: getGameColor(gameNumber),
          border: selectedGame === gameNumber ? '2px solid #000' : '1px solid #fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 'bold',
          color: status === 'completed' ? '#000' : '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
          transform: status === 'current' ? 'scale(1.2)' : selectedGame === gameNumber ? 'scale(1.1)' : 'scale(1)',
          zIndex: status === 'current' ? 10 : selectedGame === gameNumber ? 5 : 1,
          boxShadow: status === 'current' ? '0 0 8px rgba(255, 195, 11, 0.8)' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.2)';
          e.currentTarget.style.zIndex = '10';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = status === 'current' ? 'scale(1.2)' : 'scale(1)';
          e.currentTarget.style.zIndex = status === 'current' ? '10' : '1';
        }}
        title={`${locationEmoji} Game ${gameNumber} - ${stage?.name || 'Unknown Stage'}\n${stage?.beeLifeStage || ''}`}
      >
        {locationEmoji}
      </div>
    );
  };

  // Render all stages as a map (for development)
  const renderAllStagesMap = () => {
    // Show all 2000 games for development
    const allGames = Array.from({ length: 2000 }, (_, i) => i + 1);
    
    return (
      <div style={{ 
        position: 'relative',
        background: `linear-gradient(135deg, ${currentTheme.backgroundColor}80, ${currentTheme.gridColor}60)`,
        borderRadius: '20px',
        padding: '2rem',
        border: `3px solid ${currentTheme.primaryColor}`,
        boxShadow: `0 0 20px ${currentTheme.shadowColor}`,
        minHeight: '600px'
      }}>
        {/* Map Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            color: currentTheme.primaryColor,
            fontSize: '2rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '2.5rem' }}>🗺️</span>
            Complete Adventure Map (Development)
          </h2>
          <p style={{
            margin: 0,
            color: currentTheme.textColor,
            fontSize: '1.1rem',
            fontStyle: 'italic'
          }}>
            🐝 All bee life stages unlocked for development
          </p>
        </div>

        {/* Map Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4CAF50', border: '2px solid white' }}></div>
            <span>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFC30B', border: '2px solid white', boxShadow: '0 0 8px rgba(255, 195, 11, 0.8)' }}></div>
            <span>Current</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: currentTheme.primaryColor, border: '2px solid white' }}></div>
            <span>Available</span>
          </div>
        </div>

        {/* Map Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          background: `radial-gradient(circle at center, ${currentTheme.backgroundColor}40, ${currentTheme.gridColor}20)`,
          borderRadius: '15px',
          border: `2px solid ${currentTheme.borderColor}`,
          overflow: 'auto',
          padding: '1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(40, 1fr)',
            gap: '2px',
            width: 'fit-content'
          }}>
            {allGames.map(gameNumber => renderGameNode(gameNumber))}
          </div>
        </div>

        {/* Progress Info */}
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          color: currentTheme.textColor
        }}>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            Progress: {gamesCompleted.length} / 2000 levels completed
          </p>
        </div>
      </div>
    );
  };


  return (
    <BeeLifeStageEffects theme={currentTheme}>
    <div style={{ 
        background: currentTheme.backgroundGradient,
      minHeight: '100vh',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: currentTheme.primaryColor,
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
          Current Game: {currentGame} | Completed: {gamesCompleted.length}/2000
        </p>
      </div>

      {/* All Stages Map */}
      <div style={{
        marginBottom: '1rem'
      }}>
        {renderAllStagesMap()}
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
          <h3 style={{ margin: '0 0 1rem 0', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{getLocationEmoji(selectedGame)}</span>
            Selected: Game {selectedGame}
          </h3>
          <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {getStageForGame(selectedGame)?.name}
          </p>
          <p style={{ margin: '0 0 1rem 0', color: currentTheme.primaryColor, fontSize: '0.9rem' }}>
            🐝 {getStageForGame(selectedGame)?.beeLifeStage}
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
            backgroundColor: currentTheme.buttonColor,
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
    </BeeLifeStageEffects>
  );
};

export default AdventureMap;
