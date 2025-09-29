import React, { useState } from 'react';
import { soundManager } from '../utils/sounds';
import { useTheme, ADVENTURE_THEMES } from '../hooks/useTheme';
import BeeLifeStageEffects from './BeeLifeStageEffects';

interface BeeAdventureMapProps {
  currentGame: number;
  gamesCompleted: number[];
  onGameSelect: (gameNumber: number) => void;
  onBackToMenu: () => void;
}

const BeeAdventureMap: React.FC<BeeAdventureMapProps> = ({ 
  currentGame, 
  gamesCompleted, 
  onGameSelect, 
  onBackToMenu 
}) => {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  
  // Use theme system
  const { currentTheme } = useTheme({ gameNumber: currentGame });

  // Initialize sound manager settings
  React.useEffect(() => {
    soundManager.setVolume(volume);
    soundManager.setMuted(!soundEnabled);
  }, [volume, soundEnabled]);



  // Get stage emoji based on bee life stage
  const getStageEmoji = (stageIndex: number) => {
    const stageEmojis = ['🥚', '🐛', '🍯', '🕸️', '🦋', '🌅', '🏠', '🌻', '🛡️', '👑'];
    return stageEmojis[stageIndex] || '🐝';
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

  // Render individual stage nodes


  // Get geographical location for each game (organic flowing S-curve)
  const getGamePosition = (gameNumber: number) => {
    const gameIndex = gameNumber - 1;
    const isMobile = window.innerWidth <= 768;
    
    // Organic flowing S-curve parameters
    const totalHeight = isMobile ? 280000 : 320000; // Much larger height to accommodate all 2000 games
    const spacing = isMobile ? 140 : 160; // Added 2 fingers of distance (60px more)
    
    // Calculate Y position (upward flow from bottom to top)
    const y = totalHeight - (gameIndex * spacing);
    
    // Calculate X position for high-frequency S-curve with inner positioning for 3rd/4th games
    // High-frequency alternating left-right pattern with inner positioning
    const gamesPerSide = isMobile ? 4 : 4; // 4 games per side to allow inner positioning
    const sideIndex = Math.floor(gameIndex / gamesPerSide);
    const positionInSide = gameIndex % gamesPerSide;
    
    let x;
    if (isMobile) {
      // Mobile: very conservative positioning to ensure ALL numbers are visible
      if (sideIndex % 2 === 0) {
        // Even sides: left side
        if (positionInSide === 0) {
          // 1st game: outer left (20%)
          x = 20;
        } else if (positionInSide === 1) {
          // 2nd game: outer left (30%)
          x = 30;
        } else if (positionInSide === 2) {
          // 3rd game: inner left (35%)
          x = 35;
        } else {
          // 4th game: inner left (45%)
          x = 45;
        }
      } else {
        // Odd sides: right side
        if (positionInSide === 0) {
          // 1st game: outer right (60%)
          x = 60;
        } else if (positionInSide === 1) {
          // 2nd game: outer right (70%)
          x = 70;
        } else if (positionInSide === 2) {
          // 3rd game: inner right (45%)
          x = 45;
        } else {
          // 4th game: inner right (55%)
          x = 55;
        }
      }
    } else {
      // Desktop: very folded curves with inner positioning for 3rd and 4th games
      if (sideIndex % 2 === 0) {
        // Even sides: left side
        if (positionInSide < 2) {
          // 1st and 2nd games: outer left (5% to 20%)
          x = 5 + (positionInSide / 1) * 15;
        } else {
          // 3rd and 4th games: inner left (25% to 40%) - closer to center
          x = 25 + ((positionInSide - 2) / 1) * 15;
        }
      } else {
        // Odd sides: right side
        if (positionInSide < 2) {
          // 1st and 2nd games: outer right (75% to 95%)
          x = 75 + (positionInSide / 1) * 20;
        } else {
          // 3rd and 4th games: inner right (60% to 75%) - closer to center
          x = 60 + ((positionInSide - 2) / 1) * 15;
        }
      }
    }
    
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(50, y)}px`
    };
  };

  // Get environmental elements for each game area
  const getGameEnvironment = (gameNumber: number) => {
    const stageIndex = Math.floor((gameNumber - 1) / 200);
    const positionInStage = ((gameNumber - 1) % 200) + 1;
    
    // Different hive environments based on stage and position
    const environments = {
      0: ['🍯', '🍯', '🍯', '🍯', '🥚'], // Egg stage - honey cells
      1: ['🍯', '🍯', '🍯', '🍯', '🐛'], // Larva stage - honey and larva
      2: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Nectar stage - pure honey
      3: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Cocoon stage - honey cells
      4: ['🍯', '🍯', '🍯', '🍯', '🦋'], // Pupa stage - honey and transformation
      5: ['🍯', '🍯', '🍯', '🍯', '🐝'], // Emergence stage - honey and bees
      6: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Nurse stage - nursing honey
      7: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Forager stage - foraged honey
      8: ['🍯', '🍯', '🍯', '🍯', '🍯'], // Guard stage - protected honey
      9: ['👑', '🍯', '🍯', '🍯', '🌟']  // Queen stage - royal honey
    };
    
    const stageEnvironments = environments[stageIndex as keyof typeof environments] || ['🌿'];
    return stageEnvironments[positionInStage % stageEnvironments.length];
  };

  // Render individual game location
  const renderGameLocation = (gameNumber: number) => {
    const position = getGamePosition(gameNumber);
    const stageIndex = Math.floor((gameNumber - 1) / 200);
    const stage = ADVENTURE_THEMES[stageIndex];
    const isCompleted = gamesCompleted.includes(gameNumber);
    const isCurrent = gameNumber === currentGame;
    const environment = getGameEnvironment(gameNumber);
    const isMobile = window.innerWidth <= 768;
    
    return (
      <div
        key={gameNumber}
        style={{
          position: 'absolute',
          left: position.left,
          top: position.top,
          zIndex: 2
        }}
      >
        {/* Environmental element */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '-30px' : '-25px',
          top: isMobile ? '-30px' : '-25px',
          fontSize: isMobile ? '20px' : '16px',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {environment}
        </div>
        
        {/* Google Maps style location icon */}
        <div
          onClick={() => handleGameClick(gameNumber)}
          style={{
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
            zIndex: isCurrent ? '10' : '2'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1.3)';
              e.currentTarget.style.zIndex = '10';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = isCurrent ? 'scale(1.3)' : 'scale(1)';
              e.currentTarget.style.zIndex = '2';
            }
          }}
          title={`Game ${gameNumber} - ${stage?.name || 'Unknown Stage'}\n${stage?.beeLifeStage || ''}`}
        >
          {/* Pin head (circular part) */}
          <div style={{
            width: isMobile ? '24px' : '20px',
            height: isMobile ? '24px' : '20px',
            borderRadius: '50%',
            backgroundColor: isCompleted ? '#4CAF50' : isCurrent ? '#FFC30B' : stage?.primaryColor || '#FFC30B',
            border: isCompleted || isCurrent ? '3px solid #fff' : '2px solid #fff',
            boxShadow: isCurrent ? '0 0 12px rgba(255, 195, 11, 0.8)' : '0 2px 6px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 2,
            animation: isCurrent ? 'currentPulse 2s ease-in-out infinite' : 'none',
            transform: 'translateZ(0)' // Force hardware acceleration
          }}>
            {isCurrent && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: isMobile ? '12px' : '10px',
                color: '#fff'
              }}>
                ★
              </div>
            )}
          </div>
          
          {/* Pin point (bottom part) */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: isMobile ? '12px solid transparent' : '10px solid transparent',
            borderRight: isMobile ? '12px solid transparent' : '10px solid transparent',
            borderTop: isMobile ? '18px solid' : '15px solid',
            borderTopColor: isCompleted ? '#4CAF50' : isCurrent ? '#FFC30B' : stage?.primaryColor || '#FFC30B',
            position: 'absolute',
            top: isMobile ? '18px' : '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }} />
        </div>
        
        {/* Location icon label */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '30px' : '25px',
          top: isMobile ? '2px' : '1px',
          fontSize: isMobile ? '14px' : '12px',
          fontWeight: 'bold',
          color: '#2E8B57',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: isMobile ? '3px 6px' : '2px 5px',
          borderRadius: isMobile ? '4px' : '3px',
          border: '1px solid rgba(0,0,0,0.2)',
          minWidth: isMobile ? '25px' : '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {gameNumber}
        </div>
      </div>
    );
  };

  // Main map render with organic flowing S-curve design
  const renderBeeAdventureMap = () => {
    const isMobile = window.innerWidth <= 768;
    const totalHeight = isMobile ? 280000 : 320000; // Much larger height to accommodate all 2000 games
    
    return (
      <div style={{ 
        position: 'relative',
        background: `linear-gradient(135deg, #90EE90, #98FB98, #F0FFF0)`,
        borderRadius: '20px',
        padding: '2rem',
        border: `4px solid ${currentTheme.primaryColor}`,
        boxShadow: `0 0 25px ${currentTheme.shadowColor}`,
        minHeight: '800px',
        height: `${Math.min(totalHeight, 800)}px`,
        overflow: 'hidden'
      }}>
        {/* Hamburger menu button (top-left) */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          width: '40px',
          height: '40px',
          backgroundColor: '#90EE90',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }}></div>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }}></div>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }}></div>
          </div>
        </div>

        {/* Map Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 5
        }}>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            color: '#2E8B57',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            animation: 'titleGlow 3s ease-in-out infinite',
            transform: 'translateZ(0)' // Force hardware acceleration
          }}>
            <span style={{ 
              fontSize: '3rem',
              animation: 'mapIconSpin 4s linear infinite',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 8px rgba(255, 195, 11, 0.6))'
            }}>🐝</span>
            Bee Adventure Journey
            <span style={{ 
              fontSize: '3rem',
              animation: 'mapIconSpin 4s linear infinite reverse',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 8px rgba(255, 195, 11, 0.6))'
            }}>🍯</span>
          </h2>
          <p style={{
            margin: 0,
            color: '#228B22',
            fontSize: '1.2rem',
            fontStyle: 'italic',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>
            Scroll to explore all 2000 games in the bee life cycle
          </p>
        </div>

        {/* Scrollable map area */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          background: `radial-gradient(circle at center, rgba(144, 238, 144, 0.3), rgba(152, 251, 152, 0.2))`,
          borderRadius: '15px',
          border: `3px solid #8FBC8F`,
          padding: '1rem',
          marginBottom: '1rem',
          overflow: 'auto',
          overflowX: 'hidden'
        }}>
          {/* Background landscape elements scattered throughout */}
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={`bg-${i}`}
              style={{
                position: 'absolute',
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * totalHeight + 50}px`,
                fontSize: `${Math.random() * 30 + 20}px`,
                opacity: 0.3 + Math.random() * 0.2,
                transform: `rotate(${Math.random() * 60 - 30}deg)`,
                pointerEvents: 'none'
              }}
            >
              {['🍯', '🍯', '🍯', '🐝', '🐝'][Math.floor(Math.random() * 5)]}
            </div>
          ))}

          {/* Continuous flowing S-curve SVG */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${totalHeight}px`,
              zIndex: 1,
              pointerEvents: 'none',
              animation: 'mapFloat 8s ease-in-out infinite',
              transform: 'translateZ(0)' // Force hardware acceleration
            }}
            viewBox={`0 0 800 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            {/* Create the main organic flowing S-curve path */}
            {(() => {
              const spacing = isMobile ? 140 : 160;
              
              // Generate path points for high-frequency S-curve with inner positioning
              const pathPoints = [];
              for (let i = 0; i < 2000; i++) {
                const y = totalHeight - (i * spacing);
                const gamesPerSide = 4; // 4 games per side to allow inner positioning
                const sideIndex = Math.floor(i / gamesPerSide);
                const positionInSide = i % gamesPerSide;
                
                let x;
                if (isMobile) {
                  // Mobile: very conservative positioning to ensure ALL numbers are visible
                  if (sideIndex % 2 === 0) {
                    // Even sides: left side
                    if (positionInSide === 0) {
                      // 1st game: outer left (20%)
                      x = 20;
                    } else if (positionInSide === 1) {
                      // 2nd game: outer left (30%)
                      x = 30;
                    } else if (positionInSide === 2) {
                      // 3rd game: inner left (35%)
                      x = 35;
                    } else {
                      // 4th game: inner left (45%)
                      x = 45;
                    }
                  } else {
                    // Odd sides: right side
                    if (positionInSide === 0) {
                      // 1st game: outer right (60%)
                      x = 60;
                    } else if (positionInSide === 1) {
                      // 2nd game: outer right (70%)
                      x = 70;
                    } else if (positionInSide === 2) {
                      // 3rd game: inner right (45%)
                      x = 45;
                    } else {
                      // 4th game: inner right (55%)
                      x = 55;
                    }
                  }
                } else {
                  // Desktop: very folded curves with inner positioning for 3rd and 4th games
                  if (sideIndex % 2 === 0) {
                    // Even sides: left side
                    if (positionInSide < 2) {
                      // 1st and 2nd games: outer left (5% to 20%)
                      x = 5 + (positionInSide / 1) * 15;
                    } else {
                      // 3rd and 4th games: inner left (25% to 40%) - closer to center
                      x = 25 + ((positionInSide - 2) / 1) * 15;
                    }
                  } else {
                    // Odd sides: right side
                    if (positionInSide < 2) {
                      // 1st and 2nd games: outer right (75% to 95%)
                      x = 75 + (positionInSide / 1) * 20;
                    } else {
                      // 3rd and 4th games: inner right (60% to 75%) - closer to center
                      x = 60 + ((positionInSide - 2) / 1) * 15;
                    }
                  }
                }
                
                pathPoints.push(`${x * 8},${y}`);
              }
              
              // Create smooth flowing path using all points
              const pathData = `M ${pathPoints[0]} L ${pathPoints.join(' L ')}`;
              
              return (
                <path
                  key="organic-flowing-s-curve"
                  d={pathData}
                  stroke="#8B4513"
                  strokeWidth={isMobile ? "6" : "4"}
                  fill="none"
                  opacity="0.7"
                  style={{
                    filter: `drop-shadow(0 0 4px ${currentTheme.primaryColor}40)`,
                    animation: 'titleGlow 3s ease-in-out infinite'
                  }}
                />
              );
            })()}
            
            {/* Add decorative elements along the organic S-curve */}
            {Array.from({ length: 100 }, (_, i) => {
              const spacing = isMobile ? 140 : 160;
              
              const gameIndex = i * 20; // Every 20th game
              const y = totalHeight - (gameIndex * spacing);
              const gamesPerSide = 4; // 4 games per side to allow inner positioning
              const sideIndex = Math.floor(gameIndex / gamesPerSide);
              const positionInSide = gameIndex % gamesPerSide;
              
              let x;
              if (isMobile) {
                // Mobile: very conservative positioning to ensure ALL numbers are visible
                if (sideIndex % 2 === 0) {
                  // Even sides: left side
                  if (positionInSide === 0) {
                    // 1st game: outer left (20%)
                    x = 20;
                  } else if (positionInSide === 1) {
                    // 2nd game: outer left (30%)
                    x = 30;
                  } else if (positionInSide === 2) {
                    // 3rd game: inner left (35%)
                    x = 35;
                  } else {
                    // 4th game: inner left (45%)
                    x = 45;
                  }
                } else {
                  // Odd sides: right side
                  if (positionInSide === 0) {
                    // 1st game: outer right (60%)
                    x = 60;
                  } else if (positionInSide === 1) {
                    // 2nd game: outer right (70%)
                    x = 70;
                  } else if (positionInSide === 2) {
                    // 3rd game: inner right (45%)
                    x = 45;
                  } else {
                    // 4th game: inner right (55%)
                    x = 55;
                  }
                }
              } else {
                // Desktop: very folded curves with inner positioning for 3rd and 4th games
                if (sideIndex % 2 === 0) {
                  // Even sides: left side
                  if (positionInSide < 2) {
                    // 1st and 2nd games: outer left (5% to 20%)
                    x = 5 + (positionInSide / 1) * 15;
                  } else {
                    // 3rd and 4th games: inner left (25% to 40%) - closer to center
                    x = 25 + ((positionInSide - 2) / 1) * 15;
                  }
                } else {
                  // Odd sides: right side
                  if (positionInSide < 2) {
                    // 1st and 2nd games: outer right (75% to 95%)
                    x = 75 + (positionInSide / 1) * 20;
                  } else {
                    // 3rd and 4th games: inner right (60% to 75%) - closer to center
                    x = 60 + ((positionInSide - 2) / 1) * 15;
                  }
                }
              }
              
              // Add decorative curve at this point
              const decorativeCurve = `M ${(x - 3) * 8},${y} 
                                     Q ${x * 8},${y - 15} ${(x + 3) * 8},${y}`;
              
              return (
                <path
                  key={`dec-${i}`}
                  d={decorativeCurve}
                  stroke="#DAA520"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                  style={{
                    filter: `drop-shadow(0 0 2px ${currentTheme.secondaryColor}60)`,
                    animation: 'stageCardFloat 6s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              );
            })}
          </svg>

          {/* All 2000 games positioned in organic flowing S-curve */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: `${totalHeight}px`,
            zIndex: 2
          }}>
            {Array.from({ length: 2000 }, (_, i) => renderGameLocation(i + 1))}
          </div>

          {/* Stage milestone markers */}
          {ADVENTURE_THEMES.map((stage, index) => {
            const milestoneGame = (index * 200) + 1;
            const position = getGamePosition(milestoneGame);
            
            return (
              <div
                key={`milestone-${index}`}
                style={{
                  position: 'absolute',
                  left: `calc(${position.left} - ${isMobile ? '20px' : '15px'})`,
                  top: `calc(${position.top} - ${isMobile ? '20px' : '15px'})`,
                  width: isMobile ? '80px' : '60px',
                  height: isMobile ? '80px' : '60px',
                  borderRadius: '50%',
                  backgroundColor: stage.primaryColor,
                  border: isMobile ? '5px solid #fff' : '4px solid #fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '24px' : '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                  zIndex: 5,
                  animation: 'milestonePulse 3s ease-in-out infinite',
                  animationDelay: `${index * 0.5}s`,
                  transform: 'translateZ(0)' // Force hardware acceleration
                }}
                onClick={() => handleGameClick(milestoneGame)}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.zIndex = '15';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = '5';
                  }
                }}
                title={`Stage ${index + 1}: ${stage.name}\nStarting at Game ${milestoneGame}\n${stage.beeLifeStage}`}
              >
                <div style={{ fontSize: isMobile ? '32px' : '24px', marginBottom: '2px' }}>
                  {getStageEmoji(index)}
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '10px', textAlign: 'center' }}>
                  S{index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Info */}
        <div style={{
          textAlign: 'center',
          color: '#2E8B57',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
            🐝 Current Game: {currentGame} - {getStageForGame(currentGame)?.name || 'Unknown'}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
            Progress: {gamesCompleted.length} / 2000 levels completed
          </p>
        </div>
      </div>
    );
  };

  return (
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
          fontSize: '2.2rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          🗺️ Adventure Map
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
          Current Game: {currentGame} | Completed: {gamesCompleted.length}/2000
        </p>
      </div>

      {/* Bee Adventure Map */}
      <BeeLifeStageEffects theme={currentTheme}>
        <div style={{ marginBottom: '1rem' }}>
          {renderBeeAdventureMap()}
        </div>
      </BeeLifeStageEffects>

      {/* Game Selection Panel */}
      {selectedGame && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          border: '3px solid #FFC30B',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#333', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontSize: '1.5rem'
            }}>
              <span style={{ fontSize: '2rem' }}>{getStageEmoji(Math.floor((selectedGame - 1) / 200))}</span>
              Selected: Game {selectedGame}
            </h3>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {getStageForGame(selectedGame)?.name}
            </p>
            <p style={{ margin: '0 0 0.5rem 0', color: currentTheme.primaryColor, fontSize: '1rem' }}>
              🐝 {getStageForGame(selectedGame)?.beeLifeStage}
            </p>
            <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.9rem' }}>
              Stage {Math.floor((selectedGame - 1) / 200) + 1} • Game {((selectedGame - 1) % 200) + 1} of 200
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
                🎮 Start Game
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
                ❌ Cancel
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
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>🗺️ Map Legend:</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4CAF50', border: '2px solid #000' }}></div>
            <span>Completed Stages</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFC30B', border: '2px solid #000', boxShadow: '0 0 8px rgba(255, 195, 11, 0.8)' }}></div>
            <span>Current Stage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFC30B', border: '2px solid #fff' }}></div>
            <span>Available Stages</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeeAdventureMap;
