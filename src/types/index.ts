export interface PlayerProps {
  position: [number, number, number];
  color: string;
  isPlayer?: boolean;
  playerId?: string;
  playerName?: string;
  controlsEnabled?: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  score: number;
  roomId: string;
  socketId?: string;
  rotation?: [number, number, number];
  velocity?: [number, number, number];
}

export interface ArenaProps {
  radius: number;
  position: [number, number, number];
}

export type InputKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  jump: boolean;
};
