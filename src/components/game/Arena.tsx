import { useCylinder } from '@react-three/cannon';
import { useRef } from 'react';
import { ArenaProps } from '../../types';
import * as THREE from 'three';

export const Arena = ({ radius, position }: ArenaProps) => {
  // Create a reference for the visible mesh
  const visibleRef = useRef<THREE.Mesh>(null);
  
  // Create a cylinder for the arena floor - this gives us a proper circular boundary
  const [floorRef] = useCylinder(() => ({
    args: [radius, radius, 0.5, 32], // Top radius, bottom radius, height, segments
    position, // Use the provided position
    type: 'Static',
    material: {
      friction: 0.2,
    },
  }));
  
  // Create a series of cylinders around the edge to create a barrier
  const numBarriers = 16; // Number of barrier segments
  const barrierRefs = Array(numBarriers).fill(0).map((_, i) => {
    const angle = (i / numBarriers) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    return useCylinder(() => ({
      args: [0.3, 0.3, 0.5, 8], // Small cylinder for barrier
      position: [position[0] + x, position[1] + 0.25, position[2] + z],
      rotation: [0, 0, Math.PI / 2], // Lay the cylinder on its side
      type: 'Static',
      material: {
        friction: 0.2,
        restitution: 0.5, // Some bounce
      },
    }))[0];
  });

  return (
    <group>
      {/* Invisible physics cylinder for the floor */}
      <mesh ref={floorRef} visible={false} />
      
      {/* Barrier cylinders around the edge */}
      {barrierRefs.map((ref, i) => (
        <mesh key={i} ref={ref} visible={false} />
      ))}
      
      {/* The visible platform */}
      <mesh 
        ref={visibleRef}
        position={[position[0], position[1], position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow 
      >
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial 
          color="#4a6fa5" 
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Add a visible rim around the edge */}
      <mesh position={[position[0], position[1] + 0.25, position[2]]}>
        <torusGeometry args={[radius, 0.3, 16, 100]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
};
