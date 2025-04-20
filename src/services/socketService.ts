import { io, Socket } from 'socket.io-client';

// Socket.io client instance
let socket: Socket | null = null;

// Event callbacks
const callbacks: { [key: string]: Function[] } = {};

// Initialize the socket connection
export const initializeSocket = (serverUrl?: string): Socket => {
  if (socket) return socket;
  
  // Use environment variable, fallback to provided URL or default
  const socketUrl = import.meta.env.VITE_SOCKET_SERVER_URL || serverUrl || 'http://localhost:3001';
  console.log('Connecting to socket server:', socketUrl);
  
  // Create new socket connection
  socket = io(socketUrl);
  
  // Set up default event listeners
  socket.on('connect', () => {
    console.log('Connected to server');
    triggerCallbacks('connect');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    triggerCallbacks('disconnect');
  });
  
  socket.on('game_joined', (data) => {
    console.log('Joined game:', data);
    triggerCallbacks('game_joined', data);
  });
  
  socket.on('join_error', (data) => {
    console.error('Error joining game:', data.message);
    triggerCallbacks('join_error', data);
  });
  
  socket.on('player_joined', (data) => {
    console.log('Player joined:', data.player);
    triggerCallbacks('player_joined', data);
  });
  
  socket.on('player_left', (data) => {
    console.log('Player left:', data.playerId);
    triggerCallbacks('player_left', data);
  });
  
  socket.on('player_moved', (data) => {
    triggerCallbacks('player_moved', data);
  });
  
  socket.on('player_action', (data) => {
    triggerCallbacks('player_action', data);
  });
  
  socket.on('player_fell', (data) => {
    console.log('Player fell:', data.playerId);
    triggerCallbacks('player_fell', data);
  });
  
  socket.on('player_respawn', (data) => {
    console.log('Player respawning:', data.playerId, 'at position:', data.position);
    triggerCallbacks('player_respawn', data);
  });
  
  socket.on('score_update', (data) => {
    console.log('Score update:', data);
    triggerCallbacks('score_update', data);
  });
  
  socket.on('game_state_update', (data) => {
    console.log('Game state update:', data);
    triggerCallbacks('game_state_update', data);
  });
  
  socket.on('game_timer_update', (data) => {
    triggerCallbacks('game_timer_update', data);
  });
  
  socket.on('game_over', (data) => {
    console.log('Game over:', data);
    triggerCallbacks('game_over', data);
  });
  
  return socket;
};

// Join a game room
export const joinGame = (playerName: string, roomId: string = 'default') => {
  if (!socket) return;
  
  socket.emit('join_game', { playerName, roomId });
};

// Update player position
export const updatePosition = (position: [number, number, number], rotation?: [number, number, number], velocity?: [number, number, number]) => {
  if (!socket) return;
  
  socket.emit('update_position', { position, rotation, velocity });
};

// Send player action (jump, etc.)
export const sendPlayerAction = (action: string) => {
  if (!socket) return;
  
  socket.emit('player_action', { action });
};

// Report player fell off the arena
export const reportPlayerFell = () => {
  if (!socket) return;
  
  socket.emit('player_fell');
};

// Report player knocked another player off
export const reportKnockout = (targetId: string) => {
  if (!socket) return;
  
  socket.emit('player_knockout', { targetId });
};

// Start the game
export const startGame = () => {
  if (!socket) {
    console.error('Cannot start game: Socket not connected');
    return;
  }
  
  console.log('Emitting start_game event');
  socket.emit('start_game');
  
  // Add verification that the event was sent
  setTimeout(() => {
    console.log('Socket connected status:', socket?.connected);
  }, 100);
};

// Return to lobby after game ends
export const returnToLobby = () => {
  if (!socket) return;
  
  socket.emit('return_to_lobby');
};

// Register event callback
export const onEvent = (event: string, callback: Function) => {
  if (!callbacks[event]) {
    callbacks[event] = [];
  }
  
  callbacks[event].push(callback);
  
  return () => {
    callbacks[event] = callbacks[event].filter(cb => cb !== callback);
  };
};

// Trigger all callbacks for an event
const triggerCallbacks = (event: string, data?: any) => {
  if (!callbacks[event]) return;
  
  callbacks[event].forEach(callback => {
    callback(data);
  });
};

// Disconnect from the server
export const disconnect = () => {
  if (!socket) return;
  
  socket.disconnect();
  socket = null;
};
