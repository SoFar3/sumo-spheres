import { useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { PlayerProps } from '../../types';
import * as THREE from 'three';

export const Player = ({ position, color, isPlayer = false }: PlayerProps) => {
  const keys = useKeyboardControls();
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5], // Radius of the sphere
    material: {
      friction: 0.1,
      restitution: 0.8, // Bounciness
    },
  }));

  // Store velocity in a ref so we can access it in useFrame
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Subscribe to physics updates for this body
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);
    });
    return unsubscribe;
  }, [api.velocity]);

  // Update player position based on keyboard input
  useFrame(() => {
    if (isPlayer) {
      const direction = new THREE.Vector3();
      
      // Calculate movement direction based on key presses
      if (keys.forward) direction.z -= 1;
      if (keys.backward) direction.z += 1;
      if (keys.left) direction.x -= 1;
      if (keys.right) direction.x += 1;
      
      // Normalize the direction vector and apply force
      if (direction.length() > 0) {
        direction.normalize().multiplyScalar(5); // Adjust force strength
        api.applyForce([direction.x, 0, direction.z], [0, 0, 0]);
      }
      
      // Apply a small drag force to prevent infinite sliding
      if (velocity.current.length() > 0.1) {
        const drag = velocity.current.clone().negate().multiplyScalar(0.05);
        api.applyForce([drag.x, 0, drag.z], [0, 0, 0]);
      }
    }
  });

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};
