import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { 
  SceneType, Vector2, CustomSceneConfig,
  Person, PersonState, Snowman, Snowflake, // Winter
  RainDrop, Ripple, Plant, // Rain
  FishEntity, Bubble, // Fish
  Petal, // Sakura
  CarouselHorse, CarouselLight, // Carousel
  Boat, Star, // Shanghai
  CatEntity, MouseEntity, // Cat Mouse
  Candle, WishParticle, // Birthday
  ChristmasLight, Gift, // Christmas
  Confetti, // Wedding
  Camel, // Egypt
  CityCar, Skyscraper, // City Night
  InkParticle, InkMountain, // Fisherman
  BambooStalk, BambooLeaf, // Bamboo
  JellyfishEntity // Jellyfish
} from '../types';

// --- CONSTANTS ---
const GLOBE_RADIUS = 300;
const GROUND_Y_OFFSET = 100; 

// Winter Constants
const PERSON_COUNT = 12;
const SNOW_COUNT = 300;
const MAX_SNOWMEN = 5;
const WINTER_PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Rain Constants
const RAIN_COUNT = 400;

// Fish Constants
const FISH_COUNT = 15;
const BUBBLE_COUNT = 50;

// Sakura Constants
const PETAL_COUNT = 150;

// Carousel Constants
const HORSE_COUNT = 8;

export interface SnowGlobeHandle {
  captureVideo: () => Promise<void>;
}

interface SnowGlobeProps {
  currentScene: SceneType;
  message: string;
  customConfig?: CustomSceneConfig;
}

const SnowGlobe = forwardRef<SnowGlobeHandle, SnowGlobeProps>(({ currentScene, message, customConfig }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number>(0);

  // --- STATE REFS ---
  
  // Winter
  const peopleRef = useRef<Person[]>([]);
  const snowmenRef = useRef<Snowman[]>([]);
  const snowRef = useRef<Snowflake[]>([]);

  // Rain
  const rainRef = useRef<RainDrop[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const plantsRef = useRef<Plant[]>([]);

  // Fish
  const fishRef = useRef<FishEntity[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);

  // Sakura
  const petalsRef = useRef<Petal[]>([]);
  const swingAngleRef = useRef<number>(0);

  // Carousel
  const horsesRef = useRef<CarouselHorse[]>([]);
  const carouselLightsRef = useRef<CarouselLight[]>([]);
  const carouselRotationRef = useRef<number>(0);

  // Shanghai
  const boatsRef = useRef<Boat[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // Cat & Mouse
  const catRef = useRef<CatEntity>({ pos: {x:0, y:0}, state: 'IDLE', timer: 0, targetMouseId: null, angle: 0 });
  const miceRef = useRef<MouseEntity[]>([]);
  const nextMouseIdRef = useRef<number>(0);

  // Birthday
  const candlesRef = useRef<Candle[]>([]);
  const particlesRef = useRef<WishParticle[]>([]);

  // Christmas
  const christmasLightsRef = useRef<ChristmasLight[]>([]);
  const giftsRef = useRef<Gift[]>([]);

  // Wedding
  const confettiRef = useRef<Confetti[]>([]);

  // Egypt
  const camelsRef = useRef<Camel[]>([]);

  // City Night
  const cityCarsRef = useRef<CityCar[]>([]);
  const skyscrapersRef = useRef<Skyscraper[]>([]);

  // Fisherman
  const inkParticlesRef = useRef<InkParticle[]>([]);
  const inkMountainsRef = useRef<InkMountain[]>([]);

  // Bamboo
  const bambooStalksRef = useRef<BambooStalk[]>([]);
  const bambooLeavesRef = useRef<BambooLeaf[]>([]);

  // Jellyfish
  const jellyfishRef = useRef<JellyfishEntity[]>([]);


  // --- EXPOSE CAPTURE METHOD (GIF) ---
  useImperativeHandle(ref, () => ({
    captureVideo: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 1. Prepare for GIF Encoding
      const width = canvas.width;
      const height = canvas.height;
      const gifWidth = Math.floor(width / 2);
      const gifHeight = Math.floor(height / 2);
      
      const offCanvas = document.createElement('canvas');
      offCanvas.width = gifWidth;
      offCanvas.height = gifHeight;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      const encoder = new GIFEncoder();
      
      const fps = 15;
      const duration = 3000; // 3 seconds
      const totalFrames = (duration / 1000) * fps;
      const frameDelay = 1000 / fps; // Delay in ms

      for (let i = 0; i < totalFrames; i++) {
        offCtx.drawImage(canvas, 0, 0, gifWidth, gifHeight);
        const { data } = offCtx.getImageData(0, 0, gifWidth, gifHeight);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        encoder.writeFrame(index, gifWidth, gifHeight, { palette, delay: frameDelay });
        await new Promise(resolve => setTimeout(resolve, frameDelay));
      }
      
      encoder.finish();
      const buffer = encoder.bytes();
      
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magic-globe-${currentScene.toLowerCase()}.gif`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }));

  // --- HELPER FUNCTIONS ---

  const getRandomPosInGlobe = (groundOffset = GROUND_Y_OFFSET, rModifier = 0): Vector2 => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (GLOBE_RADIUS - 40 - rModifier); 
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r * 0.35 + groundOffset; 
    return { x, y };
  };

  const getFishRandomPos = (): Vector2 => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (GLOBE_RADIUS - 50);
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    };
  };

  // --- INITIALIZATION ---

  useEffect(() => {
    // Shared Initialization Helpers
    const initSnow = () => {
      snowRef.current = Array.from({ length: SNOW_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2.2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2.2,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        wind: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5 + 0.3,
      }));
    };

    const initRain = () => {
      rainRef.current = Array.from({ length: RAIN_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        speed: Math.random() * 10 + 10,
        length: Math.random() * 10 + 5,
      }));
      ripplesRef.current = [];
    };

    const initForest = () => {
      plantsRef.current = [];
      for (let i = 0; i < 3; i++) {
        const pos = getRandomPosInGlobe(GROUND_Y_OFFSET, 20);
        plantsRef.current.push({ x: pos.x, y: pos.y, type: 'TREE', color: '#166534', height: 80, width: 40 });
      }
      plantsRef.current.sort((a,b) => a.y - b.y);
    };

    const initPeople = () => {
      peopleRef.current = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        pos: getRandomPosInGlobe(),
        velocity: { x: 0, y: 0 },
        state: PersonState.IDLE,
        target: null,
        targetEntityId: null,
        color: WINTER_PALETTE[i % WINTER_PALETTE.length],
        size: 8,
        stateTimer: Math.random() * 100 + 50,
      }));
    };

    const initSakura = () => {
       petalsRef.current = Array.from({ length: PETAL_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        size: Math.random() * 3 + 2,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 + 0.5,
        angle: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 0.1,
      }));
    };

    const initCat = () => {
      catRef.current = { pos: {x: 0, y: GROUND_Y_OFFSET - 20}, state: 'IDLE', timer: 0, targetMouseId: null, angle: 0 };
    };

    const initChristmasTree = () => {
      christmasLightsRef.current = [];
      for (let i = 0; i < 90; i++) {
        const hPercent = Math.random(); 
        const y = -220 + hPercent * 280; 
        const maxWidth = hPercent * 130; 
        const x = (Math.random() - 0.5) * 2 * maxWidth;
        christmasLightsRef.current.push({
          x,
          y,
          color: ['#fca5a5', '#fde047', '#93c5fd', '#ffffff', '#f0abfc'][Math.floor(Math.random()*5)],
          phase: Math.random() * Math.PI * 2,
          speed: 0.03 + Math.random() * 0.05
        });
      }
      giftsRef.current = []; // No gifts in custom for simplicity, or we can add them. Let's assume just tree for now.
    };

    const initWedding = () => {
       confettiRef.current = Array.from({ length: 150 }).map(() => ({
         x: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
         y: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
         color: ['#f472b6', '#fbcfe8', '#fefce8', '#fecaca', '#fff'][Math.floor(Math.random()*5)],
         speedY: 0.5 + Math.random(),
         sway: Math.random() * 0.1,
         swayOffset: Math.random() * Math.PI * 2
       }));
    };

    const initEgypt = () => {
      camelsRef.current = [];
      for(let i=0; i<4; i++) {
        // Camels in the distance (smaller scale, slower, higher up on canvas visually)
        // REDUCED SPEED drastically here
        camelsRef.current.push({
          x: -180 - i * 60,
          y: GROUND_Y_OFFSET - 30 + (Math.random() * 10), // Background
          speed: 0.05 + Math.random() * 0.02, // SLOWER SPEED
          scale: 0.4 
        });
      }
    };

    const initCityNight = () => {
       skyscrapersRef.current = [];
       const count = 12; // Fewer, denser
       for(let i=0; i<count; i++) {
         const h = 150 + Math.random() * 200;
         const w = 50 + Math.random() * 40;
         // Staggered depth effect using X
         const x = -GLOBE_RADIUS + (i * (GLOBE_RADIUS*2 / count)) + (Math.random() - 0.5) * 20;
         const wins = [];
         for(let j=0; j<40; j++) wins.push(Math.random() > 0.4); // More lights
         skyscrapersRef.current.push({ x, width: w, height: h, windows: wins });
       }
       cityCarsRef.current = [];
       // Add initial cars
       for(let i=0; i<25; i++) {
         cityCarsRef.current.push({
           x: (Math.random() - 0.5) * GLOBE_RADIUS * 2.2,
           y: GROUND_Y_OFFSET + 50 + (Math.random() * 30),
           lane: Math.random() > 0.5 ? 1 : 0,
           speed: 2 + Math.random() * 2,
           color: Math.random() > 0.5 ? '#fef08a' : '#ef4444', 
           type: Math.random() > 0.5 ? 'HEADLIGHT' : 'TAILLIGHT'
         });
       }
    };

    const initCarousel = () => {
      horsesRef.current = Array.from({ length: HORSE_COUNT }).map((_, i) => ({
        angle: (i / HORSE_COUNT) * Math.PI * 2,
        yOffset: 0,
        color: ['#fca5a5', '#93c5fd', '#86efac', '#fde047'][i%4],
        riderColor: ['#e0f2fe', '#fce7f3', '#fff7ed'][i % 3] // Random rider clothing
      }));
      // Many small lights for the rim
      carouselLightsRef.current = Array.from({ length: 24 }).map((_, i) => ({
        angle: (i / 24) * Math.PI * 2,
        isOn: i % 2 === 0,
        color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#eab308' : '#3b82f6'
      }));
      carouselRotationRef.current = 0;
    };

    const initFisherman = () => {
       // Ink Snow (fewer, slower, varying sizes)
       inkParticlesRef.current = Array.from({ length: 150 }).map(() => ({
         x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
         y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
         radius: Math.random() * 2 + 1,
         speedY: 0.3 + Math.random() * 0.4,
         speedX: (Math.random() - 0.5) * 0.2,
         opacity: Math.random() * 0.6 + 0.2
       }));
       // Background Mountains (Static)
       inkMountainsRef.current = [
         { x: -150, y: -20, width: 200, height: 180, color: '#94a3b8' }, // Distant
         { x: 50, y: 10, width: 180, height: 140, color: '#64748b' }, // Mid
         { x: -250, y: 40, width: 250, height: 100, color: '#cbd5e1' }, // Far far
       ];
    };

    const initBamboo = () => {
       bambooStalksRef.current = Array.from({ length: 15 }).map((_,i) => {
         const dist = Math.random(); // 0 is far, 1 is close
         return {
           x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
           width: 8 + dist * 15, // Closer ones thicker
           color: dist > 0.7 ? '#14532d' : dist > 0.4 ? '#166534' : '#15803d',
           segments: 5 + Math.floor(Math.random() * 4),
           sway: Math.random() * 0.5 + 0.5,
           swayOffset: Math.random() * Math.PI * 2
         };
       }).sort((a,b) => a.width - b.width); // Draw thin (far) first
       
       bambooLeavesRef.current = Array.from({ length: 80 }).map(() => ({
         x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
         y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
         angle: Math.random() * Math.PI,
         vx: Math.random() * 1 - 0.5,
         vy: Math.random() * 1 + 0.5,
         opacity: Math.random() * 0.5 + 0.5
       }));
    };

    const initJellyfish = () => {
      bubblesRef.current = Array.from({ length: 30 }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        y: GLOBE_RADIUS + Math.random() * 50,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      }));

      jellyfishRef.current = Array.from({ length: 8 }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.2, // Slight upward bias
        size: 20 + Math.random() * 15,
        color: ['#e0f2fe', '#fce7f3', '#d8b4fe'][Math.floor(Math.random() * 3)],
        tentaclePhase: Math.random() * Math.PI * 2,
        isGlowing: Math.random() > 0.8,
        glowTimer: Math.random() * 100
      }));
    };

    // Reset Logic based on scene
    if (currentScene === 'WINTER') {
      initSnow();
      peopleRef.current = Array.from({ length: PERSON_COUNT }).map((_, i) => ({
        id: i,
        pos: getRandomPosInGlobe(),
        velocity: { x: 0, y: 0 },
        state: PersonState.IDLE,
        target: null,
        targetEntityId: null,
        color: WINTER_PALETTE[i % WINTER_PALETTE.length],
        size: 8,
        stateTimer: Math.random() * 100 + 50,
      }));
      snowmenRef.current = [];
    } else if (currentScene === 'RAIN') {
      initRain();
      plantsRef.current = [];
      for (let i = 0; i < 3; i++) {
        const pos = getRandomPosInGlobe(GROUND_Y_OFFSET, 20);
        plantsRef.current.push({ x: pos.x, y: pos.y, type: 'TREE', color: '#166534', height: 80, width: 40 });
      }
      for (let i = 0; i < 6; i++) {
        const pos = getRandomPosInGlobe(GROUND_Y_OFFSET, 10);
        plantsRef.current.push({ x: pos.x, y: pos.y, type: 'FLOWER', color: ['#f472b6', '#a78bfa', '#fbbf24'][i%3], height: 15, width: 10 });
      }
      plantsRef.current.sort((a,b) => a.y - b.y);
    } else if (currentScene === 'FISH') {
      fishRef.current = Array.from({ length: FISH_COUNT }).map((_, i) => ({
        id: i,
        pos: getFishRandomPos(),
        velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 1 },
        color: ['#fb923c', '#facc15', '#60a5fa', '#f87171'][i % 4],
        size: Math.random() * 10 + 5,
        tailPhase: Math.random() * Math.PI,
        type: Math.random() > 0.7 ? 'FAT' : Math.random() > 0.4 ? 'LONG' : 'TINY',
      }));
      bubblesRef.current = Array.from({ length: BUBBLE_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
        y: GLOBE_RADIUS + Math.random() * 50,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
      }));
    } else if (currentScene === 'SAKURA') {
      initSakura();
      swingAngleRef.current = 0;
    } else if (currentScene === 'CAROUSEL') {
      initCarousel();
    } else if (currentScene === 'SHANGHAI') {
      boatsRef.current = [
        { x: -100, y: GROUND_Y_OFFSET + 20, speed: 0.5, direction: 1, type: 'CRUISE' },
        { x: 100, y: GROUND_Y_OFFSET + 40, speed: 0.3, direction: -1, type: 'CARGO' }
      ];
      starsRef.current = Array.from({ length: 50 }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8 - 50, // Top half
        opacity: Math.random()
      }));
    } else if (currentScene === 'CAT_MOUSE') {
      initCat();
      miceRef.current = [];
      nextMouseIdRef.current = 0;
      for(let i=0; i<3; i++) {
        miceRef.current.push({
          id: nextMouseIdRef.current++,
          pos: getRandomPosInGlobe(),
          velocity: {x:0, y:0},
          color: '#d4d4d8',
          panic: false
        });
      }
    } else if (currentScene === 'BIRTHDAY') {
      candlesRef.current = [
        { x: -10, y: -20, flicker: 1, color: '#f87171' },
        { x: 0, y: -20, flicker: 1, color: '#60a5fa' },
        { x: 10, y: -20, flicker: 1, color: '#fbbf24' }
      ];
      particlesRef.current = [];
    } else if (currentScene === 'CHRISTMAS') {
      initSnow();
      initChristmasTree();
      giftsRef.current = [];
      for(let i=0; i<12; i++) { 
        const x = (Math.random() - 0.5) * 180;
        const y = 60 + Math.random() * 20; 
        giftsRef.current.push({
          x,
          y,
          width: 25 + Math.random() * 20,
          height: 25 + Math.random() * 20,
          color: ['#b91c1c', '#15803d', '#1d4ed8', '#b45309', '#7e22ce'][Math.floor(Math.random()*5)],
          ribbonColor: '#fef3c7'
        });
      }
      giftsRef.current.sort((a,b) => a.y - b.y);
    } else if (currentScene === 'WEDDING') {
      initWedding();
    } else if (currentScene === 'EGYPT') {
      initEgypt();
    } else if (currentScene === 'CITY_NIGHT') {
      initCityNight();
    } else if (currentScene === 'FISHERMAN') {
      initFisherman();
    } else if (currentScene === 'BAMBOO') {
      initBamboo();
    } else if (currentScene === 'JELLYFISH') {
      initJellyfish();
    } else if (currentScene === 'CUSTOM' && customConfig) {
      if (customConfig.snow) initSnow(); else snowRef.current = [];
      if (customConfig.rain) initRain(); else rainRef.current = [];
      if (customConfig.people) initPeople(); else peopleRef.current = [];
      if (customConfig.forest) initForest(); else plantsRef.current = [];
      if (customConfig.sakura) initSakura(); else petalsRef.current = [];
      if (customConfig.cat) initCat();
      if (customConfig.christmasTree) initChristmasTree(); else christmasLightsRef.current = [];
    }

  }, [currentScene, customConfig]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- UPDATE FUNCTIONS ---

    const updateSnow = () => {
      snowRef.current.forEach(flake => {
        flake.y += flake.speed;
        flake.x += flake.wind;
        if (flake.y > GLOBE_RADIUS || Math.abs(flake.x) > GLOBE_RADIUS) {
          flake.y = -GLOBE_RADIUS;
          flake.x = (Math.random() - 0.5) * GLOBE_RADIUS * 2;
        }
      });
    };

    const updateWinter = () => {
      updateSnow();
      // ... (Person/Snowman logic same as before, simplified for brevity here since we focus on new scenes)
      snowmenRef.current.forEach(snowman => {
        if (snowman.isComplete) snowman.health -= 0.0005; 
        else {
           const builder = peopleRef.current.find(p => p.state === PersonState.BUILDING && p.targetEntityId === snowman.id);
           if (!builder) snowman.health -= 0.002;
        }
      });
      snowmenRef.current = snowmenRef.current.filter(s => s.health > 0);
      peopleRef.current.forEach(person => {
        if (person.stateTimer > 0) person.stateTimer--;
        if (person.state === PersonState.IDLE && person.stateTimer <= 0) {
           const rand = Math.random();
           if (rand < 0.6) {
             person.state = PersonState.WALKING;
             person.target = getRandomPosInGlobe();
             person.stateTimer = 0;
           } else if (rand < 0.85 && snowmenRef.current.length < MAX_SNOWMEN && currentScene === 'WINTER') {
             // Only build snowmen in Winter scene
             let s = snowmenRef.current.find(s => !s.isComplete && s.health > 0);
             if (!s) {
               s = { id: Date.now() + Math.random(), pos: getRandomPosInGlobe(), progress: 0, health: 1, isComplete: false };
               snowmenRef.current.push(s);
             }
             person.state = PersonState.WALKING;
             person.target = { x: s.pos.x + 15, y: s.pos.y };
             person.targetEntityId = s.id;
           } else {
             // Just wander in Custom
             person.state = PersonState.WALKING;
             person.target = getRandomPosInGlobe();
             person.stateTimer = 0;
           }
        }
        if (person.state === PersonState.WALKING && person.target) {
           const dx = person.target.x - person.pos.x;
           const dy = person.target.y - person.pos.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < 2) {
             person.pos = person.target;
             person.target = null;
             if (person.targetEntityId) { person.state = PersonState.BUILDING; person.stateTimer = 300; } 
             else { person.state = PersonState.IDLE; person.stateTimer = 60; }
           } else {
             person.pos.x += (dx/dist)*0.8;
             person.pos.y += (dy/dist)*0.8;
           }
        }
        if (person.state === PersonState.BUILDING) {
          const s = snowmenRef.current.find(sm => sm.id === person.targetEntityId);
          if (s && !s.isComplete && s.health > 0) {
            s.progress += 0.005;
            if (s.progress >= 1) { s.progress = 1; s.isComplete = true; person.state = PersonState.IDLE; person.targetEntityId = null; person.stateTimer = 60; }
          } else {
            person.state = PersonState.IDLE; person.targetEntityId = null;
          }
        }
        if (person.state === PersonState.FIGHTING && person.stateTimer <= 0) { person.state = PersonState.IDLE; person.stateTimer = 60; }
      });
    };

    const updateRain = () => {
      rainRef.current.forEach(drop => {
        drop.y += drop.speed;
        let hit = false; let hitY = 0;
        // Check plant collision only if plants exist
        if (plantsRef.current.length > 0) {
            for (const p of plantsRef.current) {
              const dx = drop.x - p.x;
              if (Math.abs(dx) < p.width / 2) {
                const topY = p.y - p.height; 
                if (drop.y >= topY && drop.y <= topY + 10) { hit = true; hitY = topY; break; }
              }
            }
        }
        if (!hit && drop.y > GROUND_Y_OFFSET + (Math.random() * 20)) { hit = true; hitY = drop.y; }
        if (hit) {
          drop.y = -GLOBE_RADIUS - Math.random() * 50; drop.x = (Math.random() - 0.5) * GLOBE_RADIUS * 1.8;
          ripplesRef.current.push({ x: drop.x, y: hitY, radius: 1, maxRadius: Math.random() * 5 + 5, opacity: 1 });
        }
      });
      ripplesRef.current.forEach(r => { r.radius += 0.5; r.opacity -= 0.05; });
      ripplesRef.current = ripplesRef.current.filter(r => r.opacity > 0);
    };

    const updateFish = () => {
      fishRef.current.forEach(fish => {
        fish.pos.x += fish.velocity.x;
        fish.pos.y += fish.velocity.y;
        fish.tailPhase += 0.2;
        const dist = Math.sqrt(fish.pos.x ** 2 + fish.pos.y ** 2);
        if (dist > GLOBE_RADIUS - 20) { fish.velocity.x -= fish.pos.x * 0.001; fish.velocity.y -= fish.pos.y * 0.001; }
        if (Math.random() < 0.02) { fish.velocity.x += (Math.random() - 0.5) * 0.5; fish.velocity.y += (Math.random() - 0.5) * 0.5; }
        const speed = Math.sqrt(fish.velocity.x**2 + fish.velocity.y**2);
        if (speed > 2) { fish.velocity.x *= 0.9; fish.velocity.y *= 0.9; } else if (speed < 0.5) { fish.velocity.x *= 1.1; fish.velocity.y *= 1.1; }
      });
      bubblesRef.current.forEach(b => {
        b.y -= b.speed; b.x += Math.sin(b.y * 0.05) * 0.5;
        if (b.y < -GLOBE_RADIUS) { b.y = GLOBE_RADIUS + 10; b.x = (Math.random() - 0.5) * GLOBE_RADIUS; }
      });
    };

    const updateSakura = () => {
      swingAngleRef.current = Math.sin(Date.now() / 1000) * 0.4;
      petalsRef.current.forEach(p => {
        p.x += p.speedX + Math.sin(Date.now() / 500) * 0.5; p.y += p.speedY; p.angle += p.spinSpeed;
        if (p.y > GLOBE_RADIUS) { p.y = -GLOBE_RADIUS; p.x = (Math.random() - 0.5) * GLOBE_RADIUS * 2; }
      });
    };

    const updateCarousel = () => {
      carouselRotationRef.current += 0.01;
      horsesRef.current.forEach((h, i) => {
        h.yOffset = Math.sin(Date.now() / 300 + i) * 10;
      });
      // Flashier lights
      carouselLightsRef.current.forEach((l, i) => {
        // Blinking pattern
        if (Math.random() > 0.9) l.isOn = !l.isOn;
      });
    };

    const updateShanghai = () => {
      boatsRef.current.forEach(b => {
        b.x += b.speed * b.direction;
        if (b.x > GLOBE_RADIUS + 50 && b.direction === 1) { b.x = -GLOBE_RADIUS - 50; }
        if (b.x < -GLOBE_RADIUS - 50 && b.direction === -1) { b.x = GLOBE_RADIUS + 50; }
      });
      starsRef.current.forEach(s => {
        if (Math.random() > 0.95) s.opacity = Math.random();
      });
    };

    const updateCatMouse = () => {
      // Spawn Mice
      if (miceRef.current.length < 5 && Math.random() < 0.01 && currentScene === 'CAT_MOUSE') {
        miceRef.current.push({
          id: nextMouseIdRef.current++,
          pos: getRandomPosInGlobe(),
          velocity: {x:0, y:0},
          color: '#d4d4d8',
          panic: false
        });
      }

      const cat = catRef.current;
      
      // Cat Logic
      if (cat.state === 'EATING') {
        cat.timer--;
        if (cat.timer <= 0) cat.state = 'IDLE';
      } else {
        // Find nearest mouse
        let nearestMouse: MouseEntity | null = null;
        let minDst = Infinity;
        miceRef.current.forEach(m => {
          const dst = Math.sqrt((m.pos.x - cat.pos.x)**2 + (m.pos.y - cat.pos.y)**2);
          if (dst < minDst) { minDst = dst; nearestMouse = m; }
        });

        if (nearestMouse) {
           cat.targetMouseId = (nearestMouse as MouseEntity).id;
           cat.state = 'HUNTING';
           
           if (minDst < 10) {
             // Catch!
             cat.state = 'EATING';
             cat.timer = 100;
             miceRef.current = miceRef.current.filter(m => m.id !== (nearestMouse as MouseEntity).id);
           } else {
             // Move towards mouse
             const angle = Math.atan2((nearestMouse as MouseEntity).pos.y - cat.pos.y, (nearestMouse as MouseEntity).pos.x - cat.pos.x);
             cat.angle = angle;
             cat.pos.x += Math.cos(angle) * 1.5;
             cat.pos.y += Math.sin(angle) * 1.5;
           }
        } else {
          cat.state = 'IDLE';
          // Wander if custom
           if (Math.random() < 0.02) {
             cat.angle = Math.random() * Math.PI * 2;
           }
           if (Math.random() < 0.3) { // idle movement
               cat.pos.x += Math.cos(cat.angle) * 0.5;
               cat.pos.y += Math.sin(cat.angle) * 0.5;
               // Boundaries
               const dist = Math.sqrt(cat.pos.x**2 + cat.pos.y**2);
               if (dist > GLOBE_RADIUS - 30) {
                   cat.pos.x *= 0.95; cat.pos.y *= 0.95;
                   cat.angle += Math.PI;
               }
           }
        }
      }

      // Mice Logic
      miceRef.current.forEach(m => {
        const distToCat = Math.sqrt((m.pos.x - cat.pos.x)**2 + (m.pos.y - cat.pos.y)**2);
        if (distToCat < 80) {
          // Panic/Flee
          m.panic = true;
          const angle = Math.atan2(m.pos.y - cat.pos.y, m.pos.x - cat.pos.x);
          m.velocity.x = Math.cos(angle) * 2;
          m.velocity.y = Math.sin(angle) * 2;
        } else {
          m.panic = false;
          // Random walk
          if (Math.random() < 0.05) {
             const angle = Math.random() * Math.PI * 2;
             m.velocity.x = Math.cos(angle) * 0.5;
             m.velocity.y = Math.sin(angle) * 0.5;
          }
        }
        
        m.pos.x += m.velocity.x;
        m.pos.y += m.velocity.y;
        
        // Boundaries
        const dist = Math.sqrt(m.pos.x**2 + m.pos.y**2);
        if (dist > GLOBE_RADIUS - 30) {
           m.pos.x *= 0.95; m.pos.y *= 0.95;
           m.velocity.x *= -1; m.velocity.y *= -1;
        }
      });
    };

    const updateBirthday = () => {
      candlesRef.current.forEach(c => {
        c.flicker = 0.8 + Math.random() * 0.4;
      });
      // Spawn particles
      if (Math.random() < 0.2) {
        particlesRef.current.push({
          x: (Math.random() - 0.5) * 40,
          y: -40,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1,
          life: 1,
          color: 'gold'
        });
      }
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    };

    const updateChristmas = () => {
      updateSnow();
      christmasLightsRef.current.forEach(l => {
        l.phase += l.speed;
      });
    };

    const updateWedding = () => {
       confettiRef.current.forEach(c => {
         c.y += c.speedY;
         c.x += Math.sin(c.y * c.sway + c.swayOffset) * 0.5;
         if (c.y > GLOBE_RADIUS) {
           c.y = -GLOBE_RADIUS;
           c.x = (Math.random() - 0.5) * GLOBE_RADIUS * 1.8;
         }
       });
    };

    const updateEgypt = () => {
       camelsRef.current.forEach(c => {
         c.x += c.speed;
         // Sync bobbing with leg speed
         // Legs swing frequency is 0.1 based on drawEgypt (Math.sin(c.x * 0.1))
         // Bobbing should match phase. 0.2 represents one bob per step (2 steps per cycle).
         const stepBob = Math.sin(c.x * 0.2) * 2; 
         const baseDuneY = GROUND_Y_OFFSET - 30;
         c.y = baseDuneY + stepBob;

         if (c.x > GLOBE_RADIUS + 50) c.x = -GLOBE_RADIUS - 50;
       });
    };

    const updateCityNight = () => {
       cityCarsRef.current.forEach(c => {
         c.x += c.speed;
         if (c.x > GLOBE_RADIUS + 50) {
           c.x = -GLOBE_RADIUS - 50;
           // Randomize slightly on loop
           c.speed = 2 + Math.random() * 2;
         }
       });
    };

    const updateFisherman = () => {
       inkParticlesRef.current.forEach(p => {
         p.y += p.speedY;
         p.x += Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.2 + p.speedX;
         if (p.y > GLOBE_RADIUS) {
           p.y = -GLOBE_RADIUS;
           p.x = (Math.random() - 0.5) * GLOBE_RADIUS * 2;
         }
       });
    };

    const updateBamboo = () => {
      bambooLeavesRef.current.forEach(l => {
        l.x += l.vx + Math.sin(Date.now() * 0.002 + l.y) * 0.5;
        l.y += l.vy;
        l.angle += 0.02;
        if (l.y > GLOBE_RADIUS) {
          l.y = -GLOBE_RADIUS - 50;
          l.x = (Math.random() - 0.5) * GLOBE_RADIUS * 2;
        }
      });
    };

    const updateJellyfish = () => {
       bubblesRef.current.forEach(b => {
        b.y -= b.speed; b.x += Math.sin(b.y * 0.05) * 0.5;
        if (b.y < -GLOBE_RADIUS) { b.y = GLOBE_RADIUS + 10; b.x = (Math.random() - 0.5) * GLOBE_RADIUS; }
      });

      jellyfishRef.current.forEach(j => {
         // Gentle propulsion
         j.x += j.vx;
         j.y += j.vy;
         
         // Tentacle wave
         j.tentaclePhase += 0.1;

         // Boundary wrapping
         if (j.x > GLOBE_RADIUS + 50) j.x = -GLOBE_RADIUS - 50;
         if (j.x < -GLOBE_RADIUS - 50) j.x = GLOBE_RADIUS + 50;
         if (j.y > GLOBE_RADIUS + 50) j.y = -GLOBE_RADIUS - 50;
         if (j.y < -GLOBE_RADIUS - 50) j.y = GLOBE_RADIUS + 50;

         // Glowing
         j.glowTimer++;
         if (j.glowTimer > 100) {
           if (Math.random() < 0.02) j.isGlowing = !j.isGlowing;
           j.glowTimer = 0;
         }
      });
    };

    const updateCustom = () => {
      if (customConfig?.snow) updateSnow();
      if (customConfig?.rain) updateRain();
      if (customConfig?.sakura) updateSakura();
      if (customConfig?.people) updateWinter(); // Re-use winter logic for walking
      if (customConfig?.cat) updateCatMouse();
      if (customConfig?.christmasTree) {
         christmasLightsRef.current.forEach(l => l.phase += l.speed);
      }
    };


    // --- DRAW FUNCTIONS ---

    // Helper for clearing
    const clear = (cx: number, cy: number) => {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       ctx.save();
       ctx.beginPath();
       ctx.arc(cx, cy, GLOBE_RADIUS, 0, Math.PI * 2);
       ctx.closePath();
       ctx.clip();
    };

    // Re-implementing drawWinter, drawRain, etc. inside the switch or helper
    
    const drawPerson = (ctx: CanvasRenderingContext2D, person: Person, cx: number, cy: number) => {
      const x = cx + person.pos.x;
      const y = cy + person.pos.y;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI*2); ctx.fill();

      // Body
      ctx.fillStyle = person.color;
      ctx.beginPath();
      ctx.moveTo(x - 4, y); ctx.lineTo(x - 4, y - 12); ctx.lineTo(x + 4, y - 12); ctx.lineTo(x + 4, y);
      ctx.fill();
      
      // Head
      ctx.fillStyle = '#ffedd5'; // Skin
      ctx.beginPath(); ctx.arc(x, y - 14, 4, 0, Math.PI*2); ctx.fill();
      
      // Arms (simple)
      if (person.state === PersonState.BUILDING) {
         ctx.strokeStyle = person.color; ctx.lineWidth = 2;
         ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 6, y - 8); ctx.stroke();
      }
    };

    const drawSnowman = (ctx: CanvasRenderingContext2D, s: Snowman, cx: number, cy: number) => {
      const x = cx + s.pos.x;
      const y = cy + s.pos.y;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath(); ctx.ellipse(x, y, 10 * s.progress, 3 * s.progress, 0, 0, Math.PI*2); ctx.fill();

      // Body
      ctx.fillStyle = '#f8fafc';
      // Base
      if (s.progress > 0.1) {
        ctx.beginPath(); ctx.arc(x, y - 8 * s.progress, 8 * s.progress, 0, Math.PI*2); ctx.fill();
      }
      // Middle
      if (s.progress > 0.4) {
         ctx.beginPath(); ctx.arc(x, y - 18 * s.progress, 6 * s.progress, 0, Math.PI*2); ctx.fill();
      }
      // Head
      if (s.progress > 0.7) {
         ctx.beginPath(); ctx.arc(x, y - 26 * s.progress, 4 * s.progress, 0, Math.PI*2); ctx.fill();
         // Eyes
         if (s.isComplete) {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath(); ctx.arc(x - 1.5, y - 27, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 1.5, y - 27, 1, 0, Math.PI*2); ctx.fill();
            // Nose
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x + 4, y - 25); ctx.lineTo(x, y - 24); ctx.fill();
         }
      }
    };

    const drawSnow = (cx: number, cy: number) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      snowRef.current.forEach(flake => { ctx.globalAlpha = flake.opacity; ctx.beginPath(); ctx.arc(cx + flake.x, cy + flake.y, flake.radius, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1.0;
    };

    const drawWinter = (cx: number, cy: number) => {
      const skyGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
      ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 20, GLOBE_RADIUS * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9'; ctx.fill();
      const renderList = [...peopleRef.current.map(p => ({ type: 'person' as const, y: p.pos.y, data: p })), ...snowmenRef.current.map(s => ({ type: 'snowman' as const, y: s.pos.y, data: s }))];
      renderList.sort((a, b) => a.y - b.y);
      renderList.forEach(item => { if (item.type === 'person') drawPerson(ctx, item.data as Person, cx, cy); else drawSnowman(ctx, item.data as Snowman, cx, cy); });
      drawSnow(cx, cy);
    };

    const drawRain = (cx: number, cy: number) => {
      const skyGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      skyGrad.addColorStop(0, '#334155'); skyGrad.addColorStop(1, '#475569');
      ctx.fillStyle = skyGrad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
      ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 20, GLOBE_RADIUS * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#14532d'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 80, cy + GROUND_Y_OFFSET + 20, 80, 40, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; ctx.fill();
      plantsRef.current.forEach(p => {
         const px = cx + p.x; const py = cy + p.y;
         ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px, py, 15, 5, 0, 0, Math.PI*2); ctx.fill();
         if (p.type === 'TREE') {
            ctx.fillStyle = '#451a03'; ctx.fillRect(px - 4, py - p.height, 8, p.height);
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py - p.height, 25, 0, Math.PI * 2);
            ctx.arc(px - 15, py - p.height + 10, 20, 0, Math.PI * 2); ctx.arc(px + 15, py - p.height + 10, 20, 0, Math.PI * 2); ctx.fill();
         } else {
            ctx.strokeStyle = '#166534'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - p.height); ctx.stroke();
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py - p.height, 5, 0, Math.PI * 2); ctx.fill();
         }
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      ripplesRef.current.forEach(r => { ctx.globalAlpha = r.opacity; ctx.beginPath(); ctx.ellipse(cx + r.x, cy + r.y, r.radius, r.radius * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); });
      ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)'; ctx.lineWidth = 1;
      rainRef.current.forEach(r => { ctx.beginPath(); ctx.moveTo(cx + r.x, cy + r.y); ctx.lineTo(cx + r.x, cy + r.y + r.length); ctx.stroke(); });
    };

    const drawFish = (cx: number, cy: number) => {
       const waterGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
       waterGrad.addColorStop(0, '#0ea5e9'); waterGrad.addColorStop(1, '#0c4a6e');
       ctx.fillStyle = waterGrad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
       ctx.beginPath(); ctx.ellipse(cx, cy + GLOBE_RADIUS - 40, GLOBE_RADIUS - 40, 40, 0, 0, Math.PI * 2); ctx.fillStyle = '#fde047'; ctx.fill();
       ctx.strokeStyle = 'rgba(255,255,255,0.4)';
       bubblesRef.current.forEach(b => { ctx.beginPath(); ctx.arc(cx + b.x, cy + b.y, b.size, 0, Math.PI * 2); ctx.stroke(); });
       fishRef.current.forEach(f => {
         ctx.save(); ctx.translate(cx + f.pos.x, cy + f.pos.y);
         const angle = Math.atan2(f.velocity.y, f.velocity.x); ctx.rotate(angle);
         if (Math.abs(angle) > Math.PI/2) ctx.scale(1, -1); 
         ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0, 0, f.size * 1.5, f.size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
         const tailWag = Math.sin(f.tailPhase) * 5; ctx.beginPath(); ctx.moveTo(-f.size, 0); ctx.lineTo(-f.size * 2, -f.size * 0.8 + tailWag); ctx.lineTo(-f.size * 2, f.size * 0.8 + tailWag); ctx.fill();
         ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(f.size * 0.8, -f.size * 0.3, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
       });
    };

    const drawSakura = (cx: number, cy: number) => {
       const skyGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
       skyGrad.addColorStop(0, '#a5f3fc'); skyGrad.addColorStop(1, '#67e8f9');
       ctx.fillStyle = skyGrad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
       ctx.fillStyle = '#bef264'; ctx.beginPath(); ctx.arc(cx, cy + GLOBE_RADIUS + 200, GLOBE_RADIUS + 150, 0, Math.PI * 2); ctx.fill();
       const treeBaseX = cx; const treeBaseY = cy + 120;
       ctx.fillStyle = '#573318'; ctx.beginPath(); ctx.moveTo(treeBaseX - 20, treeBaseY); ctx.quadraticCurveTo(treeBaseX - 10, treeBaseY - 100, treeBaseX - 30, treeBaseY - 180); 
       ctx.lineTo(treeBaseX + 30, treeBaseY - 180); ctx.quadraticCurveTo(treeBaseX + 10, treeBaseY - 100, treeBaseX + 20, treeBaseY); ctx.fill();
       ctx.fillStyle = '#fbcfe8'; 
       const drawBlob = (bx: number, by: number, r: number) => { ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); };
       drawBlob(treeBaseX, treeBaseY - 200, 60); drawBlob(treeBaseX - 50, treeBaseY - 180, 50); drawBlob(treeBaseX + 50, treeBaseY - 180, 50);
       drawBlob(treeBaseX - 30, treeBaseY - 240, 40); drawBlob(treeBaseX + 30, treeBaseY - 240, 40);
       const branchX = treeBaseX + 40; const branchY = treeBaseY - 180; const swingLen = 100; const angle = swingAngleRef.current;
       const seatX = branchX + Math.sin(angle) * swingLen; const seatY = branchY + Math.cos(angle) * swingLen;
       ctx.strokeStyle = '#3f2212'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(branchX, branchY); ctx.lineTo(seatX, seatY); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(branchX + 10, branchY); ctx.lineTo(seatX + 10, seatY); ctx.stroke();
       ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(seatX - 5, seatY); ctx.lineTo(seatX + 15, seatY); ctx.stroke();
       ctx.fillStyle = '#1e3a8a'; ctx.fillRect(seatX, seatY - 12, 4, 12); ctx.fillStyle = '#be123c'; ctx.fillRect(seatX + 6, seatY - 12, 4, 12);
       ctx.fillStyle = '#ffe4c4'; ctx.beginPath(); ctx.arc(seatX + 2, seatY - 16, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(seatX + 8, seatY - 16, 3, 0, Math.PI * 2); ctx.fill();
       ctx.fillStyle = '#fce7f3';
       petalsRef.current.forEach(p => { ctx.save(); ctx.translate(cx + p.x, cy + p.y); ctx.rotate(p.angle); ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    };

    const drawCarousel = (cx: number, cy: number) => {
      // Background (Park Night)
      const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, GLOBE_RADIUS);
      grad.addColorStop(0, '#312e81'); grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);

      const baseY = cy + 100;
      const carouselWidth = 200;
      const carouselHeight = 40;

      // Draw Floor (Back)
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath(); ctx.ellipse(cx, baseY, carouselWidth, carouselHeight, 0, Math.PI, 0); ctx.fill(); 
      ctx.beginPath(); ctx.ellipse(cx, baseY, carouselWidth, carouselHeight, 0, 0, Math.PI * 2); ctx.fill();
      
      // Central Pole (Ornate)
      ctx.fillStyle = '#f59e0b'; // Gold
      ctx.fillRect(cx - 15, baseY - 200, 30, 200);
      // Stripes
      ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 2;
      for(let i=0; i<10; i++) {
        ctx.beginPath(); ctx.moveTo(cx - 15, baseY - 200 + i*20); ctx.lineTo(cx + 15, baseY - 180 + i*20); ctx.stroke();
      }

      // Sort horses (Back horses first)
      const horses = [...horsesRef.current].map(h => ({
        ...h,
        displayAngle: (h.angle + carouselRotationRef.current) % (Math.PI * 2)
      })).sort((a, b) => Math.sin(a.displayAngle) - Math.sin(b.displayAngle));

      horses.forEach(h => {
        const rad = carouselWidth - 30;
        const hx = cx + Math.cos(h.displayAngle) * rad;
        const hy = baseY + Math.sin(h.displayAngle) * (carouselHeight - 10) - 20 + h.yOffset;
        
        // Scale based on depth
        const scale = 0.7 + (Math.sin(h.displayAngle) + 1) * 0.25;
        
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale, scale);
        
        // Pole
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(-2, -80, 4, 120);

        // Horse Body
        ctx.fillStyle = h.color;
        ctx.beginPath(); ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI*2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.ellipse(18, -12, 10, 6, -0.5, 0, Math.PI*2); ctx.fill();
        // Legs (Simplified)
        ctx.lineWidth=3; ctx.strokeStyle=h.color;
        ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-15, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(15, 20); ctx.stroke();
        
        // Rider
        if (h.riderColor) {
           ctx.fillStyle = h.riderColor;
           // Body
           ctx.fillRect(-5, -20, 10, 15);
           // Head
           ctx.fillStyle = '#ffedd5'; 
           ctx.beginPath(); ctx.arc(0, -25, 6, 0, Math.PI*2); ctx.fill();
           // Leg
           ctx.fillStyle = h.riderColor;
           ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(5, 0); ctx.lineTo(5, 5); ctx.stroke();
        }

        ctx.restore();
      });

      // Roof (Ornate Cone)
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(cx - carouselWidth - 10, baseY - 180);
      ctx.lineTo(cx + carouselWidth + 10, baseY - 180);
      ctx.lineTo(cx, baseY - 300);
      ctx.fill();
      
      // Roof trim
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.ellipse(cx, baseY - 180, carouselWidth + 10, 20, 0, 0, Math.PI*2); ctx.fill();

      // Flashing Lights
      carouselLightsRef.current.forEach(l => {
        const lx = cx + Math.cos(l.angle) * (carouselWidth + 5);
        const ly = baseY - 180 + Math.sin(l.angle) * 20;
        
        ctx.fillStyle = l.isOn ? l.color : '#4b5563';
        ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
        
        if (l.isOn) {
           // Bloom effect
           ctx.save();
           ctx.globalCompositeOperation = 'lighter';
           ctx.shadowColor = l.color; ctx.shadowBlur = 15;
           ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI*2); ctx.fill();
           ctx.restore();
        }
      });
    };

    const drawFisherman = (cx: number, cy: number) => {
      // Paper texture background
      const paperGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      paperGrad.addColorStop(0, '#f8fafc'); // White
      paperGrad.addColorStop(1, '#cbd5e1'); // Light Grey
      ctx.fillStyle = paperGrad; 
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Mountains (Ink Wash style)
      inkMountainsRef.current.forEach(m => {
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(cx + m.x, cy + m.y);
        // Simple bezier curve for mountain shape
        ctx.quadraticCurveTo(cx + m.x + m.width/2, cy + m.y - m.height, cx + m.x + m.width, cy + m.y);
        ctx.fill();
        
        // Reflection blur (fake)
        ctx.fillStyle = m.color + '40'; // Low opacity
        ctx.beginPath();
        ctx.moveTo(cx + m.x, cy + m.y);
        ctx.quadraticCurveTo(cx + m.x + m.width/2, cy + m.y + m.height * 0.3, cx + m.x + m.width, cy + m.y);
        ctx.fill();
      });

      // Water Surface
      const waterY = cy + 50;
      // Boat
      const boatX = cx; 
      const boatY = waterY + Math.sin(Date.now() * 0.001) * 3;
      
      // Boat Hull
      ctx.fillStyle = '#1e293b'; // Dark Ink
      ctx.beginPath();
      ctx.moveTo(boatX - 30, boatY);
      ctx.quadraticCurveTo(boatX, boatY + 15, boatX + 40, boatY); // curved bottom
      ctx.lineTo(boatX - 30, boatY);
      ctx.fill();

      // Fisherman (Silhouette)
      const manX = boatX + 10; const manY = boatY;
      ctx.fillStyle = '#0f172a';
      // Body
      ctx.beginPath(); ctx.moveTo(manX, manY); ctx.lineTo(manX + 5, manY - 15); ctx.lineTo(manX - 10, manY - 12); ctx.fill();
      // Straw Hat (Triangle/Cone)
      ctx.beginPath(); ctx.moveTo(manX - 15, manY - 12); ctx.lineTo(manX + 10, manY - 12); ctx.lineTo(manX - 2, manY - 18); ctx.fill();
      // Fishing Rod
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(manX - 5, manY - 10); ctx.lineTo(manX - 40, manY - 20); ctx.stroke();
      // Line
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.moveTo(manX - 40, manY - 20); ctx.lineTo(manX - 40, manY + 20); ctx.stroke();

      // Ink Snow
      inkParticlesRef.current.forEach(p => {
        // Soft white/grey snow
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, p.radius, 0, Math.PI*2); ctx.fill();
      });
      
      // Red Stamp (Seal)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(cx + GLOBE_RADIUS - 60, cy - 40, 30, 30);
      ctx.fillStyle = 'white';
      ctx.font = '10px serif';
      ctx.fillText('Zen', cx + GLOBE_RADIUS - 45, cy - 22);
    };

    const drawBamboo = (cx: number, cy: number) => {
      // Background: Misty Green
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      grad.addColorStop(0, '#ecfccb'); // Lime 100
      grad.addColorStop(1, '#3f6212'); // Lime 800
      ctx.fillStyle = grad;
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);
      
      // Mist
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 50, GLOBE_RADIUS, 50, 0, 0, Math.PI*2); ctx.fill();

      // Stalks
      bambooStalksRef.current.forEach(b => {
         const sway = Math.sin(Date.now() * 0.001 * b.sway + b.swayOffset) * 5;
         const bx = cx + b.x + sway;
         const by = cy + GLOBE_RADIUS; // Bottom
         
         ctx.fillStyle = b.color;
         // Draw segments
         const segH = (GLOBE_RADIUS * 2 + 50) / b.segments;
         for(let i=0; i<b.segments; i++) {
           const sy = by - i * segH;
           const ey = sy - segH + 2; // slight gap for joint
           
           // Slight taper/curve logic could go here, but straight rects look fine for stylized bamboo
           ctx.fillRect(bx - b.width/2, ey, b.width, segH - 2);
           
           // Joint
           ctx.fillStyle = '#14532d'; // Darker joint
           ctx.fillRect(bx - b.width/2 - 2, ey, b.width + 4, 3);
           ctx.fillStyle = b.color; // Reset
         }
      });

      // Leaves
      bambooLeavesRef.current.forEach(l => {
         const lx = cx + l.x;
         const ly = cy + l.y;
         ctx.save();
         ctx.translate(lx, ly);
         ctx.rotate(l.angle + Math.sin(Date.now() * 0.003 + l.x) * 0.5);
         
         ctx.fillStyle = `rgba(21, 128, 61, ${l.opacity})`; // Green 700
         ctx.beginPath();
         ctx.ellipse(0, 0, 8, 2, 0, 0, Math.PI*2);
         ctx.fill();
         ctx.restore();
      });
      
      // Light shafts
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const gradLight = ctx.createLinearGradient(cx - 100, cy - GLOBE_RADIUS, cx + 50, cy + GLOBE_RADIUS);
      gradLight.addColorStop(0, 'rgba(255,255,255,0.4)');
      gradLight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradLight;
      ctx.beginPath(); ctx.moveTo(cx - 150, cy - GLOBE_RADIUS); ctx.lineTo(cx - 50, cy - GLOBE_RADIUS); ctx.lineTo(cx + 100, cy + GLOBE_RADIUS); ctx.lineTo(cx - 50, cy + GLOBE_RADIUS);
      ctx.fill();
      ctx.restore();
    };

    const drawJellyfish = (cx: number, cy: number) => {
      // Deep Ocean Background
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      grad.addColorStop(0, '#172554'); // Blue 950
      grad.addColorStop(1, '#1e1b4b'); // Indigo 950
      ctx.fillStyle = grad;
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);

      // Bubbles
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      bubblesRef.current.forEach(b => {
         ctx.beginPath(); ctx.arc(cx + b.x, cy + b.y, b.size, 0, Math.PI*2); ctx.stroke();
      });

      // Jellyfish
      jellyfishRef.current.forEach(j => {
         const jx = cx + j.x;
         const jy = cy + j.y;
         
         ctx.save();
         ctx.translate(jx, jy);
         
         // Rotate slightly based on velocity
         const angle = Math.atan2(j.vy, j.vx) + Math.PI/2;
         // Dampen rotation so they don't flip crazy
         ctx.rotate(angle * 0.3);

         // Color & Glow
         const baseColor = j.isGlowing ? '#ffffff' : j.color;
         const glowColor = j.color;
         
         if (j.isGlowing) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = glowColor;
         }

         // Head (Bell)
         ctx.fillStyle = `${baseColor}80`; // Semi-transparent
         ctx.beginPath();
         ctx.arc(0, 0, j.size, Math.PI, 0); 
         // Bottom curve of bell
         ctx.bezierCurveTo(j.size, j.size/2, -j.size, j.size/2, -j.size, 0);
         ctx.fill();
         
         // Inner details
         ctx.strokeStyle = `${baseColor}AA`;
         ctx.lineWidth = 2;
         ctx.beginPath(); ctx.arc(0, 0, j.size * 0.7, Math.PI, 0); ctx.stroke();
         
         // Tentacles
         ctx.strokeStyle = `${baseColor}60`;
         ctx.lineWidth = 2;
         const numTentacles = 6;
         for(let i=0; i<numTentacles; i++) {
            const offsetX = (i - numTentacles/2 + 0.5) * (j.size / 2);
            ctx.beginPath();
            ctx.moveTo(offsetX, 5);
            
            // Wavy line
            for(let k=0; k<20; k++) {
               const ty = 5 + k * 3;
               const tx = offsetX + Math.sin(k * 0.5 + j.tentaclePhase + i) * 5;
               ctx.lineTo(tx, ty);
            }
            ctx.stroke();
         }

         ctx.restore();
      });
      // Reset Shadow
      ctx.shadowBlur = 0;
    };

    const drawShanghai = (cx: number, cy: number) => {
      // Sky
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + 50);
      grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Stars
      ctx.fillStyle = 'white';
      starsRef.current.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.beginPath(); ctx.arc(cx + s.x, cy + s.y, 1, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Skyline (Silhouette)
      const baseLine = cy + 50;
      ctx.fillStyle = '#020617';
      // Pearl Tower
      const towerX = cx + 40;
      // Stem
      ctx.fillRect(towerX - 5, baseLine - 180, 10, 180);
      // Base Sphere
      ctx.fillStyle = '#be123c'; ctx.beginPath(); ctx.arc(towerX, baseLine - 140, 15, 0, Math.PI*2); ctx.fill();
      // Top Sphere
      ctx.beginPath(); ctx.arc(towerX, baseLine - 60, 10, 0, Math.PI*2); ctx.fill();
      // Antenna
      ctx.fillStyle = '#e11d48'; ctx.fillRect(towerX - 1, baseLine - 220, 2, 40);

      // Other buildings
      ctx.fillStyle = '#1e1b4b'; // Dark blue buildings
      ctx.fillRect(cx - 100, baseLine - 100, 40, 100); // Jin Mao ish
      ctx.fillRect(cx - 140, baseLine - 60, 30, 60);
      ctx.fillRect(cx - 40, baseLine - 140, 35, 140); // Bottle opener ish
      
      // Building Lights
      ctx.fillStyle = '#fef3c7';
      for(let i=0; i<10; i++) {
        if(Math.random()>0.5) ctx.fillRect(cx - 90, baseLine - 90 + i*8, 2, 2);
        if(Math.random()>0.5) ctx.fillRect(cx - 30, baseLine - 130 + i*10, 2, 2);
      }

      // River
      const riverGrad = ctx.createLinearGradient(cx, baseLine, cx, cy + GLOBE_RADIUS);
      riverGrad.addColorStop(0, '#000000'); riverGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(cx - GLOBE_RADIUS, baseLine, GLOBE_RADIUS*2, GLOBE_RADIUS);

      // Boats
      boatsRef.current.forEach(b => {
         const bx = cx + b.x;
         const by = cy + b.y;
         // Reflection
         ctx.fillStyle = 'rgba(255,255,255,0.1)';
         ctx.fillRect(bx - 20, by + 5, 40, 10);
         // Hull
         ctx.fillStyle = b.type === 'CRUISE' ? '#e2e8f0' : '#78350f';
         ctx.beginPath(); ctx.moveTo(bx - 20, by); ctx.lineTo(bx + 20, by); ctx.lineTo(bx + 15, by + 10); ctx.lineTo(bx - 15, by + 10); ctx.fill();
         // Cabin
         ctx.fillStyle = b.type === 'CRUISE' ? '#3b82f6' : '#a16207';
         ctx.fillRect(bx - 10, by - 8, 20, 8);
         // Lights
         if (b.type === 'CRUISE') {
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(bx - 5, by - 4, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(bx + 5, by - 4, 1, 0, Math.PI*2); ctx.fill();
         }
      });
    };

    const drawCatMouse = (cx: number, cy: number) => {
      // Floor (Wood)
      ctx.fillStyle = '#d97706'; // Amber 600
      ctx.beginPath(); ctx.ellipse(cx, cy + 50, GLOBE_RADIUS-20, GLOBE_RADIUS * 0.4, 0, 0, Math.PI*2); ctx.fill();
      // Wall (Back)
      ctx.fillStyle = '#fef3c7'; // Cream
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS + 50);

      // Render Entities (Sort by Y)
      const entities = [
        { type: 'CAT', y: catRef.current.pos.y, data: catRef.current },
        ...miceRef.current.map(m => ({ type: 'MOUSE', y: m.pos.y, data: m }))
      ].sort((a,b) => a.y - b.y);

      entities.forEach(e => {
        if (e.type === 'CAT') {
          const cat = e.data as CatEntity;
          const kx = cx + cat.pos.x;
          const ky = cy + cat.pos.y;
          ctx.save(); ctx.translate(kx, ky);
          // Scale for facing
          if (Math.abs(cat.angle) > Math.PI/2) ctx.scale(-1, 1);
          
          // Body
          ctx.fillStyle = '#1f2937'; // Dark gray cat
          ctx.beginPath(); ctx.ellipse(0, -10, 20, 15, 0, 0, Math.PI*2); ctx.fill();
          // Head
          ctx.beginPath(); ctx.arc(15, -20, 12, 0, Math.PI*2); ctx.fill();
          // Ears
          ctx.beginPath(); ctx.moveTo(8, -28); ctx.lineTo(12, -38); ctx.lineTo(18, -30); ctx.fill();
          ctx.beginPath(); ctx.moveTo(18, -30); ctx.lineTo(24, -38); ctx.lineTo(26, -26); ctx.fill();
          // Tail
          ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(-30, -30, -20, -40); ctx.stroke();
          // Eyes
          ctx.fillStyle = '#bef264';
          ctx.beginPath(); ctx.arc(18, -22, 2, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        } else {
          const mouse = e.data as MouseEntity;
          const mx = cx + mouse.pos.x;
          const my = cy + mouse.pos.y;
          ctx.save();
          ctx.fillStyle = mouse.color;
          // Body
          ctx.beginPath(); ctx.ellipse(mx, my, 8, 5, 0, 0, Math.PI*2); ctx.fill();
          // Ears
          ctx.beginPath(); ctx.arc(mx - 3, my - 4, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(mx + 3, my - 4, 3, 0, Math.PI*2); ctx.fill();
          // Tail
          ctx.strokeStyle = 'pink'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(mx - 8, my); ctx.quadraticCurveTo(mx - 15, my - 5, mx - 18, my); ctx.stroke();
          ctx.restore();
        }
      });
    };

    const drawBirthday = (cx: number, cy: number) => {
      // Dark room
      ctx.fillStyle = '#270a15';
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Table
      ctx.fillStyle = '#9f1239'; // Cloth
      const tableY = cy + 80;
      ctx.beginPath(); ctx.ellipse(cx, tableY, 120, 40, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(cx - 120, tableY, 240, 100); // drape

      // Girl (behind cake)
      const gx = cx; const gy = tableY - 20;
      ctx.fillStyle = '#fce7f3'; // Dress
      ctx.beginPath(); ctx.moveTo(gx, gy - 80); ctx.lineTo(gx + 30, gy); ctx.lineTo(gx - 30, gy); ctx.fill();
      ctx.fillStyle = '#fde047'; // Hair
      ctx.beginPath(); ctx.arc(gx, gy - 90, 20, 0, Math.PI*2); ctx.fill(); // Head
      ctx.fillStyle = '#ffedd5'; // Skin
      ctx.beginPath(); ctx.arc(gx, gy - 85, 15, 0, Math.PI*2); ctx.fill(); 
      // Closed eyes (wishing)
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx - 5, gy - 85); ctx.lineTo(gx - 2, gy - 85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx + 2, gy - 85); ctx.lineTo(gx + 5, gy - 85); ctx.stroke();

      // Cake
      const cxk = cx; const cyk = tableY - 10;
      ctx.fillStyle = '#fff1f2'; // Icing
      ctx.beginPath(); ctx.ellipse(cxk, cyk, 50, 20, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(cxk - 50, cyk - 40, 100, 40);
      ctx.beginPath(); ctx.ellipse(cxk, cyk - 40, 50, 20, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fda4af'; // Decoration
      ctx.beginPath(); ctx.arc(cxk, cyk - 20, 10, 0, Math.PI*2); ctx.fill();

      // Candles
      candlesRef.current.forEach(c => {
        const canX = cxk + c.x;
        const canY = cyk - 40 + c.y;
        // Stick
        ctx.fillStyle = c.color; ctx.fillRect(canX - 2, canY, 4, 15);
        // Flame
        ctx.fillStyle = `rgba(255, 160, 0, ${c.flicker})`;
        ctx.beginPath(); ctx.ellipse(canX, canY, 4 * c.flicker, 8 * c.flicker, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.beginPath(); ctx.ellipse(canX, canY + 2, 2, 4, 0, 0, Math.PI*2); ctx.fill();
      });

      // Wish Particles
      ctx.fillStyle = '#fbbf24';
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(cxk + p.x, cyk - 80 + p.y, 2, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawChristmas = (cx: number, cy: number) => {
      // Background (Lighter, Vibrant Red)
      const grad = ctx.createRadialGradient(cx, cy, 100, cx, cy, GLOBE_RADIUS);
      grad.addColorStop(0, '#b91c1c'); // Red 700 (Lighter)
      grad.addColorStop(1, '#7f1d1d'); // Red 900
      ctx.fillStyle = grad;
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Removed Window Frame Shadow
      // Removed White Floor Area

      const drawGift = (g: Gift) => {
          const gx = cx + g.x; const gy = cy + g.y;
          // Shadow (on red background)
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.ellipse(gx, gy, g.width/1.8, g.width/4, 0, 0, Math.PI*2); ctx.fill();
          
          // Box
          ctx.fillStyle = g.color; 
          ctx.fillRect(gx - g.width/2, gy - g.height, g.width, g.height);
          
          // Shine/Gloss
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath(); ctx.moveTo(gx - g.width/2, gy - g.height); ctx.lineTo(gx, gy - g.height); ctx.lineTo(gx - g.width/2 + 10, gy); ctx.lineTo(gx - g.width/2, gy); ctx.fill();

          // Ribbon (Vertical)
          ctx.fillStyle = g.ribbonColor; 
          ctx.fillRect(gx - 4, gy - g.height, 8, g.height);
          // Ribbon (Horizontal)
          ctx.fillRect(gx - g.width/2, gy - g.height/2 - 4, g.width, 8);
          
          // Bow
          ctx.beginPath(); 
          ctx.moveTo(gx, gy - g.height); 
          ctx.quadraticCurveTo(gx - 10, gy - g.height - 10, gx - 10, gy - g.height); 
          ctx.quadraticCurveTo(gx - 10, gy - g.height + 10, gx, gy - g.height);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(gx, gy - g.height); 
          ctx.quadraticCurveTo(gx + 10, gy - g.height - 10, gx + 10, gy - g.height); 
          ctx.quadraticCurveTo(gx + 10, gy - g.height + 10, gx, gy - g.height);
          ctx.fill();
      };

      // Gifts (Behind Tree)
      giftsRef.current.filter(g => g.y < cy + 60).forEach(drawGift);

      // Tree (Even Larger & Majestic)
      const tx = cx; const ty = cy + 120;
      
      // Trunk
      ctx.fillStyle = '#271306'; // Dark Wood
      ctx.fillRect(tx - 25, ty, 50, 40);

      // Leaves (Bigger Dimensions)
      const layers = [
        { y: 0, w: 260, h: 140, c: '#064e3b' },
        { y: -60, w: 210, h: 130, c: '#065f46' },
        { y: -120, w: 160, h: 120, c: '#047857' },
        { y: -170, w: 110, h: 110, c: '#059669' },
        { y: -210, w: 70, h: 100, c: '#10b981' },
      ];

      layers.forEach(layer => {
          ctx.fillStyle = layer.c;
          const ly = ty + layer.y;
          ctx.beginPath();
          ctx.moveTo(tx - layer.w/2, ly);
          // Curve bottom
          ctx.quadraticCurveTo(tx, ly + 25, tx + layer.w/2, ly);
          // Sides to top
          ctx.lineTo(tx, ly - layer.h);
          ctx.fill();
          
          // Add some texture/shadow to layer
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath(); ctx.moveTo(tx, ly - layer.h); ctx.lineTo(tx, ly + 10); ctx.lineTo(tx + layer.w/2, ly); ctx.fill();
      });

      // Star (Glowing, higher up)
      ctx.shadowColor = '#fde047'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#fde047';
      const starY = ty - 320; // Moved higher for bigger tree
      ctx.beginPath(); 
      for(let i=0; i<5; i++) {
          ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*14 + tx, -Math.sin((18+i*72)/180*Math.PI)*14 + starY);
          ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*6 + tx, -Math.sin((54+i*72)/180*Math.PI)*6 + starY);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Lights (Bright and varied)
      christmasLightsRef.current.forEach(l => {
         const lx = tx + l.x;
         const ly = ty + l.y;
         const blink = Math.sin(Date.now() * 0.003 + l.phase);
         if (blink > -0.5) {
             const alpha = 0.6 + blink * 0.4;
             ctx.globalAlpha = alpha;
             ctx.fillStyle = l.color;
             ctx.shadowColor = l.color; ctx.shadowBlur = 15;
             ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2); ctx.fill();
             // Sparkle cross
             if (blink > 0.8) {
                ctx.lineWidth = 1; ctx.strokeStyle = 'white';
                ctx.beginPath(); ctx.moveTo(lx - 4, ly); ctx.lineTo(lx + 4, ly); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx, ly + 4); ctx.stroke();
             }
             ctx.shadowBlur = 0;
             ctx.globalAlpha = 1;
         }
      });

      // Gifts (Front)
      giftsRef.current.filter(g => g.y >= cy + 60).forEach(drawGift);

      // Gold Particles / Magic Dust
      const time = Date.now();
      ctx.fillStyle = '#fbbf24';
      for(let i=0; i<20; i++) {
         const px = cx + Math.sin(time * 0.0005 + i) * 150;
         const py = cy + Math.cos(time * 0.0003 + i * 2) * 150;
         const pSize = (Math.sin(time * 0.005 + i) + 1) * 1.5;
         ctx.globalAlpha = 0.6;
         ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      drawSnow(cx, cy);
    };

    const drawWedding = (cx: number, cy: number) => {
      // Background: Romantic Pink Gradient
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      grad.addColorStop(0, '#fecaca'); // Rose 200
      grad.addColorStop(1, '#be185d'); // Pink 700
      ctx.fillStyle = grad;
      ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);

      // Floor
      ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 30, GLOBE_RADIUS * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff1f2'; ctx.fill();

      // Floral Arch (Scaled UP)
      const archScale = 1.3;
      const archY = cy + 20;
      
      ctx.lineWidth = 18; ctx.strokeStyle = '#2f855a'; // Green
      ctx.beginPath(); ctx.arc(cx, archY, 90 * archScale, Math.PI, 0); ctx.stroke();
      
      // Flowers on arch
      for (let i = 0; i < 14; i++) {
         const ang = Math.PI + (i/13) * Math.PI;
         const fx = cx + Math.cos(ang) * 90 * archScale;
         const fy = archY + Math.sin(ang) * 90 * archScale;
         ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fff';
         ctx.beginPath(); ctx.arc(fx, fy, 12, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI*2); ctx.fillStyle = '#fde047'; ctx.fill();
      }

      // Characters Scale
      const charScale = 1.4;
      const charY = cy + 60; // Moved down slightly to ground

      // Groom (Left)
      const groomX = cx - 35; 
      
      // Suit
      ctx.fillStyle = '#1e293b'; 
      ctx.fillRect(groomX - 10 * charScale, charY - 40 * charScale, 20 * charScale, 40 * charScale);
      // Legs
      ctx.fillRect(groomX - 10 * charScale, charY, 8 * charScale, 25 * charScale); 
      ctx.fillRect(groomX + 2 * charScale, charY, 8 * charScale, 25 * charScale);
      // Head
      ctx.fillStyle = '#fde68a'; 
      ctx.beginPath(); ctx.arc(groomX, charY - 48 * charScale, 10 * charScale, 0, Math.PI*2); ctx.fill();
      // Smile
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(groomX, charY - 48 * charScale, 6 * charScale, 0.2, Math.PI - 0.2); ctx.stroke();

      // Bride (Right)
      const brideX = cx + 35; 
      
      // Dress
      ctx.fillStyle = '#fff'; 
      ctx.beginPath(); 
      ctx.moveTo(brideX, charY - 40 * charScale); 
      ctx.lineTo(brideX - 20 * charScale, charY + 25 * charScale); 
      ctx.lineTo(brideX + 20 * charScale, charY + 25 * charScale); 
      ctx.fill();
      // Head
      ctx.fillStyle = '#fde68a'; 
      ctx.beginPath(); ctx.arc(brideX, charY - 48 * charScale, 10 * charScale, 0, Math.PI*2); ctx.fill();
      // Smile
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(brideX, charY - 48 * charScale, 6 * charScale, 0.2, Math.PI - 0.2); ctx.stroke();
      
      // Veil
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; 
      ctx.beginPath(); 
      ctx.arc(brideX, charY - 48 * charScale, 12 * charScale, Math.PI, 0); 
      ctx.lineTo(brideX + 15 * charScale, charY + 10 * charScale); 
      ctx.lineTo(brideX - 15 * charScale, charY + 10 * charScale); 
      ctx.fill();

      // Confetti
      confettiRef.current.forEach(c => {
         ctx.fillStyle = c.color;
         ctx.beginPath(); ctx.arc(cx + c.x, cy + c.y, 3, 0, Math.PI*2); ctx.fill();
      });
    };

    const drawEgypt = (cx: number, cy: number) => {
      // Sky: Sunset
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + 50);
      grad.addColorStop(0, '#1e3a8a'); // Blue
      grad.addColorStop(0.6, '#c2410c'); // Orange
      grad.addColorStop(1, '#fde047'); // Yellow
      ctx.fillStyle = grad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Massive Pyramids in Background/Midground (Scaled UP)
      const drawPyramid = (px: number, py: number, sz: number, color: string) => {
         ctx.fillStyle = color;
         ctx.beginPath(); ctx.moveTo(px, py - sz); ctx.lineTo(px + sz * 1.2, py); ctx.lineTo(px - sz * 1.2, py); ctx.fill();
         // Shade side (right half)
         ctx.fillStyle = 'rgba(0,0,0,0.15)';
         ctx.beginPath(); ctx.moveTo(px, py - sz); ctx.lineTo(px, py); ctx.lineTo(px + sz * 1.2, py); ctx.fill();
      };
      // Back pyramid
      drawPyramid(cx + 80, cy + 80, 140, '#b45309');
      // Front pyramid
      drawPyramid(cx - 60, cy + 100, 160, '#d97706');

      // Sand Dunes
      ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 10, GLOBE_RADIUS * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24'; ctx.fill();

      // Camels (Smaller, in distance)
      camelsRef.current.forEach(c => {
        const camelX = cx + c.x;
        const camelY = cy + c.y;
        
        ctx.save(); 
        ctx.translate(camelX, camelY); 
        ctx.scale(c.scale, c.scale);
        
        ctx.fillStyle = '#553008'; // Darker Brown silhouette feel
        
        // Legs (animated roughly by x position phase)
        const legSwing = Math.sin(c.x * 0.1) * 5;
        ctx.fillRect(-15 + legSwing, 0, 4, 15); 
        ctx.fillRect(-5 - legSwing, 0, 4, 15); 
        ctx.fillRect(5 + legSwing, 0, 4, 15); 
        ctx.fillRect(15 - legSwing, 0, 4, 15);
        
        // Body
        ctx.beginPath(); ctx.ellipse(0, -5, 20, 10, 0, 0, Math.PI*2); ctx.fill();
        // Humps
        ctx.beginPath(); ctx.arc(-8, -15, 6, 0, Math.PI*2); ctx.arc(8, -15, 6, 0, Math.PI*2); ctx.fill();
        // Neck & Head
        ctx.lineWidth = 4; ctx.strokeStyle = '#553008';
        ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(25, -20); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(25, -22, 5, 3, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.restore();
      });
    };

    const drawCityNight = (cx: number, cy: number) => {
      // Dark Sky
      const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy);
      grad.addColorStop(0, '#020617'); grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS*2, GLOBE_RADIUS*2);

      // Skyscrapers 2.5D
      const perspectiveOffset = 15; // Depth
      
      // Sort by distance (conceptually, draw back to front is safer but here just by array order is fine if init logic places them right)
      // Actually, we should sort by Y or just simple loop since they are roughly on same plane
      
      skyscrapersRef.current.forEach(s => {
         const sx = cx + s.x;
         const sy = cy + 80;
         
         const bodyColor = '#172554'; // Dark Blue 950
         const sideColor = '#0f172a'; // Slate 900
         
         // Side Face (Perspective)
         ctx.fillStyle = sideColor;
         ctx.beginPath();
         ctx.moveTo(sx + s.width, sy - s.height);
         ctx.lineTo(sx + s.width + perspectiveOffset, sy - s.height - perspectiveOffset * 0.5);
         ctx.lineTo(sx + s.width + perspectiveOffset, sy - perspectiveOffset * 0.5);
         ctx.lineTo(sx + s.width, sy);
         ctx.fill();

         // Roof Face
         ctx.fillStyle = '#1e3a8a';
         ctx.beginPath();
         ctx.moveTo(sx, sy - s.height);
         ctx.lineTo(sx + s.width, sy - s.height);
         ctx.lineTo(sx + s.width + perspectiveOffset, sy - s.height - perspectiveOffset * 0.5);
         ctx.lineTo(sx + perspectiveOffset, sy - s.height - perspectiveOffset * 0.5);
         ctx.fill();

         // Front Face
         ctx.fillStyle = bodyColor;
         ctx.fillRect(sx, sy - s.height, s.width, s.height);

         // Golden Windows
         // Use a glowing effect
         ctx.shadowColor = '#f59e0b';
         ctx.shadowBlur = 5;

         const cols = 3;
         const winW = (s.width - 10) / cols;
         const winH = 8;
         let winIdx = 0;
         for(let y = sy - s.height + 5; y < sy - 5; y += 14) {
            for(let x = sx + 2; x < sx + s.width - 2; x += winW + 2) {
                if (s.windows[winIdx % s.windows.length]) {
                   // Gold/Amber variety
                   ctx.fillStyle = Math.random() > 0.1 ? '#fbbf24' : '#fef3c7';
                   ctx.fillRect(x, y, winW, winH);
                }
                winIdx++;
            }
         }
         ctx.shadowBlur = 0; // Reset
      });

      // Road
      const roadY = cy + 100;
      // 3D Road Perspective
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx - GLOBE_RADIUS, roadY);
      ctx.lineTo(cx + GLOBE_RADIUS, roadY);
      ctx.lineTo(cx + GLOBE_RADIUS + 40, roadY + 60);
      ctx.lineTo(cx - GLOBE_RADIUS - 40, roadY + 60);
      ctx.fill();

      // Cars
      cityCarsRef.current.forEach(c => {
         const carX = cx + c.x;
         const carY = cy + c.y;
         
         ctx.fillStyle = c.color;
         // Draw light streak effect (Glow)
         ctx.shadowColor = c.color; ctx.shadowBlur = 15;
         
         // Car body
         ctx.fillRect(carX, carY, 24, 8);
         
         // Light cone direction
         ctx.globalAlpha = 0.3;
         ctx.beginPath();
         if (c.type === 'HEADLIGHT') {
             ctx.moveTo(carX + 24, carY + 2);
             ctx.lineTo(carX + 60, carY - 5);
             ctx.lineTo(carX + 60, carY + 15);
             ctx.lineTo(carX + 24, carY + 6);
         } else {
             // Taillight streak trail behind
             ctx.moveTo(carX, carY + 2);
             ctx.lineTo(carX - 40, carY + 2);
             ctx.lineTo(carX - 40, carY + 6);
             ctx.lineTo(carX, carY + 6);
         }
         ctx.fill();
         ctx.globalAlpha = 1;
         ctx.shadowBlur = 0;
      });
    };

    const drawCustom = (cx: number, cy: number) => {
      // 1. Background
      if (customConfig?.backgroundColor) {
        ctx.fillStyle = customConfig.backgroundColor;
        ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
        
        // Add a slight gradient overlay to make it look round
        const overlayGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, GLOBE_RADIUS);
        overlayGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        overlayGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
      } else {
        // Fallback default
        const grad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
        grad.addColorStop(0, '#0f172a'); 
        grad.addColorStop(1, '#312e81'); 
        ctx.fillStyle = grad;
        ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
      }

      // 2. Render Elements
      // Static Elements (Trees)
      if (customConfig?.forest) {
         // Floor for forest
         ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 20, GLOBE_RADIUS * 0.35, 0, 0, Math.PI * 2);
         ctx.fillStyle = 'rgba(20, 83, 45, 0.8)'; // Greenish floor
         ctx.fill();

         plantsRef.current.forEach(p => {
             const px = cx + p.x; const py = cy + p.y;
             ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px, py, 15, 5, 0, 0, Math.PI*2); ctx.fill();
             if (p.type === 'TREE') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(px - 4, py - p.height, 8, p.height);
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py - p.height, 25, 0, Math.PI * 2);
                ctx.arc(px - 15, py - p.height + 10, 20, 0, Math.PI * 2); ctx.arc(px + 15, py - p.height + 10, 20, 0, Math.PI * 2); ctx.fill();
             }
         });
      } else {
         // Default Floor
         ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 20, GLOBE_RADIUS * 0.35, 0, 0, Math.PI * 2);
         ctx.fillStyle = 'rgba(30, 41, 59, 0.8)'; // Slate floor
         ctx.fill();
      }

      if (customConfig?.christmasTree) {
         // Draw simplified Christmas tree reusing parts of drawChristmas
         const tx = cx; const ty = cy + 80;
         // Trunk
         ctx.fillStyle = '#271306'; ctx.fillRect(tx - 20, ty, 40, 40);
         // Leaves
         const layers = [
            { y: 0, w: 220, h: 120, c: '#064e3b' },
            { y: -60, w: 180, h: 110, c: '#065f46' },
            { y: -120, w: 140, h: 100, c: '#047857' },
            { y: -170, w: 100, h: 90, c: '#059669' },
            { y: -210, w: 60, h: 80, c: '#10b981' },
         ];
         layers.forEach(layer => {
              ctx.fillStyle = layer.c;
              const ly = ty + layer.y;
              ctx.beginPath(); ctx.moveTo(tx - layer.w/2, ly); ctx.quadraticCurveTo(tx, ly + 20, tx + layer.w/2, ly); ctx.lineTo(tx, ly - layer.h); ctx.fill();
         });
         // Star
         ctx.shadowColor = '#fde047'; ctx.shadowBlur = 20; ctx.fillStyle = '#fde047';
         const starY = ty - 300;
         ctx.beginPath(); 
         for(let i=0; i<5; i++) {
             ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*12 + tx, -Math.sin((18+i*72)/180*Math.PI)*12 + starY);
             ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*5 + tx, -Math.sin((54+i*72)/180*Math.PI)*5 + starY);
         }
         ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
         // Lights
         christmasLightsRef.current.forEach(l => {
            const lx = tx + l.x; const ly = ty + l.y;
            const blink = Math.sin(Date.now() * 0.003 + l.phase);
            if (blink > -0.5) {
                ctx.globalAlpha = 0.6 + blink * 0.4;
                ctx.fillStyle = l.color; ctx.shadowColor = l.color; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            }
         });
      }

      // Active Elements (People, Cats)
      if (customConfig?.people) {
         const renderList = peopleRef.current.map(p => ({ type: 'person' as const, y: p.pos.y, data: p })).sort((a,b) => a.y - b.y);
         renderList.forEach(item => drawPerson(ctx, item.data as Person, cx, cy));
      }

      if (customConfig?.cat) {
        // Draw cat entity
        const cat = catRef.current;
        const kx = cx + cat.pos.x; const ky = cy + cat.pos.y;
        ctx.save(); ctx.translate(kx, ky);
        if (Math.abs(cat.angle) > Math.PI/2) ctx.scale(-1, 1);
        ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.ellipse(0, -10, 20, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -20, 12, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8, -28); ctx.lineTo(12, -38); ctx.lineTo(18, -30); ctx.fill();
        ctx.beginPath(); ctx.moveTo(18, -30); ctx.lineTo(24, -38); ctx.lineTo(26, -26); ctx.fill();
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(-30, -30, -20, -40); ctx.stroke();
        ctx.fillStyle = '#bef264'; ctx.beginPath(); ctx.arc(18, -22, 2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // Weather
      if (customConfig?.rain) {
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)'; ctx.lineWidth = 1;
        rainRef.current.forEach(r => { ctx.beginPath(); ctx.moveTo(cx + r.x, cy + r.y); ctx.lineTo(cx + r.x, cy + r.y + r.length); ctx.stroke(); });
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ripplesRef.current.forEach(r => { ctx.globalAlpha = r.opacity; ctx.beginPath(); ctx.ellipse(cx + r.x, cy + r.y, r.radius, r.radius * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      if (customConfig?.sakura) {
        ctx.fillStyle = '#fce7f3';
        petalsRef.current.forEach(p => { ctx.save(); ctx.translate(cx + p.x, cy + p.y); ctx.rotate(p.angle); ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
      }
      if (customConfig?.snow) {
         drawSnow(cx, cy);
      }
    };

    // --- RENDER LOOP ---

    const renderLoop = () => {
      // 1. Update
      if (currentScene === 'WINTER') updateWinter();
      else if (currentScene === 'RAIN') updateRain();
      else if (currentScene === 'FISH') updateFish();
      else if (currentScene === 'SAKURA') updateSakura();
      else if (currentScene === 'CAROUSEL') updateCarousel();
      else if (currentScene === 'SHANGHAI') updateShanghai();
      else if (currentScene === 'CAT_MOUSE') updateCatMouse();
      else if (currentScene === 'BIRTHDAY') updateBirthday();
      else if (currentScene === 'CHRISTMAS') updateChristmas();
      else if (currentScene === 'WEDDING') updateWedding();
      else if (currentScene === 'EGYPT') updateEgypt();
      else if (currentScene === 'CITY_NIGHT') updateCityNight();
      else if (currentScene === 'FISHERMAN') updateFisherman();
      else if (currentScene === 'BAMBOO') updateBamboo();
      else if (currentScene === 'JELLYFISH') updateJellyfish();
      else if (currentScene === 'CUSTOM') updateCustom();

      // 2. Draw
      clear(canvas.width/2, canvas.height/2);
      const cx = canvas.width/2;
      const cy = canvas.height/2;

      if (currentScene === 'WINTER') drawWinter(cx, cy);
      else if (currentScene === 'RAIN') drawRain(cx, cy);
      else if (currentScene === 'FISH') drawFish(cx, cy);
      else if (currentScene === 'SAKURA') drawSakura(cx, cy);
      else if (currentScene === 'CAROUSEL') drawCarousel(cx, cy);
      else if (currentScene === 'SHANGHAI') drawShanghai(cx, cy);
      else if (currentScene === 'CAT_MOUSE') drawCatMouse(cx, cy);
      else if (currentScene === 'BIRTHDAY') drawBirthday(cx, cy);
      else if (currentScene === 'CHRISTMAS') drawChristmas(cx, cy);
      else if (currentScene === 'WEDDING') drawWedding(cx, cy);
      else if (currentScene === 'EGYPT') drawEgypt(cx, cy);
      else if (currentScene === 'CITY_NIGHT') drawCityNight(cx, cy);
      else if (currentScene === 'FISHERMAN') drawFisherman(cx, cy);
      else if (currentScene === 'BAMBOO') drawBamboo(cx, cy);
      else if (currentScene === 'JELLYFISH') drawJellyfish(cx, cy);
      else if (currentScene === 'CUSTOM') drawCustom(cx, cy);

      ctx.restore(); // Restore clip

      // 3. Overlays (Glass)
      // Inner Shine
      const shineGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath(); ctx.arc(cx, cy, GLOBE_RADIUS, 0, Math.PI * 2); ctx.fillStyle = shineGrad; ctx.fill();
      // Specular
      ctx.beginPath(); ctx.ellipse(cx - GLOBE_RADIUS * 0.4, cy - GLOBE_RADIUS * 0.4, 60, 30, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.fill();
      // Rim
      ctx.beginPath(); ctx.arc(cx, cy, GLOBE_RADIUS, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      const rimGrad = ctx.createLinearGradient(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, cx + GLOBE_RADIUS, cy + GLOBE_RADIUS);
      rimGrad.addColorStop(0, 'rgba(255,255,255,0.6)'); rimGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)'); rimGrad.addColorStop(1, 'rgba(255,255,255,0.4)');
      ctx.strokeStyle = rimGrad; ctx.stroke();
      
      // Base
      const baseY = cy + GLOBE_RADIUS - 10; 
      const baseWidth = GLOBE_RADIUS * 1.4; 
      const baseHeight = 60;
      
      // Custom Base Color support
      if (currentScene === 'CUSTOM' && customConfig?.baseColor) {
         const baseGrad = ctx.createLinearGradient(cx - baseWidth/2, baseY, cx + baseWidth/2, baseY);
         baseGrad.addColorStop(0, customConfig.baseColor); 
         baseGrad.addColorStop(1, customConfig.baseColor);
         ctx.beginPath(); ctx.moveTo(cx - baseWidth * 0.4, baseY); ctx.lineTo(cx + baseWidth * 0.4, baseY);
         ctx.lineTo(cx + baseWidth * 0.5, baseY + baseHeight); ctx.lineTo(cx - baseWidth * 0.5, baseY + baseHeight);
         ctx.closePath(); ctx.fillStyle = baseGrad; ctx.fill();
         // Shade overlay for base to make it look 3D
         const shadeGrad = ctx.createLinearGradient(cx - baseWidth/2, baseY, cx + baseWidth/2, baseY);
         shadeGrad.addColorStop(0, 'rgba(0,0,0,0.6)'); shadeGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)'); shadeGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
         ctx.fillStyle = shadeGrad; ctx.fill();
      } else {
         const baseGrad = ctx.createLinearGradient(cx - baseWidth/2, baseY, cx + baseWidth/2, baseY);
         baseGrad.addColorStop(0, '#78350f'); baseGrad.addColorStop(0.5, '#b45309'); baseGrad.addColorStop(1, '#78350f');
         ctx.beginPath(); ctx.moveTo(cx - baseWidth * 0.4, baseY); ctx.lineTo(cx + baseWidth * 0.4, baseY);
         ctx.lineTo(cx + baseWidth * 0.5, baseY + baseHeight); ctx.lineTo(cx - baseWidth * 0.5, baseY + baseHeight);
         ctx.closePath(); ctx.fillStyle = baseGrad; ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();

      // Engraved Text on Base
      if (currentScene === 'CUSTOM' && customConfig?.textColor) {
         ctx.fillStyle = customConfig.textColor;
      } else {
         ctx.fillStyle = '#fbbf24'; // Gold
      }
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.font = '20px "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText(message, cx, baseY + 35);
      ctx.shadowBlur = 0; // Reset

      frameIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [currentScene, message, customConfig]); 

  return (
    <div ref={containerRef} className="relative flex items-center justify-center p-8">
      <canvas
        ref={canvasRef}
        width={GLOBE_RADIUS * 2 + 100}
        height={GLOBE_RADIUS * 2 + 100}
        style={{ width: GLOBE_RADIUS * 2 + 'px', height: GLOBE_RADIUS * 2 + 'px' }}
      />
    </div>
  );
});

export default SnowGlobe;