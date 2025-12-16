export type SceneType = 'WINTER' | 'RAIN' | 'FISH' | 'SAKURA' | 'CAROUSEL' | 'SHANGHAI' | 'CAT_MOUSE' | 'BIRTHDAY' | 'CHRISTMAS' | 'WEDDING' | 'EGYPT' | 'CITY_NIGHT' | 'FISHERMAN' | 'BAMBOO' | 'JELLYFISH' | 'CUSTOM';

export interface CustomSceneConfig {
  // Atmosphere
  snow: boolean;
  rain: boolean;
  sakura: boolean;
  // Objects
  people: boolean;
  forest: boolean; // Trees from Rain scene
  christmasTree: boolean; // The big tree
  cat: boolean;
  // Colors
  backgroundColor: string;
  baseColor: string;
  textColor: string;
}

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
  riderColor?: string; // Color of the person riding
}
export interface CarouselLight {
  angle: number;
  isOn: boolean;
  color: string;
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

// --- CHRISTMAS TYPES ---
export interface ChristmasLight {
  x: number;
  y: number;
  color: string;
  phase: number;
  speed: number;
}
export interface Gift {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  ribbonColor: string;
}

// --- WEDDING TYPES ---
export interface Confetti {
  x: number;
  y: number;
  color: string;
  speedY: number;
  sway: number;
  swayOffset: number;
}

// --- EGYPT TYPES ---
export interface Camel {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

// --- CITY NIGHT TYPES ---
export interface CityCar {
  x: number;
  y: number;
  lane: number; // 0, 1, 2 etc.
  speed: number;
  color: string;
  type: 'HEADLIGHT' | 'TAILLIGHT';
}
export interface Skyscraper {
  x: number;
  width: number;
  height: number;
  windows: boolean[]; // Array representing on/off state of windows
}

// --- FISHERMAN TYPES ---
export interface InkParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
}
export interface InkMountain {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // Grey shade
}

// --- BAMBOO TYPES ---
export interface BambooStalk {
  x: number;
  width: number;
  color: string;
  segments: number;
  sway: number;
  swayOffset: number;
}
export interface BambooLeaf {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  opacity: number;
}

// --- JELLYFISH TYPES ---
export interface JellyfishEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string; // Base color
  tentaclePhase: number;
  isGlowing: boolean;
  glowTimer: number;
}
