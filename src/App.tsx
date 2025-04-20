import { useEffect } from 'react';
import './App.css';
import { Game } from './components/game/Game';
import { Lobby } from './components/multiplayer/Lobby';
import { MultiplayerProvider, useMultiplayer, GameState } from './contexts/MultiplayerContext';
import { setControlsEnabled } from './hooks/useKeyboardControls';

// Main App wrapper that provides the multiplayer context
function AppWrapper() {
  return (
    <MultiplayerProvider>
      <AppContent />
    </MultiplayerProvider>
  );
}

// App content that consumes the multiplayer context
function AppContent() {
  const { gameState, isConnected, isJoined, players, playerId } = useMultiplayer();
  
  // Enable/disable controls based on game state
  useEffect(() => {
    // Only enable controls when the game is in PLAYING state
    setControlsEnabled(gameState === GameState.PLAYING);
  }, [gameState]);
  
  return (
    <div className="app-container">
      {/* Only show header in menu/lobby, not during gameplay */}
      {gameState !== GameState.PLAYING && (
        <div className="game-header">
          <h1>Sumo Spheres</h1>
          <p>
            <strong>Game Controls:</strong><br />
            Movement: WASD keys<br />
            Jump: Space<br />
            Camera: Right-click + drag to rotate/tilt<br />
            Zoom: Mouse wheel<br />
            Optional: Q/E keys to rotate camera
          </p>
        </div>
      )}
      
      <div className="game-container">
        {/* Always show the Game component for the 3D arena */}
        <Game />
        
        {/* Lobby component handles its own visibility based on game state */}
        <Lobby />
        
        {/* Debug overlay - consider making this toggleable */}
        <div className="debug-overlay">
          <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Game State: {gameState}</div>
          <div>Joined: {isJoined ? 'Yes' : 'No'}</div>
          <div>Player Count: {Object.keys(players).length}</div>
          <div>Player ID: {playerId || 'None'}</div>
        </div>
      </div>
      
      {/* Footer removed as requested */}
    </div>
  );
}

function App() {
  return <AppWrapper />;
}

export default App
