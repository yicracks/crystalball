import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  SceneType, Vector2, 
  Person, PersonState, Snowman, Snowflake, // Winter
  RainDrop, Ripple, Plant, // Rain
  FishEntity, Bubble, // Fish
  Petal, // Sakura
  CarouselHorse, CarouselLight, // Carousel
  Boat, Star, // Shanghai
  CatEntity, MouseEntity, // Cat Mouse
  Candle, WishParticle // Birthday
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
}

const SnowGlobe = forwardRef<SnowGlobeHandle, SnowGlobeProps>(({ currentScene, message }, ref) => {
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


  // --- EXPOSE CAPTURE METHOD ---
  useImperativeHandle(ref, () => ({
    captureVideo: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `magic-globe-${currentScene.toLowerCase()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();

      // Record for 5 seconds (approx one loop of carousel/animation)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      recorder.stop();
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
    // Reset Logic based on scene
    if (currentScene === 'WINTER') {
      snowRef.current = Array.from({ length: SNOW_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2.2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2.2,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        wind: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5 + 0.3,
      }));

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
    }

    if (currentScene === 'RAIN') {
      rainRef.current = Array.from({ length: RAIN_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        speed: Math.random() * 10 + 10,
        length: Math.random() * 10 + 5,
      }));
      ripplesRef.current = [];
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
    }

    if (currentScene === 'FISH') {
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
    }

    if (currentScene === 'SAKURA') {
      petalsRef.current = Array.from({ length: PETAL_COUNT }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 2,
        size: Math.random() * 3 + 2,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 + 0.5,
        angle: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 0.1,
      }));
      swingAngleRef.current = 0;
    }

    if (currentScene === 'CAROUSEL') {
      horsesRef.current = Array.from({ length: HORSE_COUNT }).map((_, i) => ({
        angle: (i / HORSE_COUNT) * Math.PI * 2,
        yOffset: 0,
        color: ['#fca5a5', '#93c5fd', '#86efac', '#fde047'][i%4]
      }));
      carouselLightsRef.current = Array.from({ length: 16 }).map((_, i) => ({
        angle: (i / 16) * Math.PI * 2,
        isOn: i % 2 === 0
      }));
      carouselRotationRef.current = 0;
    }

    if (currentScene === 'SHANGHAI') {
      boatsRef.current = [
        { x: -100, y: GROUND_Y_OFFSET + 20, speed: 0.5, direction: 1, type: 'CRUISE' },
        { x: 100, y: GROUND_Y_OFFSET + 40, speed: 0.3, direction: -1, type: 'CARGO' }
      ];
      starsRef.current = Array.from({ length: 50 }).map(() => ({
        x: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8,
        y: (Math.random() - 0.5) * GLOBE_RADIUS * 1.8 - 50, // Top half
        opacity: Math.random()
      }));
    }

    if (currentScene === 'CAT_MOUSE') {
      catRef.current = { pos: {x: 0, y: GROUND_Y_OFFSET - 20}, state: 'IDLE', timer: 0, targetMouseId: null, angle: 0 };
      miceRef.current = [];
      nextMouseIdRef.current = 0;
      // Spawn initial mice
      for(let i=0; i<3; i++) {
        miceRef.current.push({
          id: nextMouseIdRef.current++,
          pos: getRandomPosInGlobe(),
          velocity: {x:0, y:0},
          color: '#d4d4d8',
          panic: false
        });
      }
    }

    if (currentScene === 'BIRTHDAY') {
      candlesRef.current = [
        { x: -10, y: -20, flicker: 1, color: '#f87171' },
        { x: 0, y: -20, flicker: 1, color: '#60a5fa' },
        { x: 10, y: -20, flicker: 1, color: '#fbbf24' }
      ];
      particlesRef.current = [];
    }

  }, [currentScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- UPDATE FUNCTIONS ---

    const updateWinter = () => {
      snowRef.current.forEach(flake => {
        flake.y += flake.speed;
        flake.x += flake.wind;
        if (flake.y > GLOBE_RADIUS || Math.abs(flake.x) > GLOBE_RADIUS) {
          flake.y = -GLOBE_RADIUS;
          flake.x = (Math.random() - 0.5) * GLOBE_RADIUS * 2;
        }
      });
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
           } else if (rand < 0.85 && snowmenRef.current.length < MAX_SNOWMEN) {
             let s = snowmenRef.current.find(s => !s.isComplete && s.health > 0);
             if (!s) {
               s = { id: Date.now() + Math.random(), pos: getRandomPosInGlobe(), progress: 0, health: 1, isComplete: false };
               snowmenRef.current.push(s);
             }
             person.state = PersonState.WALKING;
             person.target = { x: s.pos.x + 15, y: s.pos.y };
             person.targetEntityId = s.id;
           } else {
             person.state = PersonState.FIGHTING;
             person.stateTimer = 60;
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
        for (const p of plantsRef.current) {
          const dx = drop.x - p.x;
          if (Math.abs(dx) < p.width / 2) {
            const topY = p.y - p.height; 
            if (drop.y >= topY && drop.y <= topY + 10) { hit = true; hitY = topY; break; }
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
      if (Math.random() > 0.9) {
        carouselLightsRef.current.forEach(l => l.isOn = !l.isOn);
      }
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
      if (miceRef.current.length < 5 && Math.random() < 0.01) {
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

    const drawWinter = (cx: number, cy: number) => {
      const skyGrad = ctx.createLinearGradient(cx, cy - GLOBE_RADIUS, cx, cy + GLOBE_RADIUS);
      skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);
      ctx.beginPath(); ctx.ellipse(cx, cy + GROUND_Y_OFFSET, GLOBE_RADIUS - 20, GLOBE_RADIUS * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9'; ctx.fill();
      const renderList = [...peopleRef.current.map(p => ({ type: 'person' as const, y: p.pos.y, data: p })), ...snowmenRef.current.map(s => ({ type: 'snowman' as const, y: s.pos.y, data: s }))];
      renderList.sort((a, b) => a.y - b.y);
      renderList.forEach(item => { if (item.type === 'person') drawPerson(ctx, item.data as Person, cx, cy); else drawSnowman(ctx, item.data as Snowman, cx, cy); });
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      snowRef.current.forEach(flake => { ctx.globalAlpha = flake.opacity; ctx.beginPath(); ctx.arc(cx + flake.x, cy + flake.y, flake.radius, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1.0;
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
      grad.addColorStop(0, '#4c1d95'); grad.addColorStop(1, '#2e1065');
      ctx.fillStyle = grad; ctx.fillRect(cx - GLOBE_RADIUS, cy - GLOBE_RADIUS, GLOBE_RADIUS * 2, GLOBE_RADIUS * 2);

      const baseY = cy + 100;
      const carouselWidth = 180;
      const carouselHeight = 40;

      // Draw Floor (Back)
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath(); ctx.ellipse(cx, baseY, carouselWidth, carouselHeight, 0, Math.PI, 0); ctx.fill(); // Top half only? No full
      ctx.beginPath(); ctx.ellipse(cx, baseY, carouselWidth, carouselHeight, 0, 0, Math.PI * 2); ctx.fill();
      
      // Central Pole
      ctx.fillStyle = '#fbbf24'; // Gold
      ctx.fillRect(cx - 10, baseY - 180, 20, 180);

      // Sort horses (Back horses first)
      const horses = [...horsesRef.current].map(h => ({
        ...h,
        displayAngle: (h.angle + carouselRotationRef.current) % (Math.PI * 2)
      })).sort((a, b) => Math.sin(a.displayAngle) - Math.sin(b.displayAngle));

      horses.forEach(h => {
        const rad = carouselWidth - 20;
        const hx = cx + Math.cos(h.displayAngle) * rad;
        const hy = baseY + Math.sin(h.displayAngle) * (carouselHeight - 10) - 20 + h.yOffset;
        
        // Scale based on depth
        const scale = 0.8 + (Math.sin(h.displayAngle) + 1) * 0.2;
        
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale, scale);
        
        // Pole
        ctx.fillStyle = '#d4d4d4';
        ctx.fillRect(-2, -60, 4, 100);

        // Horse Body
        ctx.fillStyle = h.color;
        ctx.beginPath(); ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI*2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.ellipse(15, -10, 8, 5, -0.5, 0, Math.PI*2); ctx.fill();
        // Legs
        ctx.lineWidth=2; ctx.strokeStyle=h.color;
        ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-15, 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(15, 15); ctx.stroke();

        ctx.restore();
      });

      // Roof (Cone)
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(cx - carouselWidth - 10, baseY - 160);
      ctx.lineTo(cx + carouselWidth + 10, baseY - 160);
      ctx.lineTo(cx, baseY - 280);
      ctx.fill();
      
      // Lights on roof edge
      carouselLightsRef.current.forEach(l => {
        const lx = cx + Math.cos(l.angle) * (carouselWidth + 5);
        const ly = baseY - 160 + Math.sin(l.angle) * 10;
        // Only draw front lights or all? All is fine
        ctx.fillStyle = l.isOn ? '#fef08a' : '#713f12';
        ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
        if (l.isOn) {
           ctx.shadowBlur = 10; ctx.shadowColor = 'white'; ctx.fill(); ctx.shadowBlur = 0;
        }
      });
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
      const baseGrad = ctx.createLinearGradient(cx - baseWidth/2, baseY, cx + baseWidth/2, baseY);
      baseGrad.addColorStop(0, '#78350f'); baseGrad.addColorStop(0.5, '#b45309'); baseGrad.addColorStop(1, '#78350f');
      ctx.beginPath(); ctx.moveTo(cx - baseWidth * 0.4, baseY); ctx.lineTo(cx + baseWidth * 0.4, baseY);
      ctx.lineTo(cx + baseWidth * 0.5, baseY + baseHeight); ctx.lineTo(cx - baseWidth * 0.5, baseY + baseHeight);
      ctx.closePath(); ctx.fillStyle = baseGrad; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();

      // Engraved Text on Base
      ctx.fillStyle = '#fbbf24'; // Gold
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
  }, [currentScene, message]); // Add message to dependency array to update text immediately

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