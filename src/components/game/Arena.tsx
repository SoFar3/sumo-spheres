import { usePlane } from '@react-three/cannon';
import { useEffect } from 'react';
import { ArenaProps } from '../../types';

export const Arena = ({ radius, position }: ArenaProps) => {
  // Create a circular platform using a plane with a circular texture
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0], // Rotate to be horizontal
    position,
    type: 'Static',
    material: {
      friction: 0.1,
    },
  }));

  // We'll handle fall detection in the physics world instead
  // This is a placeholder for future collision handling
  useEffect(() => {
    const checkFallOff = () => {
      // In a more complex game, we would check player positions here
      // and handle respawning or scoring
    };
    
    // Set up interval to check if players have fallen off
    const intervalId = setInterval(checkFallOff, 500);
    
    return () => clearInterval(intervalId);
  }, [radius, position]);

  return (
    <group>
      {/* The visible platform */}
      <mesh 
        ref={ref} 
        receiveShadow 
      >
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial 
          color="#4a6fa5" 
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Add a subtle rim around the edge */}
      <mesh position={[position[0], position[1] - 0.05, position[2]]}>
        <torusGeometry args={[radius, 0.2, 16, 100]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
};
