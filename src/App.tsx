import './App.css'
import { Game } from './components/game/Game'

function App() {
  return (
    <div className="app-container">
      <div className="game-header">
        <h1>Sumo Spheres</h1>
        <p>Use WASD keys to move your ball and knock others off the arena!</p>
      </div>
      <div className="game-container">
        <Game />
      </div>
      <div className="game-footer">
        <p>Created with React, TypeScript, and react-three-fiber</p>
      </div>
    </div>
  )
}

export default App
