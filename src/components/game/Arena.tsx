import { useBox } from '@react-three/cannon';
import { useRef } from 'react';
import { ArenaProps } from '../../types';
import * as THREE from 'three';

export const Arena = ({ position, platformSize = 5, gapSize = 1.5 }: ArenaProps) => {
  // Platform references for physics and rendering
  const platformRefs = useRef<THREE.Mesh[]>([]);
  const physicsRefs: React.RefObject<THREE.Mesh>[] = [];
  
  // Create four platform positions (quadrants)
  const platformPositions: [number, number, number][] = [
    // Top-left
    [
      position[0] - (platformSize/2) - (gapSize/2),
      position[1],
      position[2] - (platformSize/2) - (gapSize/2)
    ],
    // Top-right
    [
      position[0] + (platformSize/2) + (gapSize/2),
      position[1],
      position[2] - (platformSize/2) - (gapSize/2)
    ],
    // Bottom-left
    [
      position[0] - (platformSize/2) - (gapSize/2),
      position[1],
      position[2] + (platformSize/2) + (gapSize/2)
    ],
    // Bottom-right
    [
      position[0] + (platformSize/2) + (gapSize/2),
      position[1],
      position[2] + (platformSize/2) + (gapSize/2)
    ]
  ];
  
  // Create physics boxes for each platform
  platformPositions.forEach((platformPos) => {
    const [boxRef] = useBox<THREE.Mesh>(() => ({
      args: [platformSize, 0.5, platformSize], // width, height, depth
      position: platformPos, 
      type: 'Static',
      material: {
        friction: 0.2,
      },
    }));
    
    physicsRefs.push(boxRef);
  });

  return (
    <group>
      {/* Physics boxes for the platforms (invisible) */}
      {physicsRefs.map((ref, i) => (
        <mesh key={`physics-${i}`} ref={ref} visible={false} />
      ))}
      
      {/* Visible platforms */}
      {platformPositions.map((platformPos, i) => (
        <mesh 
          key={`platform-${i}`}
          ref={(el) => {
            if (el) platformRefs.current[i] = el;
          }}
          position={platformPos}
          receiveShadow
        >
          <boxGeometry args={[platformSize, 0.5, platformSize]} />
          <meshStandardMaterial 
            color="#4a6fa5" 
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      ))}
      
      {/* Decorative elements on each platform */}
      {platformPositions.map((platformPos, i) => (
        <group key={`decorations-${i}`}>
          {/* Platform edge highlight */}
          <mesh 
            position={[platformPos[0], platformPos[1] + 0.26, platformPos[2]]}
            receiveShadow
          >
            <boxGeometry args={[platformSize, 0.02, platformSize]} />
            <meshStandardMaterial 
              color="#2c3e50"
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          
          {/* Platform corner markers */}
          <mesh 
            position={[platformPos[0] - platformSize/2 + 0.5, platformPos[1] + 0.3, platformPos[2] - platformSize/2 + 0.5]}
          >
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
