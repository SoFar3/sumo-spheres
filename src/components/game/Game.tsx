import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './Player';
import { Arena } from './Arena';
import { FollowCamera } from './FollowCamera';

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

  // Create some dummy balls for collision testing
  const dummyBalls = [
    { position: [2, 1, 0] as [number, number, number], color: 'red' },
    { position: [-2, 1, 0] as [number, number, number], color: 'green' },
    { position: [0, 1, 2] as [number, number, number], color: 'blue' },
    { position: [0, 1, -2] as [number, number, number], color: 'yellow' },
    { position: [1.5, 1, 1.5] as [number, number, number], color: 'orange' },
    { position: [-1.5, 1, -1.5] as [number, number, number], color: 'purple' },
  ];

  return (
    <Canvas shadows camera={{ position: [0, 8, 8], fov: 50 }}>
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
          gravity={[0, -20, 0]} // Increased gravity for better falling effect
          defaultContactMaterial={{
            friction: 0.2,
            restitution: 0.8, // More bounce
          }}
          iterations={8} // More physics iterations for stability
        >
          {/* Arena */}
          <Arena radius={5} position={[0, 0, 0]} />
          
          {/* Player ball */}
          <group ref={playerRef}>
            <Player position={[0, 1, 0]} color="hotpink" isPlayer={true} />
          </group>
          
          {/* Update player object reference when playerRef changes */}
          <PlayerObjectUpdater playerRef={playerRef} setPlayerObject={setPlayerObject} />
          
          {/* Dummy balls */}
          {dummyBalls.map((ball, index) => (
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
  );
};
