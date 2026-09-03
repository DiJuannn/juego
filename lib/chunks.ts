import { CHUNK_LENGTH, LANE_RADIUS } from "./constants";

export type ObstacleKind = "jellyfish" | "urchin" | "net" | "predator";
export type PickupKind = "pearl" | "oxygen" | "shield" | "magnet" | "speed";

export interface SpawnItem {
  id: string;
  isObstacle: boolean;
  kind: ObstacleKind | PickupKind;
  x: number; // % horizontal desde el centro, -LANE_RADIUS..LANE_RADIUS
  yOffset: number; // metros dentro del chunk, 0..CHUNK_LENGTH
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

function clampX(x: number) {
  return Math.max(-LANE_RADIUS, Math.min(LANE_RADIUS, x));
}

function pearlWave(count: number, yStart: number, yEnd: number, xCenter: number, amplitude: number): SpawnItem[] {
  const items: SpawnItem[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "pearl",
      x: clampX(xCenter + Math.sin(t * Math.PI * 2) * amplitude),
      yOffset: yStart + (yEnd - yStart) * t,
      seed: Math.random(),
    });
  }
  return items;
}

// Fila de obstáculos cruzando el ancho, con un hueco seguro por el que pasar.
function templateWallGap(difficulty: number, kind: ObstacleKind): SpawnItem[] {
  const count = Math.min(6, 4 + Math.floor(difficulty * 2));
  const gapIndex = Math.floor(rand(0, count));
  const items: SpawnItem[] = [];
  const y = CHUNK_LENGTH * 0.5;
  for (let i = 0; i < count; i++) {
    const x = clampX(-LANE_RADIUS + (i / (count - 1)) * LANE_RADIUS * 2);
    if (i === gapIndex) {
      items.push({ id: uid(), isObstacle: false, kind: "pearl", x, yOffset: y, seed: Math.random() });
      continue;
    }
    items.push({ id: uid(), isObstacle: true, kind, x, yOffset: y, seed: Math.random() });
  }
  return items;
}

// Zigzag: hay que serpentear de un lado a otro en 3 filas.
function templateZigzag(difficulty: number, kind: ObstacleKind): SpawnItem[] {
  const rows = 3;
  const items: SpawnItem[] = [];
  let side = Math.random() > 0.5 ? 1 : -1;
  const spread = Math.max(LANE_RADIUS * 0.5, LANE_RADIUS - difficulty * 10);
  for (let r = 0; r < rows; r++) {
    const yOffset = (r / rows) * CHUNK_LENGTH;
    items.push({
      id: uid(),
      isObstacle: true,
      kind,
      x: clampX(side * spread + rand(-4, 4)),
      yOffset,
      seed: Math.random(),
    });
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "pearl",
      x: clampX(-side * spread * 0.7),
      yOffset,
      seed: Math.random(),
    });
    side *= -1;
  }
  return items;
}

// Zona de respiro: solo perlas en una onda suave, sin obstáculos.
function templateBreather(): SpawnItem[] {
  return pearlWave(6, 0, CHUNK_LENGTH * 0.9, rand(-10, 10), LANE_RADIUS * 0.6);
}

function templatePowerup(kind: PickupKind): SpawnItem[] {
  const y = CHUNK_LENGTH * 0.5;
  const x = rand(-LANE_RADIUS * 0.4, LANE_RADIUS * 0.4);
  const items: SpawnItem[] = [{ id: uid(), isObstacle: false, kind, x, yOffset: y, seed: Math.random() }];
  return items.concat(pearlWave(4, y - CHUNK_LENGTH * 0.35, y + CHUNK_LENGTH * 0.35, x, LANE_RADIUS * 0.5));
}

function maybeOxygen(items: SpawnItem[], chance: number): SpawnItem[] {
  if (Math.random() < chance) {
    items.push({
      id: uid(),
      isObstacle: false,
      kind: "oxygen",
      x: clampX(rand(-LANE_RADIUS * 0.6, LANE_RADIUS * 0.6)),
      yOffset: CHUNK_LENGTH * 0.85,
      seed: Math.random(),
    });
  }
  return items;
}

export function generateChunk(index: number, difficulty: number): SpawnItem[] {
  // Cada 6º chunk es un respiro; el resto reparte patrones + algún power-up.
  if (index % 6 === 5) {
    return maybeOxygen(templateBreather(), 0.5);
  }

  const roll = Math.random();
  const obstacleKind: ObstacleKind = Math.random() > 0.5 ? "jellyfish" : "urchin";

  let items: SpawnItem[];
  if (roll < 0.32) {
    items = templateWallGap(difficulty, obstacleKind);
  } else if (roll < 0.62) {
    items = templateZigzag(difficulty, obstacleKind);
  } else if (roll < 0.82) {
    items = templateWallGap(difficulty, "net");
  } else {
    const powerupKind: PickupKind = (["shield", "magnet", "speed"] as const)[Math.floor(rand(0, 3))];
    items = templatePowerup(powerupKind);
  }

  if (difficulty > 0.3 && Math.random() < 0.2 + difficulty * 0.25) {
    items.push({
      id: uid(),
      isObstacle: true,
      kind: "predator",
      x: clampX(rand(-LANE_RADIUS * 0.7, LANE_RADIUS * 0.7)),
      yOffset: CHUNK_LENGTH * 0.6,
      seed: Math.random(),
    });
  }

  return maybeOxygen(items, 0.12);
}
