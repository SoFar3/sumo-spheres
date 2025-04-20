import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { GameState, useMultiplayer } from '../../contexts/MultiplayerContext';

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
  
  // Add mouse and keyboard controls
  const { gl } = useThree();
  const { gameState } = useMultiplayer();
  
  // Track camera vertical angle (elevation)
  const [cameraElevation, setCameraElevation] = useState(0.5); // Start at midpoint
  const minElevation = 0.1; // Lowest camera can go
  const maxElevation = 0.8; // Highest camera can go
  
  // Track camera zoom level
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5; // Zoom in limit (closer)
  const maxZoom = 3.0; // Zoom out limit (much further)
  const zoomSpeed = 0.15; // Faster zooming for better responsiveness
  
  // Mouse control refs
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const mouseSensitivity = 0.003; // Original mouse sensitivity
  
  // Simple mouse-only event handlers
  useEffect(() => {
    // Only enable controls when playing
    if (gameState !== GameState.PLAYING) return;
    
    // Basic mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button only
        isDragging.current = true;
        previousMousePosition.current.x = e.clientX;
        previousMousePosition.current.y = e.clientY;
        e.preventDefault();
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        // Calculate movement delta
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        
        // Camera rotation (horizontal movement)
        setCameraAngle(angle => angle - deltaX * mouseSensitivity);
        
        // Camera elevation (vertical movement)
        setCameraElevation(elevation => {
          return Math.max(minElevation, Math.min(maxElevation, 
            elevation + deltaY * mouseSensitivity * 0.5
          ));
        });
        
        // Update previous position
        previousMousePosition.current.x = e.clientX;
        previousMousePosition.current.y = e.clientY;
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    // Simple wheel handler for zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Basic zoom with mouse wheel
      const zoomDelta = Math.sign(e.deltaY) * zoomSpeed * 0.5;
      setZoomLevel(currentZoom => {
        return Math.max(minZoom, Math.min(maxZoom, currentZoom + zoomDelta));
      });
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menu when right-clicking
      e.preventDefault();
    };
    
    // Add event listeners
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    // Clean up on unmount
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, gameState, mouseSensitivity, minElevation, maxElevation, minZoom, maxZoom, zoomSpeed]);
  
  // Update camera position to follow target
  useFrame(() => {
    if (target) {
      // Only rotate with Q and E keys, no camera movement with WASD
      if (keys.rotateLeft) {
        setCameraAngle(angle => angle + rotationSpeed);
      }
      if (keys.rotateRight) {
        setCameraAngle(angle => angle - rotationSpeed);
      }
      
      // Get current target position
      target.getWorldPosition(targetPosition.current);
      
      // Calculate desired camera position with rotation, elevation and zoom
      const zoomedDistance = distance * zoomLevel;
      
      // Apply elevation to calculate height - lerp between min and max height
      const minHeight = height * 0.5;
      const maxHeight = height * 1.5;
      const calculatedHeight = minHeight + (maxHeight - minHeight) * cameraElevation;
      const zoomedHeight = calculatedHeight * zoomLevel;
      
      const x = Math.sin(cameraAngle) * zoomedDistance;
      const z = Math.cos(cameraAngle) * zoomedDistance;
      
      cameraPosition.current.set(
        targetPosition.current.x + x,
        targetPosition.current.y + zoomedHeight,
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
