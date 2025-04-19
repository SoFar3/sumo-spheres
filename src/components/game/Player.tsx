import { useRef, useEffect, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { PlayerProps } from '../../types';
import * as THREE from 'three';

export const Player = ({ position, color, isPlayer = false }: PlayerProps) => {
  const keys = useKeyboardControls();
  const [fallen, setFallen] = useState(false);
  const [canJump, setCanJump] = useState(true);
  const initialPosition = useRef(position);
  const jumpCooldown = useRef<number | null>(null);
  
  // Create the physics sphere
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5], // Radius of the sphere
    material: {
      friction: 0.2,
      restitution: 0.8, // Bounciness
    },
    // Add a sleep threshold to improve performance
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    // Add collision filtering to ensure proper physics
    collisionFilterGroup: 1,
    collisionFilterMask: 1,
  }));

  // Store velocity and position in refs so we can access them in useFrame
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(position[0], position[1], position[2]));
  
  // Subscribe to physics updates for this body
  useEffect(() => {
    // Subscribe to velocity updates
    const unsubscribeVelocity = api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);
    });
    
    // Subscribe to position updates
    const unsubscribePosition = api.position.subscribe((p) => {
      currentPosition.current.set(p[0], p[1], p[2]);
    });
    
    return () => {
      unsubscribeVelocity();
      unsubscribePosition();
    };
  }, [api.velocity, api.position]);
  
  // Function to respawn the player
  const respawn = () => {
    // Add a small random offset to prevent balls from stacking exactly on top of each other
    const randomOffset = isPlayer ? [0, 0, 0] : [
      (Math.random() - 0.5) * 0.5,
      0,
      (Math.random() - 0.5) * 0.5
    ];
    
    // Reset position to initial position but slightly above to prevent clipping
    api.position.set(
      initialPosition.current[0] + randomOffset[0], 
      initialPosition.current[1] + 1.5, // Higher respawn to ensure it doesn't clip
      initialPosition.current[2] + randomOffset[2]
    );
    
    // Reset velocity
    api.velocity.set(0, 0, 0);
    // Reset angular velocity
    api.angularVelocity.set(0, 0, 0);
    // Reset fallen state
    setFallen(false);
  };

  // Check if player has fallen off the arena
  useEffect(() => {
    // Set up an interval to check if the player has fallen below a certain threshold
    const fallCheckInterval = setInterval(() => {
      // If the player's y position is below -5, they've fallen off
      if (currentPosition.current.y < -5 && !fallen) {
        console.log('Player fell off the arena!');
        setFallen(true);
        
        // If it's the player, respawn after a short delay
        if (isPlayer) {
          setTimeout(respawn, 1000);
        } else {
          // For non-player balls, respawn immediately with a small random delay to prevent physics glitches
          setTimeout(respawn, Math.random() * 500);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(fallCheckInterval);
  }, [fallen, isPlayer]);
  
  // Function to handle jumping
  const handleJump = () => {
    if (canJump && isPlayer && !fallen) {
      // Apply an upward impulse for jumping
      api.applyImpulse([0, 10, 0], [0, 0, 0]);
      
      // Set jump cooldown
      setCanJump(false);
      
      // Clear any existing cooldown
      if (jumpCooldown.current) {
        clearTimeout(jumpCooldown.current);
      }
      
      // Set a new cooldown (can jump again after 1 second)
      jumpCooldown.current = setTimeout(() => {
        setCanJump(true);
      }, 1000);
    }
  };
  
  // Clean up the jump cooldown timer when component unmounts
  useEffect(() => {
    return () => {
      if (jumpCooldown.current) {
        clearTimeout(jumpCooldown.current);
      }
    };
  }, []);
  
  // Update player position based on keyboard input
  useFrame(({ camera }) => {
    if (isPlayer && !fallen) {
      // Get camera's forward and right vectors for movement relative to camera
      const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      
      // Project these vectors onto the xz plane and normalize
      cameraForward.y = 0;
      cameraRight.y = 0;
      cameraForward.normalize();
      cameraRight.normalize();
      
      // Calculate movement direction based on key presses
      const direction = new THREE.Vector3();
      
      if (keys.forward) direction.add(cameraForward);
      if (keys.backward) direction.sub(cameraForward);
      if (keys.left) direction.sub(cameraRight);
      if (keys.right) direction.add(cameraRight);
      
      // Handle jumping with space bar
      if (keys.jump && canJump) {
        handleJump();
      }
      
      // Normalize the direction vector and apply force
      if (direction.length() > 0) {
        direction.normalize().multiplyScalar(8); // Increased force strength
        api.applyForce([direction.x, 0, direction.z], [0, 0, 0]);
      }
      
      // Apply a small drag force to prevent infinite sliding
      if (velocity.current.length() > 0.1) {
        const drag = velocity.current.clone().negate().multiplyScalar(0.1); // Increased drag
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
