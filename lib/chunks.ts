import { CHUNK_LENGTH, LANE_RADIUS } from "./constants";

export type ObstacleKind = "jellyfish" | "urchin" | "net" | "predator";
export type PickupKind = "pearl" | "oxygen" | "shield" | "magnet" | "speed";

export interface SpawnItem {
  id: string;
  isObstacle: boolean;
  kind: ObstacleKind | PickupKind;
  x: number;
  z: number;
  yOffset: number; // dentro del chunk, 0..CHUNK_LENGTH
  seed: number;
}

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `e${uidCounter}`;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pearlArc(count: number, yStart: number, radius: number, startAngle: number, sweep: number): SpawnItem[] {
  const items: SpawnItem[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const angle = startAngle + sweep * t;
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "pearl",
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      yOffset: yStart + t * CHUNK_LENGTH * 0.7,
      seed: Math.random(),
    });
  }
  return items;
}

// Anillo de obstáculos con un hueco seguro por el que pasar.
function templateRingGap(difficulty: number, kind: ObstacleKind): SpawnItem[] {
  const count = Math.min(7, 4 + Math.floor(difficulty * 3));
  const gapIndex = Math.floor(rand(0, count));
  const gapWidth = Math.max(1.3, 2.2 - difficulty * 0.7);
  const items: SpawnItem[] = [];
  for (let i = 0; i < count; i++) {
    if (i === gapIndex) continue;
    const angle = (i / count) * Math.PI * 2;
    items.push({
      id: uid(),
      isObstacle: true,
      kind,
      x: Math.cos(angle) * LANE_RADIUS * 0.75,
      z: Math.sin(angle) * LANE_RADIUS * 0.75,
      yOffset: CHUNK_LENGTH * 0.5,
      seed: Math.random(),
    });
  }
  const gapAngle = (gapIndex / count) * Math.PI * 2;
  items.push({
    id: uid(),
    isObstacle: false,
    kind: "pearl",
    x: Math.cos(gapAngle) * LANE_RADIUS * 0.75,
    z: Math.sin(gapAngle) * LANE_RADIUS * 0.75,
    yOffset: CHUNK_LENGTH * 0.5,
    seed: Math.random(),
  });
  void gapWidth;
  return items;
}

// Pared en zigzag: hay que serpentear de un lado a otro.
function templateZigzag(difficulty: number, kind: ObstacleKind): SpawnItem[] {
  const rows = 3;
  const items: SpawnItem[] = [];
  let side = Math.random() > 0.5 ? 1 : -1;
  for (let r = 0; r < rows; r++) {
    const yOffset = (r / rows) * CHUNK_LENGTH;
    const spread = Math.max(1.6, LANE_RADIUS - difficulty * 0.5);
    items.push({
      id: uid(),
      isObstacle: true,
      kind,
      x: side * spread,
      z: rand(-1, 1),
      yOffset,
      seed: Math.random(),
    });
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "pearl",
      x: -side * spread * 0.6,
      z: rand(-0.5, 0.5),
      yOffset,
      seed: Math.random(),
    });
    side *= -1;
  }
  return items;
}

// Cortina de red con un hueco, cruzando casi todo el disco.
function templateNetCurtain(difficulty: number): SpawnItem[] {
  const segments = 5;
  const gapIndex = Math.floor(rand(0, segments));
  const items: SpawnItem[] = [];
  for (let i = 0; i < segments; i++) {
    if (i === gapIndex) continue;
    const x = (i / (segments - 1) - 0.5) * LANE_RADIUS * 2;
    items.push({
      id: uid(),
      isObstacle: true,
      kind: "net",
      x,
      z: 0,
      yOffset: CHUNK_LENGTH * 0.5,
      seed: Math.random(),
    });
  }
  void difficulty;
  return items;
}

// Zona de respiro: solo perlas en espiral, sin obstáculos. Recompensa tras un tramo duro.
function templateBreather(): SpawnItem[] {
  return pearlArc(6, 0, LANE_RADIUS * 0.55, 0, Math.PI * 2.4);
}

function templatePowerup(kind: PickupKind): SpawnItem[] {
  const items: SpawnItem[] = [
    {
      id: uid(),
      isObstacle: false,
      kind,
      x: 0,
      z: 0,
      yOffset: CHUNK_LENGTH * 0.5,
      seed: Math.random(),
    },
  ];
  return items.concat(pearlArc(4, CHUNK_LENGTH * 0.15, LANE_RADIUS * 0.4, 0, Math.PI * 2));
}

function maybeOxygen(items: SpawnItem[], chance: number): SpawnItem[] {
  if (Math.random() < chance) {
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "oxygen",
      x: rand(-LANE_RADIUS * 0.5, LANE_RADIUS * 0.5),
      z: rand(-LANE_RADIUS * 0.5, LANE_RADIUS * 0.5),
      yOffset: CHUNK_LENGTH * 0.85,
      seed: Math.random(),
    });
  }
  return items;
}

export function generateChunk(index: number, difficulty: number): SpawnItem[] {
  // Cada 5º chunk es un respiro; de vez en cuando aparece un power-up.
  if (index % 6 === 5) {
    return maybeOxygen(templateBreather(), 0.5);
  }

  const roll = Math.random();
  const obstacleKind: ObstacleKind = Math.random() > 0.5 ? "jellyfish" : "urchin";

  let items: SpawnItem[];
  if (roll < 0.32) {
    items = templateRingGap(difficulty, obstacleKind);
  } else if (roll < 0.6) {
    items = templateZigzag(difficulty, obstacleKind);
  } else if (roll < 0.8) {
    items = templateNetCurtain(difficulty);
  } else {
    const powerupKind: PickupKind = (["shield", "magnet", "speed"] as const)[
      Math.floor(rand(0, 3))
    ];
    items = templatePowerup(powerupKind);
  }

  if (difficulty > 0.35 && Math.random() < 0.25 + difficulty * 0.2) {
    items.push({
      id: uid(),
      isObstacle: true,
      kind: "predator",
      x: rand(-LANE_RADIUS * 0.6, LANE_RADIUS * 0.6),
      z: rand(-LANE_RADIUS * 0.6, LANE_RADIUS * 0.6),
      yOffset: CHUNK_LENGTH * 0.65,
      seed: Math.random(),
    });
  }

  return maybeOxygen(items, 0.12);
}
