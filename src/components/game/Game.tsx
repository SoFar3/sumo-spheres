import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './Player';
import { Arena } from './Arena';
import { FollowCamera } from './FollowCamera';

export const Game = () => {
  const playerRef = useRef<THREE.Group>(null);

  // Create some dummy balls for collision testing
  const dummyBalls = [
    { position: [2, 0.5, 0] as [number, number, number], color: 'red' },
    { position: [-2, 0.5, 0] as [number, number, number], color: 'green' },
    { position: [0, 0.5, 2] as [number, number, number], color: 'blue' },
    { position: [0, 0.5, -2] as [number, number, number], color: 'yellow' },
  ];

  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
      <Suspense fallback={null}>
        <Stats />
        
        {/* Add ambient lighting */}
        <ambientLight intensity={0.5} />
        
        {/* Add directional light for shadows */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Physics world */}
        <Physics 
          gravity={[0, -9.8, 0]}
          defaultContactMaterial={{
            friction: 0.1,
            restitution: 0.7,
          }}
        >
          {/* Arena */}
          <Arena radius={5} position={[0, 0, 0]} />
          
          {/* Player ball */}
          <group ref={playerRef}>
            <Player position={[0, 0.5, 0]} color="hotpink" isPlayer={true} />
          </group>
          
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
        <FollowCamera target={playerRef.current} />
        
        {/* Environment map for realistic reflections */}
        <Environment preset="sunset" />
        
        {/* Optional controls for debugging */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Suspense>
    </Canvas>
  );
};
