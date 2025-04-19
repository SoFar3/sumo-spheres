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
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if controls are disabled or if user is typing in an input field
      if (!controlsEnabled || isInputElement(e.target)) {
        return;
      }
      
      // Prevent default behavior for game control keys to avoid scrolling
      if (['w', 'a', 's', 'd', 'q', 'e', ' ', 'W', 'A', 'S', 'D', 'Q', 'E'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key.toLowerCase() === 'w') setKeys((keys) => ({ ...keys, forward: true }));
      if (e.key.toLowerCase() === 's') setKeys((keys) => ({ ...keys, backward: true }));
      if (e.key.toLowerCase() === 'a') setKeys((keys) => ({ ...keys, left: true }));
      if (e.key.toLowerCase() === 'd') setKeys((keys) => ({ ...keys, right: true }));
      if (e.key.toLowerCase() === 'q') setKeys((keys) => ({ ...keys, rotateLeft: true }));
      if (e.key.toLowerCase() === 'e') setKeys((keys) => ({ ...keys, rotateRight: true }));
      if (e.key === ' ') setKeys((keys) => ({ ...keys, jump: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Skip if controls are disabled or if user is typing in an input field
      if (!controlsEnabled || isInputElement(e.target)) {
        return;
      }
      
      if (e.key.toLowerCase() === 'w') setKeys((keys) => ({ ...keys, forward: false }));
      if (e.key.toLowerCase() === 's') setKeys((keys) => ({ ...keys, backward: false }));
      if (e.key.toLowerCase() === 'a') setKeys((keys) => ({ ...keys, left: false }));
      if (e.key.toLowerCase() === 'd') setKeys((keys) => ({ ...keys, right: false }));
      if (e.key.toLowerCase() === 'q') setKeys((keys) => ({ ...keys, rotateLeft: false }));
      if (e.key.toLowerCase() === 'e') setKeys((keys) => ({ ...keys, rotateRight: false }));
      if (e.key === ' ') setKeys((keys) => ({ ...keys, jump: false }));
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
