import React, { useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import { PlayerData } from '../../types';

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

  return (
    <group>
      {/* Player sphere */}
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      
      {/* Player name label */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {player.name}
      </Text>
    </group>
  );
};
