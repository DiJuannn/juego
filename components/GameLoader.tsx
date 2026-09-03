"use client";

import dynamic from "next/dynamic";

const GameRoot = dynamic(() => import("./GameRoot"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex items-center justify-center bg-gradient-to-b from-sky-200 to-sky-400 text-white text-sm font-semibold">
      Sumergiendo…
    </div>
  ),
});

export function GameLoader() {
  return <GameRoot />;
}
