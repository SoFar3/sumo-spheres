import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './Player';
import { Arena } from './Arena';
import { FollowCamera } from './FollowCamera';
import { RemotePlayer } from '../multiplayer/RemotePlayer';
import { useMultiplayer, GameState } from '../../contexts/MultiplayerContext';
import { GameUI } from '../ui/GameUI';

// Helper component to update player object reference
interface PlayerObjectUpdaterProps {
  playerRef: React.RefObject<THREE.Group | null>;
  setPlayerObject: (obj: THREE.Object3D | null) => void;
}

const PlayerObjectUpdater = ({ playerRef, setPlayerObject }: PlayerObjectUpdaterProps) => {
  useEffect(() => {
    if (playerRef.current) {
      setPlayerObject(playerRef.current);
    }
    
    return () => setPlayerObject(null);
  }, [playerRef, setPlayerObject]);
  
  return null;
};

export const Game = () => {
  const playerRef = useRef<THREE.Group>(null);
  const [playerObject, setPlayerObject] = useState<THREE.Object3D | null>(null);
  const { isJoined, players, playerId, gameState } = useMultiplayer();
  const [showLocalDummies, setShowLocalDummies] = useState(true);

  // Platform positions to match the Arena component
  const platformSize = 5;
  const gapSize = 1.5;
  
  // Define platform spawn positions for up to 8 players
  const spawnPositions = [
    // Top-left platform
    [-(platformSize/2) - (gapSize/2) + 1, 1, -(platformSize/2) - (gapSize/2) + 1] as [number, number, number],
    // Top-right platform
    [(platformSize/2) + (gapSize/2) + 1, 1, -(platformSize/2) - (gapSize/2) + 1] as [number, number, number],
    // Bottom-left platform
    [-(platformSize/2) - (gapSize/2) + 1, 1, (platformSize/2) + (gapSize/2) + 1] as [number, number, number],
    // Bottom-right platform
    [(platformSize/2) + (gapSize/2) + 1, 1, (platformSize/2) + (gapSize/2) + 1] as [number, number, number],
    // Top-left platform with offset (5th player)
    [-(platformSize/2) - (gapSize/2) + 2, 1, -(platformSize/2) - (gapSize/2) + 2] as [number, number, number],
    // Top-right platform with offset (6th player)
    [(platformSize/2) + (gapSize/2), 1, -(platformSize/2) - (gapSize/2)] as [number, number, number],
    // Bottom-left platform with offset (7th player)
    [-(platformSize/2) - (gapSize/2), 1, (platformSize/2) + (gapSize/2)] as [number, number, number],
    // Bottom-right platform with offset (8th player)
    [(platformSize/2) + (gapSize/2), 1, (platformSize/2) + (gapSize/2)] as [number, number, number],
  ];
  
  // Create 3 dummy balls positioned on different platforms
  const dummyBalls = [
    { position: spawnPositions[1], color: 'red', name: 'Red Player' },
    { position: spawnPositions[2], color: 'green', name: 'Green Player' },
    { position: spawnPositions[3], color: 'blue', name: 'Blue Player' },
  ];
  
  // Calculate spawn position for the current player based on index in players list
  const getPlayerSpawnPosition = (): [number, number, number] => {
    if (!isJoined || !playerId || !players || Object.keys(players).length === 0) {
      return spawnPositions[0]; // Default to first position if not joined
    }
    
    // Get player order by join time (implicit in players object)
    const playerIds = Object.keys(players);
    const playerIndex = playerIds.indexOf(playerId);
    
    // Assign position based on index, wrap around if needed
    return spawnPositions[playerIndex % spawnPositions.length];
  };
  
  // Hide dummy balls when in multiplayer mode
  useEffect(() => {
    if (isJoined && Object.keys(players).length > 1) {
      setShowLocalDummies(false);
    } else {
      setShowLocalDummies(true);
    }
  }, [isJoined, players]);

  // Use different styling to ensure the canvas is visible
  return (
    <div className="game-container" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
      {/* Game UI overlay */}
      <GameUI />
      
      <Canvas shadows camera={{ position: [0, 8, 8], fov: 50 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <Stats />
          
          {/* Add ambient lighting */}
          <ambientLight intensity={0.7} />
          
          {/* Add directional light for shadows */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Add a hemisphere light for better ambient lighting */}
          <hemisphereLight
            args={['#ffffff', '#004d99', 0.6]}
          />
          
          {/* Physics world */}
          <Physics 
            gravity={[0, -17, 0]} // Moderate gravity for balanced feel
            defaultContactMaterial={{
              friction: 0.15, // Balanced friction
              restitution: 0.5, // Moderate bounce
              contactEquationStiffness: 1200, // Increased stiffness for better close-contact interactions
              contactEquationRelaxation: 2, // Lower relaxation for more immediate response
              frictionEquationStiffness: 1000, // Increased friction stiffness for better pushing
              frictionEquationRelaxation: 2, // Lower friction relaxation for more immediate response
            }}
            allowSleep={false} // Prevent objects from sleeping to maintain continuous contact forces
            iterations={12} // More iterations for better contact resolution
          >
            {/* Arena */}
            <Arena radius={5} position={[0, 0, 0]} />
            
            {/* Local player ball - positioned on top-left platform if not joined */}
            <group ref={playerRef}>
              <Player 
                position={isJoined && players[playerId!] ? 
                  players[playerId!].position : 
                  getPlayerSpawnPosition()} 
                color={isJoined && players[playerId!] ? players[playerId!].color : "hotpink"} 
                isPlayer={true} 
                playerName={isJoined && players[playerId!] ? players[playerId!].name : "You"}
                controlsEnabled={gameState === GameState.PLAYING}
              />
            </group>
            
            {/* Update player object reference when playerRef changes */}
            <PlayerObjectUpdater playerRef={playerRef} setPlayerObject={setPlayerObject} />
            
            {/* Remote players in multiplayer mode */}
            {isJoined && Object.keys(players).map((id, index) => {
              const player = players[id];
              // Skip local player
              if (player.id === playerId) return null;
              
              // Ensure remote player has a position (use default spawn if needed)
              const playerWithPosition = {
                ...player,
                position: player.position || spawnPositions[index % spawnPositions.length]
              };
              
              return (
                <RemotePlayer 
                  key={id} 
                  player={playerWithPosition} 
                />
              );
            })}
            
            {/* Dummy balls (only in single player mode) */}
            {showLocalDummies && dummyBalls.map((ball, index) => (
              <Player 
                key={index}
                position={ball.position}
                color={ball.color}
              />
            ))}
          </Physics>
          
          {/* Camera that follows the player */}
          <FollowCamera target={playerObject} />
          
          {/* Environment map for realistic reflections */}
          <Environment preset="sunset" />
          
          {/* Optional controls for debugging - disabled by default */}
          <OrbitControls enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};
