export enum PlatformType {
  STANDARD = 'STANDARD',
  CRACKED = 'CRACKED',
  SLIPPERY = 'SLIPPERY',
  NONE = 'NONE' // Water/Gap
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface PlatformData {
  id: string;
  x: number;
  z: number;
  type: PlatformType;
  active: boolean;
  steppedOn?: boolean;
}

export interface InputState {
  x: number; // -1 to 1
  z: number; // -1 to 1
}

export interface ScoreState {
  current: number;
  best: number;
}