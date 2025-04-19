# Sumo Spheres

A fun, competitive 3D browser game where players control balls trying to knock each other off a floating arena using physics.

## Features

- 3D physics-based gameplay with realistic collisions
- Control your ball with WASD keys
- Jump with the Space bar
- Rotate the camera with Q and E keys
- Multiplayer support using Socket.IO
- Beautiful 3D graphics with react-three-fiber

## Technologies Used

- TypeScript - for clean, type-safe code
- React - for UI components
- react-three-fiber - for 3D rendering in React
- @react-three/cannon - for physics simulation
- Socket.IO - for real-time multiplayer functionality

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd sumo-spheres
   ```

2. Install dependencies for both client and server
   ```
   npm install
   cd server
   npm install
   cd ..
   ```

### Running the Game

#### Development Mode (Client and Server)

Run both the client and server concurrently:
```
npm run start
```

This will start:
- The client on http://localhost:5173
- The server on http://localhost:3001

#### Client Only

If you want to run just the client (single-player mode):
```
npm run dev
```

#### Server Only

If you want to run just the server:
```
npm run server
```

## How to Play

1. Open the game in your browser
2. Enter your name and a room ID (or use the default room)
3. Use WASD to move your ball
4. Press Space to jump
5. Use Q and E to rotate the camera
6. Try to knock other players off the arena!

## Deployment

The client can be built for production using:
```
npm run build
```

This will create a `dist` folder with optimized files ready for deployment.

The server can be deployed to any Node.js hosting service.
