export type SceneType = 'WINTER' | 'RAIN' | 'FISH' | 'SAKURA' | 'CAROUSEL' | 'SHANGHAI' | 'CAT_MOUSE' | 'BIRTHDAY';

export interface Vector2 {
  x: number;
  y: number;
}

// --- WINTER TYPES ---
export enum PersonState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  BUILDING = 'BUILDING',
  FIGHTING = 'FIGHTING',
}

export interface Person {
  id: number;
  pos: Vector2;
  velocity: Vector2;
  state: PersonState;
  target: Vector2 | null;
  targetEntityId: number | null;
  color: string;
  size: number;
  stateTimer: number;
}

export interface Snowman {
  id: number;
  pos: Vector2;
  progress: number;
  health: number;
  isComplete: boolean;
}

export interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
}

// --- RAIN TYPES ---
export interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface Plant {
  x: number;
  y: number;
  type: 'TREE' | 'FLOWER';
  color: string;
  height: number; // For collision
  width: number;  // For collision
}

// --- FISH TYPES ---
export interface FishEntity {
  id: number;
  pos: Vector2;
  velocity: Vector2;
  color: string;
  size: number;
  tailPhase: number;
  type: 'FAT' | 'LONG' | 'TINY';
}

export interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
}

// --- SAKURA TYPES ---
export interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  spinSpeed: number;
}

// --- CAROUSEL TYPES ---
export interface CarouselHorse {
  angle: number; // 0 to 2PI position on circle
  yOffset: number; // vertical bobbing
  color: string;
}
export interface CarouselLight {
  angle: number;
  isOn: boolean;
}

// --- SHANGHAI TYPES ---
export interface Boat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  type: 'CRUISE' | 'CARGO';
}
export interface Star {
  x: number;
  y: number;
  opacity: number;
}

// --- CAT MOUSE TYPES ---
export interface CatEntity {
  pos: Vector2;
  state: 'HUNTING' | 'EATING' | 'IDLE';
  timer: number;
  targetMouseId: number | null;
  angle: number; // For facing direction
}
export interface MouseEntity {
  id: number;
  pos: Vector2;
  velocity: Vector2;
  color: string;
  panic: boolean;
}

// --- BIRTHDAY TYPES ---
export interface Candle {
  x: number;
  y: number;
  flicker: number;
  color: string;
}
export interface WishParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
