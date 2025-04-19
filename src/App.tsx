import { useState } from 'react';
import './App.css';
import { Game } from './components/game/Game';
import { Lobby } from './components/multiplayer/Lobby';
import { MultiplayerProvider } from './contexts/MultiplayerContext';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  
  return (
    <MultiplayerProvider>
      <div className="app-container">
        <div className="game-header">
          <h1>Sumo Spheres</h1>
          <p>Use WASD keys to move, Space to jump, and Q/E to rotate camera!</p>
        </div>
        
        <div className="game-container">
          {/* Show lobby until game starts */}
          {!gameStarted && <Lobby onGameStart={() => setGameStarted(true)} />}
          <Game />
        </div>
        
        <div className="game-footer">
          <p>Created with React, TypeScript, and react-three-fiber</p>
        </div>
      </div>
    </MultiplayerProvider>
  );
}

export default App
