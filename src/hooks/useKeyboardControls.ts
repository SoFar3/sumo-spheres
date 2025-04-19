import { useEffect, useState } from 'react';
import { InputKeys } from '../types';

export const useKeyboardControls = () => {
  const [keys, setKeys] = useState<InputKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for WASD keys to avoid scrolling
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key.toLowerCase() === 'w') setKeys((keys) => ({ ...keys, forward: true }));
      if (e.key.toLowerCase() === 's') setKeys((keys) => ({ ...keys, backward: true }));
      if (e.key.toLowerCase() === 'a') setKeys((keys) => ({ ...keys, left: true }));
      if (e.key.toLowerCase() === 'd') setKeys((keys) => ({ ...keys, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') setKeys((keys) => ({ ...keys, forward: false }));
      if (e.key.toLowerCase() === 's') setKeys((keys) => ({ ...keys, backward: false }));
      if (e.key.toLowerCase() === 'a') setKeys((keys) => ({ ...keys, left: false }));
      if (e.key.toLowerCase() === 'd') setKeys((keys) => ({ ...keys, right: false }));
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
