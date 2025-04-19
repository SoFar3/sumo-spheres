# Sumo Spheres Deployment Guide

This guide explains how to deploy the Sumo Spheres multiplayer game to production.

## Architecture Overview

Sumo Spheres consists of two main components:
1. **Frontend**: React application built with Vite
2. **Backend**: Socket.IO server for real-time multiplayer functionality

## Deployment Options

### Frontend Deployment (Vercel)

The React frontend can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure the following settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Environment Variables: Set `VITE_SOCKET_SERVER_URL` to your backend URL

### Backend Deployment Options

Since Socket.IO requires persistent connections, we recommend deploying the backend to a platform that supports long-lived connections:

#### Option 1: Render

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Configure as follows:
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - Environment Variables:
     - `PORT`: 10000 (Render default)
     - `NODE_ENV`: production
     - `CLIENT_URL`: Your Vercel frontend URL

#### Option 2: Railway

1. Create a new project on Railway
2. Connect to your GitHub repository
3. Configure as follows:
   - Root Directory: `server`
   - Start Command: `node index.js`
   - Environment Variables:
     - `PORT`: $PORT (Railway provides this)
     - `NODE_ENV`: production
     - `CLIENT_URL`: Your Vercel frontend URL

#### Option 3: DigitalOcean App Platform

1. Create a new App on DigitalOcean App Platform
2. Connect to your GitHub repository
3. Configure as follows:
   - Type: Web Service
   - Source Directory: `server`
   - Build Command: `npm install`
   - Run Command: `node index.js`
   - Environment Variables:
     - `PORT`: $PORT (DigitalOcean provides this)
     - `NODE_ENV`: production
     - `CLIENT_URL`: Your Vercel frontend URL

## Connecting Frontend to Backend

After deploying both components:

1. Get your backend URL (e.g., `https://sumo-spheres-server.onrender.com`)
2. Go to your Vercel project settings
3. Add an environment variable:
   - Name: `VITE_SOCKET_SERVER_URL`
   - Value: Your backend URL
4. Redeploy the frontend to apply the environment variable

## Testing the Deployment

1. Open your deployed frontend URL
2. Open the browser console to verify the Socket.IO connection
3. You should see: "Connecting to socket server: https://your-backend-url.com"
4. If the connection is successful, you'll see: "Connected to server"
5. Test the multiplayer functionality by opening the game in multiple browser tabs

## Troubleshooting

- **CORS Issues**: Ensure the `CLIENT_URL` environment variable on your backend is set correctly
- **Connection Errors**: Check if your backend is running and accessible
- **Socket.IO Version Mismatch**: Ensure client and server use compatible Socket.IO versions

## Production Considerations

- Add proper error handling and logging
- Implement authentication for production use
- Consider scaling solutions for handling many concurrent players
- Monitor server performance and implement rate limiting if needed
