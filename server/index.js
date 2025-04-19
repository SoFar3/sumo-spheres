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

// Store active players and their data
const players = {};
const gameRooms = {};

// Create a default game room
gameRooms['default'] = {
  id: 'default',
  name: 'Main Arena',
  players: {},
  maxPlayers: 8
};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Handle player joining the game
  socket.on('join_game', ({ playerName, roomId = 'default' }) => {
    // Generate a unique player ID
    const playerId = uuidv4();
    
    // Set up player data
    const playerData = {
      id: playerId,
      socketId: socket.id,
      name: playerName || `Player_${playerId.substring(0, 5)}`,
      position: [
        (Math.random() * 4) - 2, // Random x position between -2 and 2
        1,                       // Start slightly above the arena
        (Math.random() * 4) - 2  // Random z position between -2 and 2
      ],
      color: getRandomColor(),
      score: 0,
      roomId
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
      roomId
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
      }
    }
    
    // Remove player from the players list
    delete players[socket.id];
    
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Helper function to generate a random color
function getRandomColor() {
  const colors = [
    '#FF5733', // Red-orange
    '#33FF57', // Green
    '#3357FF', // Blue
    '#F3FF33', // Yellow
    '#FF33F3', // Pink
    '#33FFF3', // Cyan
    '#FF8C33', // Orange
    '#8C33FF', // Purple
    '#FF3333', // Red
    '#33FF8C', // Mint
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Start the server
server.listen(PORT, () => {
  console.log(`Sumo Spheres server running on port ${PORT}`);
});
