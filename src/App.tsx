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
  const { gameState } = useMultiplayer();
  
  // Enable/disable controls based on game state
  useEffect(() => {
    // Only enable controls when the game is in PLAYING state
    setControlsEnabled(gameState === GameState.PLAYING);
  }, [gameState]);
  
  return (
    <div className="app-container">
      <div className="game-header">
        <h1>Sumo Spheres</h1>
        <p>Use WASD keys to move, Space to jump, and Q/E to rotate camera!</p>
      </div>
      
      <div className="game-container">
        {/* Always show the Game component for the 3D arena */}
        <Game />
        
        {/* Lobby component handles its own visibility based on game state */}
        <Lobby />
      </div>
      
      <div className="game-footer">
        <p>Created with React, TypeScript, and react-three-fiber</p>
      </div>
    </div>
  );
}

function App() {
  return <AppWrapper />;
}

export default App
