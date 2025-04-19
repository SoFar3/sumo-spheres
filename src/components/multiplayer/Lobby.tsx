import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '../../contexts/MultiplayerContext';

interface LobbyProps {
  onGameStart: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const { isConnected, isJoined, joinGame, players, playerId } = useMultiplayer();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('default');
  const [showLobby, setShowLobby] = useState(true);

  // Start the game when successfully joined
  useEffect(() => {
    if (isJoined) {
      setShowLobby(false);
      onGameStart();
    }
  }, [isJoined, onGameStart]);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    joinGame(playerName, roomId);
  };

  if (!showLobby) return null;

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
            <ul className="player-list">
              {Object.values(players).map((player) => (
                <li key={player.id} className={player.id === playerId ? 'current-player' : ''}>
                  {player.name} {player.id === playerId ? '(You)' : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
