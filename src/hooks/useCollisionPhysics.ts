import { useRef, RefObject } from 'react';
import * as THREE from 'three';
import { PublicApi } from '@react-three/cannon';

// Shared collision physics configuration
const PHYSICS_CONFIG = {
  // Ball properties
  ballMass: 1.0, // Standard mass (kg)
  ballRadius: 0.5, // Ball radius (m)
  
  // Material properties
  friction: 0.2, // Friction for realistic movement
  restitution: 0.3, // Slightly reduced bounciness for more controlled collisions
  
  // Damping factors
  linearDamping: 0.25, // Balanced damping
  angularDamping: 0.4, // Increased angular damping for more stability

  // Collision params
  collisionCooldown: 50, // ms between collision processing
  collisionImpactThreshold: 0.5, // Minimum velocity for a significant collision
  collisionHistoryLimit: 20, // Max number of collisions to track
  collisionHistoryTimeout: 1000, // ms to keep collision history
  
  // Physics constants
  restitutionCoefficient: 0.7, // Bounciness factor (conservation of energy)
  upwardForceThreshold: 2, // Minimum impact for adding upward force
  maxUpwardForce: 2, // Maximum upward force on collision
};

// Export config for components to use for sphere creation
export const BALL_PHYSICS_CONFIG = {
  mass: PHYSICS_CONFIG.ballMass,
  args: [PHYSICS_CONFIG.ballRadius],
  material: {
    friction: PHYSICS_CONFIG.friction,
    restitution: PHYSICS_CONFIG.restitution,
  },
  linearDamping: PHYSICS_CONFIG.linearDamping,
  angularDamping: PHYSICS_CONFIG.angularDamping,
  collisionFilterGroup: 1,
  collisionFilterMask: 1,
};

// Types
interface CollisionState {
  lastCollisionTime: RefObject<number>;
  collisionHistory: RefObject<Map<string, number>>;
}

interface UseCollisionPhysicsProps {
  ref: RefObject<THREE.Object3D>;
  api: PublicApi;
  velocity: RefObject<THREE.Vector3>;
}

/**
 * Custom hook for handling shared collision physics between Player and RemotePlayer
 */
export const useCollisionPhysics = ({ ref, api, velocity }: UseCollisionPhysicsProps) => {
  // Initialize collision state
  const collisionState: CollisionState = {
    lastCollisionTime: useRef(0),
    collisionHistory: useRef<Map<string, number>>(new Map()),
  };
  
  /**
   * Process collisions with other objects
   * @param selfPosition Current position of this object
   * @param otherObject The object we're potentially colliding with
   * @param currentTime Current timestamp
   */
  const processCollision = (selfPosition: THREE.Vector3, otherObject: THREE.Object3D, currentTime: number) => {
    // Skip self and non-mesh objects
    if (otherObject === ref.current || otherObject.type !== 'Mesh') {
      return;
    }
    
    // Type assertion to access Mesh properties
    const mesh = otherObject as THREE.Mesh;
    
    // Check if this is a ball (sphere) with our expected radius
    if (!(mesh.geometry instanceof THREE.SphereGeometry) || 
        mesh.geometry.parameters.radius !== PHYSICS_CONFIG.ballRadius) {
      return;
    }
    
    // Calculate distance between balls
    const otherPosition = new THREE.Vector3();
    mesh.getWorldPosition(otherPosition);
    const distance = selfPosition.distanceTo(otherPosition);
    
    // Check if balls are actually colliding
    if (distance <= PHYSICS_CONFIG.ballRadius * 2) {
      // Prevent processing the same collision multiple times in rapid succession
      const otherBallId = otherObject.uuid;
      const lastCollisionWithBall = collisionState.collisionHistory.current.get(otherBallId) || 0;
      
      if (currentTime - lastCollisionWithBall > PHYSICS_CONFIG.collisionCooldown) {
        // Generate direction vector from other ball to this ball
        const collisionNormal = new THREE.Vector3().subVectors(selfPosition, otherPosition).normalize();
        
        // Calculate relative velocity projection along collision normal
        const relativeVelocity = new THREE.Vector3(velocity.current.x, 0, velocity.current.z);
        const velocityAlongNormal = relativeVelocity.dot(collisionNormal);
        
        // Skip collision processing if we're already moving away from the other ball
        if (velocityAlongNormal > -PHYSICS_CONFIG.collisionImpactThreshold) {
          // Calculate impulse for conservation of momentum
          // Simplified impulse calculation: assume other ball has equal mass
          const impulseStrength = -(1 + PHYSICS_CONFIG.restitutionCoefficient) * 
                                   velocityAlongNormal * 
                                   (PHYSICS_CONFIG.ballMass * 0.5);
          
          // Apply impulse to this ball
          const impulseVector = collisionNormal.clone().multiplyScalar(impulseStrength);
          api.applyImpulse(
            [impulseVector.x, 0, impulseVector.z],
            [0, 0, 0]
          );
          
          // Add a small upward component for more interesting game feel
          const horizontalImpactMagnitude = Math.abs(impulseVector.length());
          if (horizontalImpactMagnitude > PHYSICS_CONFIG.upwardForceThreshold) {
            const upwardForce = Math.min(horizontalImpactMagnitude * 0.1, PHYSICS_CONFIG.maxUpwardForce);
            api.applyImpulse([0, upwardForce, 0], [0, 0, 0]);
          }
          
          // Record this collision to prevent multiple collision responses
          collisionState.collisionHistory.current.set(otherBallId, currentTime);
          collisionState.lastCollisionTime.current = currentTime;
          
          // Clean up collision history periodically
          if (collisionState.collisionHistory.current.size > PHYSICS_CONFIG.collisionHistoryLimit) {
            // Remove entries older than specified timeout
            for (const [id, time] of collisionState.collisionHistory.current.entries()) {
              if (currentTime - time > PHYSICS_CONFIG.collisionHistoryTimeout) {
                collisionState.collisionHistory.current.delete(id);
              }
            }
          }
        }
      }
    }
  };
  
  /**
   * Find and process collisions with all nearby objects
   */
  const processCollisions = () => {
    if (!ref.current) return;
    
    const currentTime = Date.now();
    const selfPosition = new THREE.Vector3();
    ref.current.getWorldPosition(selfPosition);
    
    // Find all other objects in the scene
    ref.current.parent?.traverse((object: THREE.Object3D) => {
      processCollision(selfPosition, object, currentTime);
    });
    
    return selfPosition; // Return position for other uses (like name tag positioning)
  };
  
  // Return useful functions and state
  return {
    processCollisions,
    config: PHYSICS_CONFIG,
    state: collisionState
  };
};

// Helper function to calculate mass-adjusted force
export const calculateForce = (baseForce: number) => {
  return baseForce * PHYSICS_CONFIG.ballMass;
};
