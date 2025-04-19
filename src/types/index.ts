export interface PlayerProps {
  position: [number, number, number];
  color: string;
  isPlayer?: boolean;
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
