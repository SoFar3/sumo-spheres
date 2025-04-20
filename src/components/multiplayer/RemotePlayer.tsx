import React, { useEffect, useRef } from 'react';
import { useSphere } from '@react-three/cannon';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { PlayerData } from '../../types';
import * as THREE from 'three';
import { useCollisionPhysics, BALL_PHYSICS_CONFIG } from '../../hooks/useCollisionPhysics';

interface RemotePlayerProps {
  player: PlayerData;
}

export const RemotePlayer: React.FC<RemotePlayerProps> = ({ player }) => {
  // Create a physics sphere for the remote player using shared physics config
  const [ref, api] = useSphere(() => ({
    mass: BALL_PHYSICS_CONFIG.mass,
    position: player.position,
    args: [BALL_PHYSICS_CONFIG.args[0]], // Extract radius as a single value
    material: BALL_PHYSICS_CONFIG.material,
    linearDamping: BALL_PHYSICS_CONFIG.linearDamping,
    angularDamping: BALL_PHYSICS_CONFIG.angularDamping,
    collisionFilterGroup: BALL_PHYSICS_CONFIG.collisionFilterGroup,
    collisionFilterMask: BALL_PHYSICS_CONFIG.collisionFilterMask
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
  const positionRef = useRef(new THREE.Vector3());
  const nameRef = useRef<THREE.Group>(null);
  
  // Store velocity for collision calculations
  const velocity = useRef(new THREE.Vector3());
  
  // Update position and velocity refs when player data changes
  useEffect(() => {
    if (player.position) {
      positionRef.current.set(player.position[0], player.position[1], player.position[2]);
    }
    
    if (player.velocity) {
      velocity.current.set(player.velocity[0], player.velocity[1], player.velocity[2]);
    }
  }, [player.position, player.velocity]);
  
  // Use the shared collision physics system
  const { processCollisions } = useCollisionPhysics({
    ref,
    api,
    velocity
  });
  
  // Update the name tag position and handle collisions
  useFrame(() => {
    // Get the current world position of the ball
    if (ref.current && nameRef.current) {
      // Get current position from the physics object
      const ballPosition = new THREE.Vector3();
      ref.current.getWorldPosition(ballPosition);
      
      // Update the stored position
      positionRef.current.copy(ballPosition);
      
      // Update name tag position to follow the ball
      nameRef.current.position.x = ballPosition.x;
      nameRef.current.position.y = ballPosition.y + 0.7; // Position above the ball
      nameRef.current.position.z = ballPosition.z;
    }
    
    // Use shared collision physics
    if (ref.current) {
      // Process collisions using the shared hook
      processCollisions();
      
      // Additional RemotePlayer-specific processing could go here
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
