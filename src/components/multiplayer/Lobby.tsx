import React, { useState } from 'react';
import { useMultiplayer, GameState } from '../../contexts/MultiplayerContext';

export const Lobby: React.FC = () => {
  const { isConnected, isJoined, joinGame, players, playerId, startGame, maxPlayers, gameState } = useMultiplayer();
  
  // If game state is not LOBBY, don't show the lobby
  if (gameState !== GameState.LOBBY) {
    return null;
  }
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('default');

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    joinGame(playerName, roomId);
  };
  
  const handleStartGame = () => {
    startGame();
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>Sumo Spheres Multiplayer</h2>
        
        <div className="connection-status">
          Status: {isConnected ? 
            <span className="connected">Connected</span> : 
            <span className="disconnected">Disconnected</span>
          }
        </div>
        
        {!isJoined ? (
          <form onSubmit={handleJoinGame}>
            <div className="form-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="roomId">Room ID:</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="default"
              />
              <small>Leave as 'default' to join the main arena</small>
            </div>
            
            <button 
              type="submit" 
              className="join-button"
              disabled={!isConnected || !playerName.trim()}
            >
              Join Game
            </button>
          </form>
        ) : (
          <div className="waiting-room">
            <h3>Players in Room:</h3>
            <div className="player-count">
              {Object.keys(players).length} / {maxPlayers} players
            </div>
            <ul className="player-list">
              {Object.values(players).map((player) => (
                <li key={player.id} className={player.id === playerId ? 'current-player' : ''}>
                  {player.name} {player.id === playerId ? '(You)' : ''}
                </li>
              ))}
            </ul>
            
            {/* Only show start game button when there are at least 2 players */}
            {Object.keys(players).length >= 2 && (
              <button 
                className="start-game-button" 
                onClick={handleStartGame}
              >
                Start Game
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
