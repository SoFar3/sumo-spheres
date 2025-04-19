import { useRef, useEffect, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { PlayerProps } from '../../types';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import * as THREE from 'three';

// Throttle function to limit how often a function can be called
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export const Player = ({ position, color, isPlayer = false, playerName, controlsEnabled = true }: PlayerProps) => {
  const keys = useKeyboardControls();
  const { updatePosition, sendPlayerAction, reportPlayerFell } = useMultiplayer();
  const [fallen, setFallen] = useState(false);
  const [canJump, setCanJump] = useState(true);
  const initialPosition = useRef(position);
  const jumpCooldown = useRef<number | null>(null);
  const lastReportedPosition = useRef<[number, number, number]>(position);
  
  // Create the physics sphere
  const [ref, api] = useSphere(() => ({
    mass: 0.8, // Increased mass for more weight
    position,
    args: [0.5], // Radius of the sphere
    material: {
      friction: 0.2, // Increased friction for better pushing
      restitution: 0.4, // Reduced bounciness for more solid feel
    },
    linearDamping: 0.25, // Balanced damping
    angularDamping: 0.4, // Increased angular damping for more stability
    // Add collision filtering to ensure proper physics
    collisionFilterGroup: 1,
    collisionFilterMask: 1,
  }));

  // Store velocity and position in refs so we can access them in useFrame
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(position[0], position[1], position[2]));
  
  // Create a throttled function to send position updates
  const sendPositionThrottled = useRef<(position: [number, number, number], rotation?: [number, number, number], velocity?: [number, number, number]) => void>(() => {});
  useEffect(() => {
    // Create a throttled function to send position and velocity updates
    sendPositionThrottled.current = throttle(
      (position: [number, number, number], rotation?: [number, number, number], velocity?: [number, number, number]) => {
        updatePosition(position, rotation, velocity);
      }, 
      50
    ); // Send updates every 50ms maximum
  }, [updatePosition]);

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
        
        // Report to server if this is the local player
        if (isPlayer) {
          reportPlayerFell();
          setTimeout(respawn, 1000);
        } else {
          // For non-player balls, respawn immediately with a small random delay to prevent physics glitches
          setTimeout(respawn, Math.random() * 500);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(fallCheckInterval);
  }, [fallen, isPlayer, reportPlayerFell]);
  
  // Track consecutive jumps for bunny hop limitation
  const consecutiveJumps = useRef(0);
  const lastJumpTime = useRef(0);
  const maxConsecutiveJumps = 3; // Maximum number of consecutive jumps allowed
  
  // Function to handle jumping
  const handleJump = () => {
    if (canJump && isPlayer && !fallen) {
      const now = Date.now();
      const timeSinceLastJump = now - lastJumpTime.current;
      
      // Check if this is a consecutive jump (within 500ms of landing)
      if (timeSinceLastJump < 500) {
        consecutiveJumps.current += 1;
      } else {
        consecutiveJumps.current = 0;
      }
      
      // Calculate jump force based on consecutive jumps (bunny hop mechanic with limitations)
      let jumpForce = 7; // Base jump force - shorter jump
      
      // Bunny hop: Each consecutive jump gets higher, up to a limit
      if (consecutiveJumps.current > 0 && consecutiveJumps.current < maxConsecutiveJumps) {
        jumpForce += consecutiveJumps.current * 1.5; // Increase jump force for bunny hops
      } else if (consecutiveJumps.current >= maxConsecutiveJumps) {
        jumpForce = 5; // Reduced jump force after max consecutive jumps to limit exploitation
      }
      
      // Apply an upward impulse for jumping
      api.applyImpulse([0, jumpForce, 0], [0, 0, 0]);
      
      // Update last jump time
      lastJumpTime.current = now;
      
      // Notify other players about the jump action
      sendPlayerAction('jump');
      
      // Set jump cooldown
      setCanJump(false);
      
      // Clear any existing cooldown
      if (jumpCooldown.current) {
        clearTimeout(jumpCooldown.current);
      }
      
      // Set a new cooldown (can jump again after 350ms - shorter for better responsiveness)
      jumpCooldown.current = setTimeout(() => {
        setCanJump(true);
      }, 350);
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
  
  // Store nearby players for proximity force calculations
  const nearbyPlayers = useRef<THREE.Object3D[]>([]);
  
  // Store collision state
  const lastCollisionTime = useRef(0);
  const collisionCooldown = 100; // ms between collision processing
  
  // Update player position based on keyboard input and send updates to server
  useFrame(({ scene, camera }) => {
    // Update nearby players list for proximity force calculations
    if (isPlayer) {
      // Find all other player balls in the scene
      nearbyPlayers.current = [];
      scene.traverse((object) => {
        // Skip self and non-mesh objects
        if (object !== ref.current && object.type === 'Mesh') {
          // Type assertion to access Mesh properties
          const mesh = object as THREE.Mesh;
          
          if (mesh.geometry instanceof THREE.SphereGeometry && 
              mesh.geometry.parameters.radius === 0.5) {
            nearbyPlayers.current.push(object);
          }
        }
      });
    }
    
    if (isPlayer && !fallen && controlsEnabled) {
      // Send position and velocity updates to server (throttled)
      const currentPos = [currentPosition.current.x, currentPosition.current.y, currentPosition.current.z] as [number, number, number];
      const currentVel = [velocity.current.x, velocity.current.y, velocity.current.z] as [number, number, number];
      const currentRot = [0, 0, 0] as [number, number, number]; // Default rotation if needed
      
      if (sendPositionThrottled.current) {
        sendPositionThrottled.current(currentPos, currentRot, currentVel);
        lastReportedPosition.current = currentPos;
      }
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
        direction.normalize().multiplyScalar(8); // Reduced force for more balanced movement
        api.applyForce([direction.x, 0, direction.z], [0, 0, 0]);
      }
      
      // Apply a small drag force to prevent infinite sliding
      if (velocity.current.length() > 0.1) {
        // Apply more drag at higher speeds to limit maximum velocity
        const currentSpeed = velocity.current.length();
        const dragFactor = Math.min(0.08, 0.05 + (currentSpeed * 0.005)); // Progressive drag that increases with speed
        
        const drag = velocity.current.clone().negate().multiplyScalar(dragFactor);
        api.applyForce([drag.x, 0, drag.z], [0, 0, 0]);
      }
      
      // Apply proximity forces to nearby players (pushing effect when close)
      if (nearbyPlayers.current.length > 0 && ref.current) {
        const selfPosition = new THREE.Vector3();
        ref.current.getWorldPosition(selfPosition);
        const currentTime = Date.now();
        
        nearbyPlayers.current.forEach(otherBall => {
          const otherPosition = new THREE.Vector3();
          otherBall.getWorldPosition(otherPosition);
          
          // Calculate distance and direction
          const distance = selfPosition.distanceTo(otherPosition);
          
          // Handle collisions - balls are actually colliding
          if (distance <= 1.0 && currentTime - lastCollisionTime.current > collisionCooldown) {
            // Direction from other ball to this ball
            const direction = new THREE.Vector3().subVectors(selfPosition, otherPosition).normalize();
            
            // Calculate collision impact based on current velocity
            const speed = velocity.current.length();
            const impactForce = Math.max(5, speed * 3); // Base force + speed multiplier
            
            // Apply stronger rebound force on collision
            api.applyImpulse(
              [direction.x * impactForce, 0, direction.z * impactForce],
              [0, 0, 0]
            );
            
            // Update collision time
            lastCollisionTime.current = currentTime;
            
            // Add a small upward force for more dramatic collisions at high speeds
            if (speed > 5) {
              const upwardForce = Math.min(speed * 0.5, 4); // Cap the upward force
              api.applyImpulse([0, upwardForce, 0], [0, 0, 0]);
            }
          }
          // Only apply proximity force if balls are close but not colliding
          else if (distance < 1.5 && distance > 1.0) {
            // Direction from other ball to this ball
            const direction = new THREE.Vector3().subVectors(selfPosition, otherPosition).normalize();
            
            // Calculate force strength based on proximity (stronger as they get closer)
            const proximityFactor = 1.0 - (distance - 1.0) / 0.5; // 0 at distance 1.5, 1 at distance 1.0
            const forceStrength = 2.0 * proximityFactor; // Adjust multiplier for desired push strength
            
            // Apply the proximity force
            api.applyForce(
              [direction.x * forceStrength, 0, direction.z * forceStrength],
              [0, 0, 0]
            );
          }
        });
      }
    }
  });

  // Create a reference for the name tag
  const nameTagRef = useRef<THREE.Group>(null);
  
  // Update the name tag position to follow the ball
  useFrame(() => {
    if (nameTagRef.current) {
      nameTagRef.current.position.x = currentPosition.current.x;
      nameTagRef.current.position.y = currentPosition.current.y + 0.7; // Position above the ball
      nameTagRef.current.position.z = currentPosition.current.z;
    }
  });
  
  return (
    <group>
      {/* The physics-controlled ball */}
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Player name that follows the ball using useFrame */}
      {playerName && (
        <group ref={nameTagRef}>
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
              {playerName} {isPlayer ? '(You)' : ''}
            </Text>
          </Billboard>
        </group>
      )}
    </group>
  );
};
