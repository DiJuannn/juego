// Tuning central de todo el juego. Cambiar aquí afecta a toda la partida.
// Espacio 2D: X en porcentaje horizontal desde el centro (-LANE_RADIUS..LANE_RADIUS),
// Y en "metros" de profundidad abstractos, convertidos a píxeles por GameStage
// según la altura real del contenedor (VISIBLE_METERS de mundo visibles a la vez).

export const LANE_RADIUS = 34; // % desde el centro que puede recorrer el ajolote
export const PLAYER_RADIUS_PCT = 7;

export const VISIBLE_METERS = 13; // cuántos metros de mundo se ven a la vez en pantalla

export const BASE_ASCEND_SPEED = 2.6; // metros/seg al empezar
export const MAX_ASCEND_SPEED = 5.6; // techo de dificultad
export const SPEED_RAMP_PER_METER = 0.009; // cuánto sube la velocidad por metro ascendido

export const BOOST_SPEED_MULT = 1.8;
export const BOOST_OXYGEN_COST = 18; // por segundo de boost

export const MAX_OXYGEN = 100;
export const OXYGEN_DRAIN_PER_SEC = 3.1;
export const OXYGEN_BUBBLE_VALUE = 16;
export const LOW_OXYGEN_THRESHOLD = 25;

export const SURFACE_DEPTH = 700; // metros ascendidos para "ganar" la run

export const CHUNK_LENGTH = 6.5; // separación en metros entre patrones generados
export const SPAWN_LOOKAHEAD_CHUNKS = 4; // cuántos chunks mantenemos generados por delante
export const DESPAWN_BEHIND = 4; // margen por detrás (metros) antes de reciclar

export const COMBO_WINDOW = 2.4; // segundos para mantener el combo tras recoger algo

export type ZoneId = "fondo" | "cueva" | "arrecife" | "clara" | "superficie";

export interface ZoneDef {
  id: ZoneId;
  name: string;
  fromDepth: number;
  skyTop: [number, number, number];
  skyBottom: [number, number, number];
  silhouette: [number, number, number];
  accentColor: string;
  bubbleColor: string;
}

export const ZONES: ZoneDef[] = [
  {
    id: "fondo",
    name: "Fondo del Mar",
    fromDepth: 0,
    skyTop: [0.42, 0.5, 0.78],
    skyBottom: [0.26, 0.32, 0.62],
    silhouette: [0.2, 0.24, 0.46],
    accentColor: "#b8c4ff",
    bubbleColor: "#ffffff",
  },
  {
    id: "cueva",
    name: "Cuevas Azules",
    fromDepth: 140,
    skyTop: [0.36, 0.62, 0.78],
    skyBottom: [0.22, 0.48, 0.66],
    silhouette: [0.18, 0.38, 0.52],
    accentColor: "#9fe0ee",
    bubbleColor: "#eafcff",
  },
  {
    id: "arrecife",
    name: "Arrecife de Coral",
    fromDepth: 320,
    skyTop: [0.5, 0.82, 0.78],
    skyBottom: [0.32, 0.68, 0.66],
    silhouette: [0.26, 0.5, 0.48],
    accentColor: "#ffb4c6",
    bubbleColor: "#fff2f6",
  },
  {
    id: "clara",
    name: "Aguas Claras",
    fromDepth: 480,
    skyTop: [0.72, 0.92, 0.94],
    skyBottom: [0.55, 0.85, 0.9],
    silhouette: [0.45, 0.72, 0.76],
    accentColor: "#ffe9a8",
    bubbleColor: "#ffffff",
  },
  {
    id: "superficie",
    name: "La Superficie",
    fromDepth: 620,
    skyTop: [0.98, 0.97, 0.85],
    skyBottom: [0.78, 0.93, 0.85],
    silhouette: [0.62, 0.82, 0.68],
    accentColor: "#ffe28a",
    bubbleColor: "#ffffff",
  },
];

export function getZoneForDepth(depth: number): ZoneDef {
  let current = ZONES[0];
  for (const z of ZONES) {
    if (depth >= z.fromDepth) current = z;
  }
  return current;
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [
    number,
    number,
    number,
  ];
}

export function rgb([r, g, b]: [number, number, number]) {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function zoneColorsAtDepth(depth: number) {
  const current = getZoneForDepth(depth);
  const idx = ZONES.findIndex((z) => z.id === current.id);
  const next = ZONES[idx + 1];
  if (!next) {
    return { skyTop: current.skyTop, skyBottom: current.skyBottom, silhouette: current.silhouette };
  }
  const t = Math.max(0, Math.min(1, (depth - current.fromDepth) / (next.fromDepth - current.fromDepth)));
  return {
    skyTop: lerp3(current.skyTop, next.skyTop, t),
    skyBottom: lerp3(current.skyBottom, next.skyBottom, t),
    silhouette: lerp3(current.silhouette, next.silhouette, t),
  };
}

export const SKINS = [
  { id: "rosa", name: "Rosa clásico", cost: 0, body: "#ffeef4", gill: "#f6a8c6", blush: "#ffc9dc" },
  { id: "lila", name: "Lila", cost: 40, body: "#f1eaff", gill: "#c9a6f2", blush: "#ddc6ff" },
  { id: "menta", name: "Menta", cost: 90, body: "#eafff5", gill: "#8fe0c0", blush: "#c6ffe6" },
  { id: "durazno", name: "Durazno", cost: 150, body: "#fff2e6", gill: "#ffb98a", blush: "#ffd9b3" },
  { id: "cielo", name: "Cielo", cost: 220, body: "#eaf6ff", gill: "#8fc7f2", blush: "#c6e6ff" },
] as const;

export type SkinId = (typeof SKINS)[number]["id"];
