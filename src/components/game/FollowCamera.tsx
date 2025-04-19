import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';

interface FollowCameraProps {
  target: THREE.Object3D | null;
  distance?: number;
  height?: number;
}

export const FollowCamera = ({ 
  target, 
  distance = 7, 
  height = 5 
}: FollowCameraProps) => {
  const { camera } = useThree();
  const keys = useKeyboardControls();
  const cameraPosition = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  
  // Track camera rotation angle
  const [cameraAngle, setCameraAngle] = useState(0);
  const rotationSpeed = 0.03; // Speed of rotation in radians
  
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
      // Handle camera rotation with Q and E keys
      if (keys.rotateLeft) {
        setCameraAngle(angle => angle + rotationSpeed);
      }
      if (keys.rotateRight) {
        setCameraAngle(angle => angle - rotationSpeed);
      }
      
      // Get current target position
      target.getWorldPosition(targetPosition.current);
      
      // Calculate desired camera position with rotation
      const x = Math.sin(cameraAngle) * distance;
      const z = Math.cos(cameraAngle) * distance;
      
      cameraPosition.current.set(
        targetPosition.current.x + x,
        targetPosition.current.y + height,
        targetPosition.current.z + z
      );
      
      // Smoothly interpolate current camera position toward desired position
      camera.position.lerp(cameraPosition.current, 0.1); // Faster camera movement
      
      // Make camera look at target
      camera.lookAt(targetPosition.current);
      
      // Add a slight tilt to the camera for better perspective
      camera.up.set(0, 1, 0);
    }
  });
  
  return null;
};
