"use client";

import { LOW_OXYGEN_THRESHOLD, MAX_OXYGEN, SURFACE_DEPTH } from "@/lib/constants";
import { useGameStore } from "@/lib/store";

export function HUD({ onPause }: { onPause: () => void }) {
  const oxygen = useGameStore((s) => s.oxygen);
  const depth = useGameStore((s) => s.depth);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const pearlsThisRun = useGameStore((s) => s.pearlsThisRun);

  const oxygenPct = Math.max(0, Math.min(100, (oxygen / MAX_OXYGEN) * 100));
  const depthPct = Math.max(0, Math.min(100, (depth / SURFACE_DEPTH) * 100));
  const low = oxygen < LOW_OXYGEN_THRESHOLD;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 w-48 sm:w-64">
          <Bar
            label="Oxígeno"
            pct={oxygenPct}
            colorClass={low ? "bg-red-500 animate-pulse" : "bg-sky-300"}
            trackClass="bg-slate-900/50"
          />
          <Bar label="Profundidad" pct={depthPct} colorClass="bg-amber-300" trackClass="bg-slate-900/50" />
          <div className="flex gap-3 text-xs sm:text-sm text-white/90 drop-shadow">
            <span>🫧 {Math.floor(pearlsThisRun)}</span>
            <span>⭐ {Math.floor(score)}</span>
            <span>{Math.floor(depth)}m</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onPause}
          className="pointer-events-auto rounded-full bg-black/40 hover:bg-black/60 text-white w-10 h-10 flex items-center justify-center text-lg backdrop-blur"
          aria-label="Pausa"
        >
          ⏸
        </button>
      </div>

      {combo > 1 && (
        <div className="self-center text-center">
          <div className="text-2xl sm:text-3xl font-bold text-amber-200 drop-shadow-lg animate-bounce">
            Combo x{combo}
          </div>
        </div>
      )}

      <div className="flex justify-center pb-4">
        <button
          type="button"
          data-boost-button
          className="pointer-events-auto select-none rounded-full bg-gradient-to-b from-sky-300 to-sky-500 active:from-sky-400 active:to-sky-600 text-slate-900 font-bold w-20 h-20 sm:hidden shadow-lg shadow-sky-500/40 flex items-center justify-center text-sm border-2 border-white/40"
        >
          IMPULSO
        </button>
      </div>
      <p className="hidden sm:block text-center text-white/70 text-xs">
        Flechas / WASD para nadar · Espacio para impulso
      </p>
    </div>
  );
}

function Bar({
  label,
  pct,
  colorClass,
  trackClass,
}: {
  label: string;
  pct: number;
  colorClass: string;
  trackClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] sm:text-xs text-white/80 mb-0.5">
        <span>{label}</span>
      </div>
      <div className={`h-2.5 sm:h-3 w-full rounded-full overflow-hidden ${trackClass} backdrop-blur`}>
        <div
          className={`h-full rounded-full transition-[width] duration-150 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 flex flex-col gap-3 items-center w-64">
        <h2 className="text-white text-xl font-bold">Pausa</h2>
        <button
          onClick={onResume}
          className="w-full rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-900 font-semibold py-2.5"
        >
          Continuar
        </button>
        <button
          onClick={onQuit}
          className="w-full rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5"
        >
          Salir al menú
        </button>
      </div>
    </div>
  );
}
