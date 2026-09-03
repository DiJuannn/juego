"use client";

import { useState } from "react";
import { SKINS } from "@/lib/constants";
import { useGameStore } from "@/lib/store";
import { gameAudio } from "@/lib/audio";

export function MainMenu({ onPlay }: { onPlay: () => void }) {
  const save = useGameStore((s) => s.save);
  const [tab, setTab] = useState<"play" | "shop">("play");

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-sky-900/50">
      <div className="w-full max-w-md bg-slate-950/80 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-sky-200 to-amber-200 drop-shadow">
            AJOLOTE
          </h1>
          <p className="text-white/60 text-sm -mt-1">Hacia la Luz</p>
        </div>

        <div className="flex justify-center gap-4 text-white/80 text-sm">
          <span>🏆 Récord: {save.bestDepth}m</span>
          <span>🫧 {save.totalPearls}</span>
        </div>

        <div className="flex gap-2 justify-center">
          <TabButton active={tab === "play"} onClick={() => setTab("play")}>
            Jugar
          </TabButton>
          <TabButton active={tab === "shop"} onClick={() => setTab("shop")}>
            Tienda
          </TabButton>
        </div>

        {tab === "play" ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                gameAudio.resume();
                gameAudio.click();
                onPlay();
              }}
              className="w-full rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 hover:brightness-110 text-slate-900 font-extrabold text-lg py-3.5 shadow-lg shadow-sky-500/30 active:scale-95 transition"
            >
              Nadar hacia la superficie
            </button>
            <div className="text-white/60 text-xs text-center leading-relaxed">
              Sube sin parar esquivando peligros y recogiendo perlas.
              <br />
              PC: flechas / WASD + espacio para impulso.
              <br />
              Móvil: arrastra el dedo y pulsa IMPULSO.
            </div>
          </div>
        ) : (
          <Shop />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
        active ? "bg-white text-slate-900" : "bg-white/10 text-white/70 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function Shop() {
  const save = useGameStore((s) => s.save);
  const buySkin = useGameStore((s) => s.buySkin);
  const equipSkin = useGameStore((s) => s.equipSkin);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-white/80 text-sm font-semibold mb-2">Skins</h3>
        <div className="grid grid-cols-3 gap-2">
          {SKINS.map((skin) => {
            const unlocked = save.unlockedSkins.includes(skin.id);
            const equipped = save.equippedSkin === skin.id;
            return (
              <button
                key={skin.id}
                onClick={() => {
                  gameAudio.click();
                  if (unlocked) equipSkin(skin.id);
                  else buySkin(skin.id);
                }}
                className={`rounded-xl p-2 flex flex-col items-center gap-1 border transition ${
                  equipped ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="w-8 h-8 rounded-full border border-white/20" style={{ background: skin.color }} />
                <span className="text-[10px] text-white/80 text-center leading-tight">{skin.name}</span>
                <span className="text-[10px] text-amber-200">
                  {equipped ? "Equipado" : unlocked ? "Usar" : `🫧 ${skin.cost}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-white/80 text-sm font-semibold mb-2">Mejoras permanentes</h3>
        <UpgradeRow
          label="Oxígeno inicial"
          level={save.upgrades.startOxygen}
          onBuy={() => buyUpgrade("startOxygen")}
          pearls={save.totalPearls}
        />
        <UpgradeRow
          label="Radio de imán"
          level={save.upgrades.magnet}
          onBuy={() => buyUpgrade("magnet")}
          pearls={save.totalPearls}
        />
      </div>
    </div>
  );
}

function UpgradeRow({
  label,
  level,
  onBuy,
  pearls,
}: {
  label: string;
  level: number;
  onBuy: () => void;
  pearls: number;
}) {
  const cost = (level + 1) * 30;
  const maxed = level >= 3;
  return (
    <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 mb-2">
      <div>
        <div className="text-white/85 text-sm">{label}</div>
        <div className="text-white/40 text-[10px]">Nivel {level}/3</div>
      </div>
      <button
        disabled={maxed || pearls < cost}
        onClick={() => {
          gameAudio.click();
          onBuy();
        }}
        className="rounded-lg bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-slate-900 text-xs font-bold px-3 py-1.5"
      >
        {maxed ? "Máx" : `🫧 ${cost}`}
      </button>
    </div>
  );
}

export function EndScreen({
  won,
  onRetry,
  onMenu,
}: {
  won: boolean;
  onRetry: () => void;
  onMenu: () => void;
}) {
  const depth = useGameStore((s) => s.depth);
  const score = useGameStore((s) => s.score);
  const pearlsThisRun = useGameStore((s) => s.pearlsThisRun);
  const bestDepth = useGameStore((s) => s.save.bestDepth);
  const isRecord = Math.floor(depth) >= bestDepth && Math.floor(depth) > 0;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-4 ${
        won
          ? "bg-gradient-to-b from-sky-200/40 via-sky-400/30 to-amber-100/40"
          : "bg-gradient-to-b from-slate-950/80 to-slate-900/70"
      } backdrop-blur-sm`}
    >
      <div className="w-full max-w-sm bg-slate-950/85 border border-white/10 rounded-3xl p-6 flex flex-col gap-3 items-center text-center shadow-2xl">
        <h2 className="text-2xl font-extrabold text-white">
          {won ? "¡Llegaste a la superficie! 🌞" : "Te quedaste sin oxígeno 💧"}
        </h2>
        {isRecord && <p className="text-amber-300 font-semibold text-sm">¡Nuevo récord de profundidad!</p>}
        <div className="grid grid-cols-3 gap-3 w-full text-white/85 text-sm my-2">
          <Stat label="Profundidad" value={`${Math.floor(depth)}m`} />
          <Stat label="Perlas" value={Math.floor(pearlsThisRun)} />
          <Stat label="Puntos" value={Math.floor(score)} />
        </div>
        <button
          onClick={() => {
            gameAudio.click();
            onRetry();
          }}
          className="w-full rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 hover:brightness-110 text-slate-900 font-extrabold text-lg py-3 shadow-lg active:scale-95 transition"
        >
          Reintentar
        </button>
        <button
          onClick={() => {
            gameAudio.click();
            onMenu();
          }}
          className="w-full rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5"
        >
          Menú
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-xl py-2">
      <div className="text-base font-bold text-amber-200">{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
    </div>
  );
}
