"use client";

import { create } from "zustand";
import { MAX_OXYGEN, SKINS, SURFACE_DEPTH, type SkinId } from "./constants";

export type GamePhase = "menu" | "playing" | "gameover" | "surfaced" | "paused";

interface SaveData {
  bestDepth: number;
  totalPearls: number;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  upgrades: {
    startOxygen: number; // niveles comprados (0-3)
    magnet: number; // niveles comprados (0-3)
  };
}

const SAVE_KEY = "ajolote-save-v1";

function loadSave(): SaveData {
  if (typeof window === "undefined") {
    return defaultSave();
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed };
  } catch {
    return defaultSave();
  }
}

function defaultSave(): SaveData {
  return {
    bestDepth: 0,
    totalPearls: 0,
    unlockedSkins: ["rosa"],
    equippedSkin: "rosa",
    upgrades: { startOxygen: 0, magnet: 0 },
  };
}

function persist(save: SaveData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

interface GameState {
  phase: GamePhase;
  depth: number;
  oxygen: number;
  score: number;
  combo: number;
  comboTimer: number;
  pearlsThisRun: number;
  save: SaveData;

  startRun: () => void;
  endRun: (won: boolean) => void;
  resumeMenu: () => void;
  setPaused: (paused: boolean) => void;

  applyOxygenDelta: (delta: number) => void;
  addOxygen: (amount: number) => void;
  addDepth: (deltaMeters: number) => void;
  collectPearl: (value?: number) => void;
  registerHit: () => void;
  tickCombo: (deltaSeconds: number) => void;

  equipSkin: (id: SkinId) => void;
  buySkin: (id: SkinId) => void;
  buyUpgrade: (kind: "startOxygen" | "magnet") => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "menu",
  depth: 0,
  oxygen: MAX_OXYGEN,
  score: 0,
  combo: 0,
  comboTimer: 0,
  pearlsThisRun: 0,
  save: loadSave(),

  startRun: () =>
    set((s) => ({
      phase: "playing",
      depth: 0,
      oxygen: MAX_OXYGEN + s.save.upgrades.startOxygen * 15,
      score: 0,
      combo: 0,
      comboTimer: 0,
      pearlsThisRun: 0,
    })),

  endRun: (won: boolean) =>
    set((s) => {
      const newBest = Math.max(s.save.bestDepth, Math.floor(s.depth));
      const newSave: SaveData = {
        ...s.save,
        bestDepth: newBest,
        totalPearls: s.save.totalPearls + s.pearlsThisRun,
      };
      persist(newSave);
      return { phase: won ? "surfaced" : "gameover", save: newSave };
    }),

  resumeMenu: () => set({ phase: "menu" }),
  setPaused: (paused: boolean) =>
    set((s) => ({ phase: paused ? "paused" : s.phase === "paused" ? "playing" : s.phase })),

  applyOxygenDelta: (delta: number) => {
    const s = get();
    const next = Math.max(0, Math.min(MAX_OXYGEN, s.oxygen + delta));
    set({ oxygen: next });
    if (next <= 0 && s.phase === "playing") {
      get().endRun(false);
    }
  },

  addOxygen: (amount: number) => get().applyOxygenDelta(Math.abs(amount)),

  addDepth: (deltaMeters: number) =>
    set((s) => {
      const depth = s.depth + deltaMeters;
      if (depth >= SURFACE_DEPTH && s.phase === "playing") {
        queueMicrotask(() => get().endRun(true));
      }
      return { depth, score: s.score + deltaMeters * 0.6 };
    }),

  collectPearl: (value = 1) =>
    set((s) => {
      const combo = s.combo + 1;
      return {
        pearlsThisRun: s.pearlsThisRun + value,
        combo,
        comboTimer: 2.4,
        score: s.score + value * 8 * (1 + combo * 0.08),
      };
    }),

  registerHit: () =>
    set((s) => ({
      oxygen: Math.max(0, s.oxygen - 14),
      combo: 0,
      comboTimer: 0,
    })),

  tickCombo: (deltaSeconds: number) =>
    set((s) => {
      if (s.comboTimer <= 0) return {};
      const t = s.comboTimer - deltaSeconds;
      return t <= 0 ? { comboTimer: 0, combo: 0 } : { comboTimer: t };
    }),

  equipSkin: (id: SkinId) =>
    set((s) => {
      if (!s.save.unlockedSkins.includes(id)) return {};
      const newSave = { ...s.save, equippedSkin: id };
      persist(newSave);
      return { save: newSave };
    }),

  buySkin: (id: SkinId) =>
    set((s) => {
      const skin = SKINS.find((sk) => sk.id === id);
      if (!skin || s.save.unlockedSkins.includes(id) || s.save.totalPearls < skin.cost) {
        return {};
      }
      const newSave: SaveData = {
        ...s.save,
        totalPearls: s.save.totalPearls - skin.cost,
        unlockedSkins: [...s.save.unlockedSkins, id],
        equippedSkin: id,
      };
      persist(newSave);
      return { save: newSave };
    }),

  buyUpgrade: (kind: "startOxygen" | "magnet") =>
    set((s) => {
      const level = s.save.upgrades[kind];
      if (level >= 3) return {};
      const cost = (level + 1) * 30;
      if (s.save.totalPearls < cost) return {};
      const newSave: SaveData = {
        ...s.save,
        totalPearls: s.save.totalPearls - cost,
        upgrades: { ...s.save.upgrades, [kind]: level + 1 },
      };
      persist(newSave);
      return { save: newSave };
    }),
}));
