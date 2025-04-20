import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Get port from environment variable or use default
const PORT = process.env.PORT || 3001;

// Get allowed origins from environment or use default in development
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? CLIENT_URL : '*',
    methods: ["GET", "POST"]
  }
});

// Add a simple health check endpoint
app.get('/', (req, res) => {
  res.send('Sumo Spheres Server is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Game states
const GameState = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver'
};

// Store active players and their data
const players = {};
const gameRooms = {};
const gameTimers = {};

// Create a default game room
gameRooms['default'] = {
  id: 'default',
  name: 'Main Arena',
  players: {},
  maxPlayers: 8,
  gameState: GameState.LOBBY,
  gameTimeRemaining: 60, // 1 minute
};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Handle player joining the game
  socket.on('join_game', ({ playerName, roomId = 'default' }) => {
    // Generate a unique player ID
    const playerId = uuidv4();
    
    // Platform positions for 4 quadrants (matches the arena component)
    const platformSize = 5;
    const gapSize = 1.5;
    const platformPositions = [
      // Top-left
      [
        -(platformSize/2) - (gapSize/2),
        1,  // Height above platform
        -(platformSize/2) - (gapSize/2)
      ],
      // Top-right
      [
        (platformSize/2) + (gapSize/2),
        1,
        -(platformSize/2) - (gapSize/2)
      ],
      // Bottom-left
      [
        -(platformSize/2) - (gapSize/2),
        1,
        (platformSize/2) + (gapSize/2)
      ],
      // Bottom-right
      [
        (platformSize/2) + (gapSize/2),
        1,
        (platformSize/2) + (gapSize/2)
      ]
    ];
    
    // Get room player count to determine spawn position
    const playerCount = Object.keys(gameRooms[roomId]?.players || {}).length;
    const platformIndex = playerCount % 4; // Cycle through platforms
    
    // Add small random offset within platform for variation
    const randomOffset = 1.5;
    const posX = platformPositions[platformIndex][0] + (Math.random() * randomOffset - randomOffset/2);
    const posZ = platformPositions[platformIndex][2] + (Math.random() * randomOffset - randomOffset/2);
    
    // Set up player data
    const playerData = {
      id: playerId,
      socketId: socket.id,
      name: playerName || `Player_${playerId.substring(0, 5)}`,
      position: [posX, platformPositions[platformIndex][1], posZ],
      color: getRandomColor(),
      score: 0,
      roomId,
      platformIndex // Track which platform they spawned on
    };
    
    // Add player to the room
    if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
        id: roomId,
        name: `Room ${roomId}`,
        players: {},
        maxPlayers: 8
      };
    }
    
    // Check if room is full
    const roomPlayerCount = Object.keys(gameRooms[roomId].players).length;
    if (roomPlayerCount >= gameRooms[roomId].maxPlayers) {
      socket.emit('join_error', { message: 'Room is full' });
      return;
    }
    
    // Add player to the room
    gameRooms[roomId].players[playerId] = playerData;
    players[socket.id] = playerData;
    
    // Join the socket room
    socket.join(roomId);
    
    // Send the player their ID and initial game state
    socket.emit('game_joined', {
      playerId,
      players: gameRooms[roomId].players,
      roomId,
      gameState: gameRooms[roomId].gameState,
      gameTimeRemaining: gameRooms[roomId].gameTimeRemaining
    });
    
    // Notify other players in the room
    socket.to(roomId).emit('player_joined', {
      player: playerData
    });
    
    console.log(`Player ${playerData.name} joined room ${roomId}`);
  });
  
  // Handle player position updates
  socket.on('update_position', (data) => {
    if (!players[socket.id]) return;
    
    const { position, rotation, velocity } = data;
    const playerId = players[socket.id].id;
    const roomId = players[socket.id].roomId;
    
    // Update player position
    if (gameRooms[roomId] && gameRooms[roomId].players[playerId]) {
      gameRooms[roomId].players[playerId].position = position;
      gameRooms[roomId].players[playerId].rotation = rotation;
      gameRooms[roomId].players[playerId].velocity = velocity;
      
      // Broadcast position update to other players in the room
      socket.to(roomId).emit('player_moved', {
        playerId,
        position,
        rotation,
        velocity
      });
    }
  });
  
  // Handle player actions (jump, etc.)
  socket.on('player_action', (data) => {
    if (!players[socket.id]) return;
    
    const { action } = data;
    const playerId = players[socket.id].id;
    const roomId = players[socket.id].roomId;
    
    // Broadcast action to other players in the room
    socket.to(roomId).emit('player_action', {
      playerId,
      action
    });
  });
  
  // Handle player falling off the arena
  socket.on('player_fell', () => {
    if (!players[socket.id]) return;
    
    const playerId = players[socket.id].id;
    const roomId = players[socket.id].roomId;
    
    // Only count scores during active gameplay
    if (gameRooms[roomId]?.gameState !== GameState.PLAYING) return;
    
    // Update player score
    if (gameRooms[roomId] && gameRooms[roomId].players[playerId]) {
      gameRooms[roomId].players[playerId].score -= 1;
      
      // Broadcast score update to all players in the room
      io.to(roomId).emit('score_update', {
        playerId,
        score: gameRooms[roomId].players[playerId].score
      });
    }
  });
  
  // Handle player knocking another player off
  socket.on('player_knockout', ({ targetId }) => {
    if (!players[socket.id]) return;
    
    const playerId = players[socket.id].id;
    const roomId = players[socket.id].roomId;
    
    // Only count scores during active gameplay
    if (gameRooms[roomId]?.gameState !== GameState.PLAYING) return;
    
    // Update player scores
    if (gameRooms[roomId] && 
        gameRooms[roomId].players[playerId] && 
        gameRooms[roomId].players[targetId]) {
      
      // Increase score for the knocker
      gameRooms[roomId].players[playerId].score += 1;
      
      // Broadcast score update to all players in the room
      io.to(roomId).emit('score_update', {
        playerId,
        score: gameRooms[roomId].players[playerId].score
      });
    }
  });
  
  // Handle starting the game
  socket.on('start_game', () => {
    if (!players[socket.id]) return;
    
    const roomId = players[socket.id].roomId;
    if (!gameRooms[roomId]) return;
    
    // Only start the game if it's in lobby state
    if (gameRooms[roomId].gameState !== GameState.LOBBY) return;
    
    // Set game state to playing
    gameRooms[roomId].gameState = GameState.PLAYING;
    gameRooms[roomId].gameTimeRemaining = 60; // 1 minute
    
    // Notify all players in the room that the game has started
    io.to(roomId).emit('game_state_update', {
      gameState: GameState.PLAYING,
      gameTimeRemaining: gameRooms[roomId].gameTimeRemaining
    });
    
    // Start the game timer
    startGameTimer(roomId);
    
    console.log(`Game started in room ${roomId}`);
  });
  
  // Handle returning to lobby
  socket.on('return_to_lobby', () => {
    if (!players[socket.id]) return;
    
    const roomId = players[socket.id].roomId;
    if (!gameRooms[roomId]) return;
    
    // Only return to lobby if the game is over
    if (gameRooms[roomId].gameState !== GameState.GAME_OVER) return;
    
    // Reset game state
    gameRooms[roomId].gameState = GameState.LOBBY;
    
    // Reset all player scores
    Object.keys(gameRooms[roomId].players).forEach(playerId => {
      gameRooms[roomId].players[playerId].score = 0;
    });
    
    // Notify all players in the room that we're back in the lobby
    io.to(roomId).emit('game_state_update', {
      gameState: GameState.LOBBY
    });
    
    console.log(`Returned to lobby in room ${roomId}`);
  });
  
  // Handle player disconnection
  socket.on('disconnect', () => {
    if (!players[socket.id]) return;
    
    const playerId = players[socket.id].id;
    const roomId = players[socket.id].roomId;
    
    // Remove player from the room
    if (gameRooms[roomId] && gameRooms[roomId].players[playerId]) {
      delete gameRooms[roomId].players[playerId];
      
      // Notify other players in the room
      socket.to(roomId).emit('player_left', {
        playerId
      });
      
      // If room is empty and not the default room, remove it
      if (roomId !== 'default' && Object.keys(gameRooms[roomId].players).length === 0) {
        delete gameRooms[roomId];
        
        // Clear any active game timer for this room
        if (gameTimers[roomId]) {
          clearInterval(gameTimers[roomId]);
          delete gameTimers[roomId];
        }
      }
    }
    
    // Remove player from players list
    delete players[socket.id];
    
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Start the game timer for a room
function startGameTimer(roomId) {
  // Clear any existing timer
  if (gameTimers[roomId]) {
    clearInterval(gameTimers[roomId]);
  }
  
  // Create a new timer that ticks every second
  gameTimers[roomId] = setInterval(() => {
    // Ensure the room still exists
    if (!gameRooms[roomId]) {
      clearInterval(gameTimers[roomId]);
      delete gameTimers[roomId];
      return;
    }
    
    // Decrement the time remaining
    gameRooms[roomId].gameTimeRemaining -= 1;
    
    // Send timer update to all players in the room every second
    io.to(roomId).emit('game_timer_update', {
      timeRemaining: gameRooms[roomId].gameTimeRemaining
    });
    
    // Check if the game is over
    if (gameRooms[roomId].gameTimeRemaining <= 0) {
      // Stop the timer
      clearInterval(gameTimers[roomId]);
      delete gameTimers[roomId];
      
      // Set game state to game over
      gameRooms[roomId].gameState = GameState.GAME_OVER;
      
      // Get final scores
      const finalScores = {};
      Object.keys(gameRooms[roomId].players).forEach(playerId => {
        finalScores[playerId] = gameRooms[roomId].players[playerId].score;
      });
      
      // Find the winner (player with highest score)
      let winnerPlayerId = null;
      let highestScore = -Infinity;
      
      Object.keys(gameRooms[roomId].players).forEach(playerId => {
        const score = gameRooms[roomId].players[playerId].score;
        if (score > highestScore) {
          highestScore = score;
          winnerPlayerId = playerId;
        }
      });
      
      // Notify all players in the room that the game is over
      io.to(roomId).emit('game_over', {
        gameState: GameState.GAME_OVER,
        finalScores,
        winnerPlayerId,
        winnerName: winnerPlayerId ? gameRooms[roomId].players[winnerPlayerId].name : null
      });
      
      console.log(`Game over in room ${roomId}. Winner: ${winnerPlayerId ? gameRooms[roomId].players[winnerPlayerId].name : 'None'}`);
    }
  }, 1000); // Update every second
}

// Helper function to generate a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  
  // Generate a random hex color
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  
  // Ensure the color is not too dark or too light
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  
  // If the color is too dark or too light, generate a new one
  if ((r + g + b) < 200 || (r + g + b) > 600) {
    return getRandomColor();
  }
  
  return color;
}

// Start the server
server.listen(PORT, () => {
  console.log(`Sumo Spheres server running on port ${PORT}`);
});
