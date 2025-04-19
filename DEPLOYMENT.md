# Sumo Spheres Deployment Guide

This guide explains how to deploy the Sumo Spheres multiplayer game to production.

## Architecture Overview

Sumo Spheres consists of two main components:
1. **Frontend**: React application built with Vite
2. **Backend**: Socket.IO server for real-time multiplayer functionality

## Recommended Deployment: Vercel (Frontend) + Heroku (Backend)

This guide focuses on deploying the frontend to Vercel and the backend to Heroku, which provides a good balance of ease-of-use, performance, and reliability for real-time multiplayer games.

## Step 1: Prepare Your Project

Before deployment, ensure your project is properly configured:

- The frontend uses environment variables for the backend URL
- The backend has proper CORS configuration
- Both components are ready for production

## Step 2: Deploy the Backend to Heroku

### Prerequisites

- A Heroku account ([signup](https://signup.heroku.com/))
- Heroku CLI installed (`brew install heroku/brew/heroku` on macOS)
- Git repository initialized

### Deployment Steps

1. **Login to Heroku**
   ```
   heroku login
   ```

2. **Create a new Heroku app**
   ```
   heroku create sumo-spheres-server
   ```
   This will create a new app and add a Heroku remote to your git repository.

3. **Deploy the server directory to Heroku**

   If your server code is in a subdirectory (e.g., `/server`), you can deploy it using git subtree:
   ```
   git subtree push --prefix server heroku main
   ```

   Alternatively, if you want to deploy just the server directory:
   ```
   cd server
   git init
   git add .
   git commit -m "Initial server commit"
   heroku git:remote -a your-heroku-app-name
   git push heroku main
   ```

4. **Set environment variables on Heroku**
   ```
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL=https://sumo-spheres.vercel.app
   ```

5. **Verify your deployment**
   ```
   heroku open
   ```
   You should see "Sumo Spheres Server is running!" message.

   You can also check the logs:
   ```
   heroku logs --tail
   ```

## Step 3: Deploy the Frontend to Vercel

### Prerequisites

- A Vercel account (can sign up with GitHub)
- Your code pushed to a GitHub repository

### Deployment Steps

1. **Push your code to GitHub** (if you haven't already)
   ```
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New..." → "Project"
   - Select your repository

3. **Configure the deployment**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set environment variables**
   - Add `VITE_SOCKET_SERVER_URL` with the value of your Heroku app URL 
     (e.g., `https://sumo-spheres-server.herokuapp.com`)

5. **Deploy**
   - Click "Deploy" and wait for the build to complete

## Step 4: Test the Connection

1. Open your deployed Vercel frontend
2. Open the browser console to verify the Socket.IO connection
3. You should see: "Connecting to socket server: https://your-heroku-app.herokuapp.com"
4. If the connection is successful, you'll see: "Connected to server"
5. Test multiplayer functionality by opening the game in multiple browser tabs

## Troubleshooting Heroku Deployment

- **Socket.IO Connection Issues**: Ensure your Heroku app is on a paid plan or at least a Hobby plan, as the free tier has been discontinued
- **CORS Errors**: Double-check that the CLIENT_URL environment variable on Heroku matches your Vercel URL exactly
- **H10 Errors**: Check Heroku logs with `heroku logs --tail` to diagnose connection issues
- **Deployment Failures**: If git subtree push fails, try deploying directly from the server directory

## Important Notes for Heroku

1. Heroku's free tier has been discontinued, so you'll need at least a Hobby plan ($7/month)
2. Heroku dynos sleep after 30 minutes of inactivity on the Eco plan, which can cause disconnections
3. For production use, consider the Basic or Standard plans to ensure reliable connections

## Alternative Backend Deployment Options

### Option 1: Render

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

### Option 2: Railway

1. Create a new project on Railway
2. Connect to your GitHub repository
3. Configure as follows:
   - Root Directory: `server`
   - Start Command: `node index.js`
   - Environment Variables:
     - `PORT`: $PORT (Railway provides this)
     - `NODE_ENV`: production
     - `CLIENT_URL`: Your Vercel frontend URL

## Production Considerations

- **Scaling**: For a popular game, consider upgrading to Heroku's Standard-1X or Performance-M dynos
- **Security**: Add authentication for production use
- **Monitoring**: Set up logging and monitoring for both frontend and backend
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Backup Plan**: Have a backup deployment ready in case of service disruptions
