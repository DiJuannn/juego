"use client";

import dynamic from "next/dynamic";

const GameRoot = dynamic(() => import("./GameRoot"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex items-center justify-center bg-gradient-to-b from-slate-950 to-sky-950 text-white/70 text-sm">
      Sumergiendo…
    </div>
  ),
});

export function GameLoader() {
  return <GameRoot />;
}
