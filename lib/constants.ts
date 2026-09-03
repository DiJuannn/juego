// Tuning central de todo el juego. Cambiar aquí afecta a toda la partida.

export const LANE_RADIUS = 3.2; // radio del disco horizontal donde se puede mover el ajolote
export const PLAYER_COLLIDER_RADIUS = 0.55;

export const BASE_ASCEND_SPEED = 4.2; // unidades/seg al empezar
export const MAX_ASCEND_SPEED = 8.5; // techo de dificultad
export const SPEED_RAMP_PER_METER = 0.012; // cuánto sube la velocidad por metro ascendido

export const BOOST_SPEED_MULT = 1.9;
export const BOOST_OXYGEN_COST = 18; // por segundo de boost
export const BOOST_DURATION_MAX = 1.4; // segundos que dura una pulsación de boost

export const MAX_OXYGEN = 100;
export const OXYGEN_DRAIN_PER_SEC = 3.1;
export const OXYGEN_BUBBLE_VALUE = 16;
export const LOW_OXYGEN_THRESHOLD = 25;

export const SURFACE_DEPTH = 1000; // metros ascendidos para "ganar" la run

export const CHUNK_LENGTH = 14; // separación en Y entre patrones generados
export const SPAWN_LOOKAHEAD_CHUNKS = 6; // cuántos chunks mantenemos generados por delante
export const DESPAWN_BEHIND = 10; // margen por detrás antes de reciclar

export const COMBO_WINDOW = 2.4; // segundos para mantener el combo tras recoger algo
export const COMBO_SCORE_STEP = 5;

export type ZoneId = "abismo" | "crepusculo" | "arrecife" | "iluminada" | "superficie";

export interface ZoneDef {
  id: ZoneId;
  name: string;
  fromDepth: number;
  fogColor: [number, number, number];
  fogDensity: number;
  ambientColor: [number, number, number];
  ambientIntensity: number;
  lightColor: [number, number, number];
  lightIntensity: number;
  particleColor: string;
  accentColor: string;
}

export const ZONES: ZoneDef[] = [
  {
    id: "abismo",
    name: "El Abismo",
    fromDepth: 0,
    fogColor: [0.01, 0.02, 0.05],
    fogDensity: 0.055,
    ambientColor: [0.05, 0.08, 0.18],
    ambientIntensity: 0.35,
    lightColor: [0.2, 0.4, 0.9],
    lightIntensity: 0.4,
    particleColor: "#5ad1ff",
    accentColor: "#7f5af0",
  },
  {
    id: "crepusculo",
    name: "Zona Crepuscular",
    fromDepth: 180,
    fogColor: [0.02, 0.06, 0.12],
    fogDensity: 0.045,
    ambientColor: [0.08, 0.16, 0.28],
    ambientIntensity: 0.45,
    lightColor: [0.25, 0.55, 0.85],
    lightIntensity: 0.55,
    particleColor: "#4fd6c0",
    accentColor: "#2ec4b6",
  },
  {
    id: "arrecife",
    name: "Arrecife de Coral",
    fromDepth: 420,
    fogColor: [0.03, 0.12, 0.18],
    fogDensity: 0.038,
    ambientColor: [0.15, 0.28, 0.32],
    ambientIntensity: 0.6,
    lightColor: [0.9, 0.6, 0.35],
    lightIntensity: 0.75,
    particleColor: "#ff8fa3",
    accentColor: "#ffb703",
  },
  {
    id: "iluminada",
    name: "Aguas Iluminadas",
    fromDepth: 680,
    fogColor: [0.15, 0.42, 0.55],
    fogDensity: 0.03,
    ambientColor: [0.35, 0.55, 0.6],
    ambientIntensity: 0.85,
    lightColor: [1, 0.95, 0.75],
    lightIntensity: 1.05,
    particleColor: "#e6fbff",
    accentColor: "#ffe066",
  },
  {
    id: "superficie",
    name: "La Superficie",
    fromDepth: 900,
    fogColor: [0.55, 0.82, 0.92],
    fogDensity: 0.02,
    ambientColor: [0.6, 0.8, 0.9],
    ambientIntensity: 1.1,
    lightColor: [1, 1, 0.92],
    lightIntensity: 1.4,
    particleColor: "#ffffff",
    accentColor: "#fff3bf",
  },
];

export function getZoneForDepth(depth: number): ZoneDef {
  let current = ZONES[0];
  for (const z of ZONES) {
    if (depth >= z.fromDepth) current = z;
  }
  return current;
}

export function lerpZone(a: ZoneDef, b: ZoneDef, t: number) {
  const lerp3 = (x: [number, number, number], y: [number, number, number]) =>
    [
      x[0] + (y[0] - x[0]) * t,
      x[1] + (y[1] - x[1]) * t,
      x[2] + (y[2] - x[2]) * t,
    ] as [number, number, number];
  return {
    fogColor: lerp3(a.fogColor, b.fogColor),
    fogDensity: a.fogDensity + (b.fogDensity - a.fogDensity) * t,
    ambientColor: lerp3(a.ambientColor, b.ambientColor),
    ambientIntensity: a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * t,
    lightColor: lerp3(a.lightColor, b.lightColor),
    lightIntensity: a.lightIntensity + (b.lightIntensity - a.lightIntensity) * t,
  };
}

export const SKINS = [
  { id: "rosa", name: "Rosa clásico", cost: 0, color: "#f7a8c4", spots: "#e0568d" },
  { id: "negro", name: "Melanico", cost: 40, color: "#3a3a42", spots: "#16161a" },
  { id: "dorado", name: "Dorado", cost: 90, color: "#f4c95d", spots: "#c9861f" },
  { id: "albino", name: "Albino", cost: 150, color: "#fdfbf7", spots: "#f2d9d9" },
  { id: "azul", name: "Azul GFP", cost: 220, color: "#7ee0e0", spots: "#2fb6c4" },
] as const;

export type SkinId = (typeof SKINS)[number]["id"];
