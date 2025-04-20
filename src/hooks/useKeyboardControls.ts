import { useEffect, useState } from 'react';
import { InputKeys } from '../types';

// Global state to enable/disable controls
let controlsEnabled = false;

// Function to enable/disable controls globally
export const setControlsEnabled = (enabled: boolean) => {
  controlsEnabled = enabled;
};

export const useKeyboardControls = () => {
  const [keys, setKeys] = useState<InputKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    rotateLeft: false,
    rotateRight: false,
    jump: false,
    zoomIn: false,
    zoomOut: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if controls are disabled or if user is typing in an input field
      if (!controlsEnabled || isInputElement(e.target)) {
        return;
      }
      
      // Prevent default behavior for game control keys to avoid scrolling
      if (['w', 'a', 's', 'd', 'q', 'e', ' ', 'W', 'A', 'S', 'D', 'Q', 'E', 'z', 'x', 'Z', 'X'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((keys) => ({ ...keys, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((keys) => ({ ...keys, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((keys) => ({ ...keys, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((keys) => ({ ...keys, right: true }));
          break;
        case 'KeyQ':
          setKeys((keys) => ({ ...keys, rotateLeft: true }));
          break;
        case 'KeyE':
          setKeys((keys) => ({ ...keys, rotateRight: true }));
          break;
        case 'Space':
          setKeys((keys) => ({ ...keys, jump: true }));
          break;
        case 'KeyZ':
        case 'z':
          setKeys((keys) => ({ ...keys, zoomIn: true }));
          break;
        case 'KeyX':
        case 'x':
          setKeys((keys) => ({ ...keys, zoomOut: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Skip if controls are disabled or if user is typing in an input field
      if (!controlsEnabled || isInputElement(e.target)) {
        return;
      }
      
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((keys) => ({ ...keys, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((keys) => ({ ...keys, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((keys) => ({ ...keys, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((keys) => ({ ...keys, right: false }));
          break;
        case 'KeyQ':
          setKeys((keys) => ({ ...keys, rotateLeft: false }));
          break;
        case 'KeyE':
          setKeys((keys) => ({ ...keys, rotateRight: false }));
          break;
        case 'Space':
          setKeys((keys) => ({ ...keys, jump: false }));
          break;
        case 'KeyZ':
        case 'z':
          setKeys((keys) => ({ ...keys, zoomIn: false }));
          break;
        case 'KeyX':
        case 'x':
          setKeys((keys) => ({ ...keys, zoomOut: false }));
          break;
      }
    };
    
    // Helper function to check if the event target is an input element
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target) return false;
      const element = target as HTMLElement;
      return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.isContentEditable
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};
