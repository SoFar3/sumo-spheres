import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as socketService from '../services/socketService';
import { PlayerData } from '../types';

// Game states
export enum GameState {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  GAME_OVER = 'gameOver'
}

interface MultiplayerContextType {
  isConnected: boolean;
  isJoined: boolean;
  playerId: string | null;
  players: Record<string, PlayerData>;
  roomId: string | null;
  gameState: GameState;
  gameTimeRemaining: number;
  maxPlayers: number;
  joinGame: (playerName: string, roomId?: string) => void;
  updatePosition: (position: [number, number, number], rotation?: [number, number, number], velocity?: [number, number, number]) => void;
  sendPlayerAction: (action: string) => void;
  reportPlayerFell: () => void;
  reportKnockout: (targetId: string) => void;
  startGame: () => void;
  returnToLobby: () => void;
}

const defaultContext: MultiplayerContextType = {
  isConnected: false,
  isJoined: false,
  playerId: null,
  players: {},
  roomId: null,
  gameState: GameState.LOBBY,
  gameTimeRemaining: 0,
  maxPlayers: 8,
  joinGame: () => {},
  updatePosition: () => {},
  sendPlayerAction: () => {},
  reportPlayerFell: () => {},
  reportKnockout: () => {},
  startGame: () => {},
  returnToLobby: () => {},
};

const MultiplayerContext = createContext<MultiplayerContextType>(defaultContext);

export const useMultiplayer = () => useContext(MultiplayerContext);

interface MultiplayerProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ 
  children, 
  serverUrl = 'http://localhost:3001' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerData>>({});
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [gameTimeRemaining, setGameTimeRemaining] = useState(300); // 5 minutes in seconds
  const maxPlayers = 8;

  // Initialize socket connection
  useEffect(() => {
    socketService.initializeSocket(serverUrl);

    // Set up event listeners
    const connectUnsubscribe = socketService.onEvent('connect', () => {
      setIsConnected(true);
    });

    const disconnectUnsubscribe = socketService.onEvent('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
      setPlayerId(null);
      setPlayers({});
      setRoomId(null);
    });

    // Clean up on unmount
    return () => {
      connectUnsubscribe();
      disconnectUnsubscribe();
      socketService.disconnect();
    };
  }, [serverUrl]);

  // Set up game event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Handle game joined event
    const gameJoinedUnsubscribe = socketService.onEvent('game_joined', (data: any) => {
      setIsJoined(true);
      setPlayerId(data.playerId);
      setPlayers(data.players);
      setRoomId(data.roomId);
      setGameState(data.gameState || GameState.LOBBY);
      if (data.gameTimeRemaining) {
        setGameTimeRemaining(data.gameTimeRemaining);
      }
    });

    // Handle player joined event
    const playerJoinedUnsubscribe = socketService.onEvent('player_joined', (data: any) => {
      setPlayers(prev => ({
        ...prev,
        [data.player.id]: data.player
      }));
    });

    // Handle player left event
    const playerLeftUnsubscribe = socketService.onEvent('player_left', (data: any) => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[data.playerId];
        return newPlayers;
      });
    });

    // Handle player moved event
    const playerMovedUnsubscribe = socketService.onEvent('player_moved', (data: any) => {
      setPlayers(prev => {
        if (!prev[data.playerId]) return prev;
        
        return {
          ...prev,
          [data.playerId]: {
            ...prev[data.playerId],
            position: data.position,
            rotation: data.rotation,
            velocity: data.velocity
          }
        };
      });
    });

    // Handle score update event
    const scoreUpdateUnsubscribe = socketService.onEvent('score_update', (data: any) => {
      setPlayers(prev => {
        if (!prev[data.playerId]) return prev;
        
        return {
          ...prev,
          [data.playerId]: {
            ...prev[data.playerId],
            score: data.score
          }
        };
      });
    });
    
    // Handle game state update event
    const gameStateUpdateUnsubscribe = socketService.onEvent('game_state_update', (data: any) => {
      setGameState(data.gameState);
      if (data.gameTimeRemaining !== undefined) {
        setGameTimeRemaining(data.gameTimeRemaining);
      }
    });
    
    // Handle game timer update
    const gameTimerUpdateUnsubscribe = socketService.onEvent('game_timer_update', (data: any) => {
      setGameTimeRemaining(data.timeRemaining);
    });
    
    // Handle game over event
    const gameOverUnsubscribe = socketService.onEvent('game_over', (data: any) => {
      setGameState(GameState.GAME_OVER);
      // Update final scores
      if (data.finalScores) {
        setPlayers(prev => {
          const newPlayers = { ...prev };
          Object.keys(data.finalScores).forEach(playerId => {
            if (newPlayers[playerId]) {
              newPlayers[playerId] = {
                ...newPlayers[playerId],
                score: data.finalScores[playerId]
              };
            }
          });
          return newPlayers;
        });
      }
    });

    // Clean up event listeners
    return () => {
      gameJoinedUnsubscribe();
      playerJoinedUnsubscribe();
      playerLeftUnsubscribe();
      playerMovedUnsubscribe();
      scoreUpdateUnsubscribe();
      gameStateUpdateUnsubscribe();
      gameTimerUpdateUnsubscribe();
      gameOverUnsubscribe();
    };
  }, [isConnected]);

  // Wrapper functions for socket service
  const joinGame = (playerName: string, roomIdParam: string = 'default') => {
    socketService.joinGame(playerName, roomIdParam);
  };

  const updatePosition = (
    position: [number, number, number], 
    rotation?: [number, number, number], 
    velocity?: [number, number, number]
  ) => {
    socketService.updatePosition(position, rotation, velocity);
  };

  const sendPlayerAction = (action: string) => {
    socketService.sendPlayerAction(action);
  };

  const reportPlayerFell = () => {
    socketService.reportPlayerFell();
  };

  const reportKnockout = (targetId: string) => {
    socketService.reportKnockout(targetId);
  };
  
  const startGame = () => {
    socketService.startGame();
  };
  
  const returnToLobby = () => {
    socketService.returnToLobby();
  };

  const value = {
    isConnected,
    isJoined,
    playerId,
    players,
    roomId,
    gameState,
    gameTimeRemaining,
    maxPlayers,
    joinGame,
    updatePosition,
    sendPlayerAction,
    reportPlayerFell,
    reportKnockout,
    startGame,
    returnToLobby
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};
