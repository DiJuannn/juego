"use client";

import { useState } from "react";
import { SKINS } from "@/lib/constants";
import { useGameStore } from "@/lib/store";
import { gameAudio } from "@/lib/audio";
import { AxolotlSprite } from "../AxolotlSprite";

export function MainMenu({ onPlay }: { onPlay: () => void }) {
  const save = useGameStore((s) => s.save);
  const [tab, setTab] = useState<"play" | "shop">("play");

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-b from-sky-200/70 via-sky-100/60 to-emerald-100/60">
      <div className="w-full max-w-md bg-white/90 border border-white rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-md shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="text-center">
          <div className="mx-auto -mb-2" style={{ width: 90 }}>
            <AxolotlSprite skinId={save.equippedSkin} size={90} />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-sky-400 to-amber-400">
            AJOLOTE
          </h1>
          <p className="text-slate-500 text-sm -mt-1">Hacia la Luz</p>
        </div>

        <div className="flex justify-center gap-4 text-slate-600 text-sm">
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
              className="w-full rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 hover:brightness-105 text-white font-extrabold text-lg py-3.5 shadow-lg shadow-sky-400/40 active:scale-95 transition"
            >
              Nadar hacia la superficie
            </button>
            <div className="text-slate-500 text-xs text-center leading-relaxed">
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
        active ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
        <h3 className="text-slate-500 text-sm font-semibold mb-2">Skins</h3>
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
                className={`rounded-xl p-2 flex flex-col items-center gap-1 border-2 transition ${
                  equipped ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div style={{ width: 44, height: 44 }}>
                  <AxolotlSprite skinId={skin.id} size={44} />
                </div>
                <span className="text-[10px] text-slate-600 text-center leading-tight">{skin.name}</span>
                <span className="text-[10px] text-amber-600 font-semibold">
                  {equipped ? "Equipado" : unlocked ? "Usar" : `🫧 ${skin.cost}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-slate-500 text-sm font-semibold mb-2">Mejoras permanentes</h3>
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
    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
      <div>
        <div className="text-slate-700 text-sm">{label}</div>
        <div className="text-slate-400 text-[10px]">Nivel {level}/3</div>
      </div>
      <button
        disabled={maxed || pearls < cost}
        onClick={() => {
          gameAudio.click();
          onBuy();
        }}
        className="rounded-lg bg-emerald-400 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold px-3 py-1.5"
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
  const equippedSkin = useGameStore((s) => s.save.equippedSkin);
  const isRecord = Math.floor(depth) >= bestDepth && Math.floor(depth) > 0;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-4 ${
        won
          ? "bg-gradient-to-b from-sky-200/70 via-amber-100/60 to-amber-50/70"
          : "bg-gradient-to-b from-slate-400/50 to-slate-500/40"
      } backdrop-blur-sm`}
    >
      <div className="w-full max-w-sm bg-white/95 border border-white rounded-3xl p-6 flex flex-col gap-3 items-center text-center shadow-xl">
        <div style={{ width: 80 }}>
          <AxolotlSprite skinId={equippedSkin} size={80} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-700">
          {won ? "¡Llegaste a la superficie! 🌞" : "Te quedaste sin oxígeno 💧"}
        </h2>
        {isRecord && <p className="text-amber-500 font-semibold text-sm">¡Nuevo récord de profundidad!</p>}
        <div className="grid grid-cols-3 gap-3 w-full text-slate-600 text-sm my-2">
          <Stat label="Profundidad" value={`${Math.floor(depth)}m`} />
          <Stat label="Perlas" value={Math.floor(pearlsThisRun)} />
          <Stat label="Puntos" value={Math.floor(score)} />
        </div>
        <button
          onClick={() => {
            gameAudio.click();
            onRetry();
          }}
          className="w-full rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 hover:brightness-105 text-white font-extrabold text-lg py-3 shadow-lg active:scale-95 transition"
        >
          Reintentar
        </button>
        <button
          onClick={() => {
            gameAudio.click();
            onMenu();
          }}
          className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5"
        >
          Menú
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-xl py-2">
      <div className="text-base font-bold text-amber-500">{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}
