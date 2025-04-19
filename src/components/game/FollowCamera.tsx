import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FollowCameraProps {
  target: THREE.Object3D | null;
  distance?: number;
  height?: number;
}

export const FollowCamera = ({ 
  target, 
  distance = 6, 
  height = 3 
}: FollowCameraProps) => {
  const { camera } = useThree();
  const cameraPosition = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  
  // Set initial camera position
  useEffect(() => {
    if (target) {
      target.getWorldPosition(targetPosition.current);
      
      // Position camera behind and above the target
      camera.position.set(
        targetPosition.current.x - distance,
        targetPosition.current.y + height,
        targetPosition.current.z
      );
      
      camera.lookAt(targetPosition.current);
    }
  }, [camera, target, distance, height]);
  
  // Update camera position to follow target
  useFrame(() => {
    if (target) {
      // Get current target position
      target.getWorldPosition(targetPosition.current);
      
      // Calculate desired camera position (behind and above target)
      cameraPosition.current.set(
        targetPosition.current.x - distance,
        targetPosition.current.y + height,
        targetPosition.current.z
      );
      
      // Smoothly interpolate current camera position toward desired position
      camera.position.lerp(cameraPosition.current, 0.05);
      
      // Make camera look at target
      camera.lookAt(targetPosition.current);
    }
  });
  
  return null;
};
