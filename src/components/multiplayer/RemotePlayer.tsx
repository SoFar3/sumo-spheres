import React, { useEffect, useRef } from 'react';
import { useSphere } from '@react-three/cannon';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { PlayerData } from '../../types';
import * as THREE from 'three';

interface RemotePlayerProps {
  player: PlayerData;
}

export const RemotePlayer: React.FC<RemotePlayerProps> = ({ player }) => {
  // Create a physics sphere for the remote player
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: player.position,
    args: [0.5], // Radius of the sphere
    material: {
      friction: 0.2,
      restitution: 0.8, // Bounciness
    },
    type: 'Dynamic',
    collisionFilterGroup: 1,
    collisionFilterMask: 1,
  }));

  // Update the physics body when the player's position changes
  useEffect(() => {
    if (player.position) {
      api.position.set(...player.position);
    }
    
    if (player.velocity) {
      api.velocity.set(...player.velocity);
    }
  }, [player.position, player.velocity, api.position, api.velocity]);

  // Create refs to track the current position
  const currentPosition = useRef(new THREE.Vector3());
  const nameRef = useRef<THREE.Group>(null);
  
  // Update position ref when player position changes
  useEffect(() => {
    if (player.position) {
      currentPosition.current.set(player.position[0], player.position[1], player.position[2]);
    }
  }, [player.position]);
  
  // Update the name tag position every frame
  useFrame(() => {
    if (nameRef.current) {
      // Get the current ball position from the physics body
      const ballPosition = new THREE.Vector3();
      ref.current?.getWorldPosition(ballPosition);
      
      // Update the name tag position to follow the ball
      nameRef.current.position.x = ballPosition.x;
      nameRef.current.position.y = ballPosition.y + 0.7; // Position above the ball
      nameRef.current.position.z = ballPosition.z;
    }
  });
  
  return (
    <group>
      {/* Player sphere */}
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      
      {/* Player name label */}
      <group ref={nameRef}>
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            fontSize={0.15}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            renderOrder={1}
          >
            {player.name}
          </Text>
        </Billboard>
      </group>
    </group>
  );
};
