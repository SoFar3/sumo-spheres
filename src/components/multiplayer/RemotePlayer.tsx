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
    mass: 0.8, // Increased mass for more weight (matching local player)
    position: player.position,
    args: [0.5], // Radius of the sphere
    material: {
      friction: 0.2, // Increased friction for better pushing
      restitution: 0.4, // Reduced bounciness for more solid feel
    },
    linearDamping: 0.25, // Balanced damping
    angularDamping: 0.4, // Increased angular damping for more stability
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
  
  // Store velocity for collision calculations
  const velocity = useRef(new THREE.Vector3());
  
  // Update position and velocity refs when player data changes
  useEffect(() => {
    if (player.position) {
      currentPosition.current.set(player.position[0], player.position[1], player.position[2]);
    }
    
    if (player.velocity) {
      velocity.current.set(player.velocity[0], player.velocity[1], player.velocity[2]);
    }
  }, [player.position, player.velocity]);
  
  // Update the name tag position and handle collisions
  useFrame(({ scene }) => {
    // Update name tag position
    if (nameRef.current) {
      nameRef.current.position.x = currentPosition.current.x;
      nameRef.current.position.y = currentPosition.current.y + 0.7; // Position above the ball
      nameRef.current.position.z = currentPosition.current.z;
    }
    
    // Apply collision effects based on velocity
    if (ref.current && velocity.current.length() > 5) {
      // Find nearby players for high-speed collisions
      scene.traverse((object: THREE.Object3D) => {
        // Skip self and non-mesh objects
        if (object !== ref.current && object.type === 'Mesh') {
          // Type assertion to access Mesh properties
          const mesh = object as THREE.Mesh;
          
          if (mesh.geometry instanceof THREE.SphereGeometry && 
              mesh.geometry.parameters.radius === 0.5) {
            // Calculate distance between balls
            const otherPosition = new THREE.Vector3();
            mesh.getWorldPosition(otherPosition);
            
            const selfPosition = new THREE.Vector3();
            ref.current.getWorldPosition(selfPosition);
            
            const distance = selfPosition.distanceTo(otherPosition);
            
            // Apply collision effect for high-speed impacts
            if (distance <= 1.05) {
              const direction = new THREE.Vector3().subVectors(selfPosition, otherPosition).normalize();
              const speed = velocity.current.length();
              const impactForce = Math.max(3, speed * 2);
              
              // Apply stronger rebound on collision
              api.applyImpulse(
                [direction.x * impactForce, 0, direction.z * impactForce],
                [0, 0, 0]
              );
              
              // Add upward force for dramatic collisions
              if (speed > 6) {
                api.applyImpulse([0, speed * 0.3, 0], [0, 0, 0]);
              }
            }
          }
        }
      });
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
