import React, { useState, useEffect } from 'react';
import { useMultiplayer, GameState } from '../../contexts/MultiplayerContext';
import './GameUI.css';

export const GameUI: React.FC = () => {
  const { 
    players, 
    playerId, 
    gameState, 
    gameTimeRemaining, 
    maxPlayers,
    returnToLobby
  } = useMultiplayer();
  
  const [sortedPlayers, setSortedPlayers] = useState<Array<{id: string, name: string, score: number, isCurrentPlayer: boolean}>>([]);
  const [formattedTime, setFormattedTime] = useState('5:00');
  
  // Format time as MM:SS
  useEffect(() => {
    const minutes = Math.floor(gameTimeRemaining / 60);
    const seconds = gameTimeRemaining % 60;
    setFormattedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [gameTimeRemaining]);
  
  // Sort players by score
  useEffect(() => {
    const playerArray = Object.values(players).map(player => ({
      id: player.id,
      name: player.name,
      score: player.score || 0,
      isCurrentPlayer: player.id === playerId
    }));
    
    // Sort by score (highest first)
    playerArray.sort((a, b) => b.score - a.score);
    setSortedPlayers(playerArray);
  }, [players, playerId]);
  
  // Handle return to lobby button click
  const handleReturnToLobby = () => {
    returnToLobby();
  };
  
  return (
    <div className="game-ui">
      {/* Timer */}
      {gameState === GameState.PLAYING && (
        <div className="game-timer">
          <h2>Time Remaining</h2>
          <div className="timer">{formattedTime}</div>
        </div>
      )}
      
      {/* Scoreboard */}
      <div className="scoreboard">
        <h2>Scoreboard</h2>
        <div className="player-count">
          Players: {Object.keys(players).length} / {maxPlayers}
        </div>
        <ul className="player-list">
          {sortedPlayers.map(player => (
            <li 
              key={player.id} 
              className={`player-item ${player.isCurrentPlayer ? 'current-player' : ''}`}
            >
              <span className="player-name">{player.name} {player.isCurrentPlayer ? '(You)' : ''}</span>
              <span className="player-score">{player.score}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Game controls based on state */}
      <div className="game-controls">        
        {gameState === GameState.GAME_OVER && (
          <div className="game-over">
            <h2>Game Over!</h2>
            {sortedPlayers.length > 0 && (
              <div className="winner">
                <h3>Winner: {sortedPlayers[0].name}</h3>
                <p>Score: {sortedPlayers[0].score}</p>
              </div>
            )}
            <button className="return-lobby-btn" onClick={handleReturnToLobby}>
              Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
