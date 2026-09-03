"use client";

import { GameStage } from "./GameStage";
import { useGameStore } from "@/lib/store";
import { HUD, PauseOverlay } from "./ui/HUD";
import { MainMenu, EndScreen } from "./ui/MenuScreens";

export default function GameRoot() {
  const phase = useGameStore((s) => s.phase);
  const startRun = useGameStore((s) => s.startRun);
  const resumeMenu = useGameStore((s) => s.resumeMenu);
  const setPaused = useGameStore((s) => s.setPaused);

  return (
    <div className="relative w-full h-dvh overflow-hidden touch-none">
      <GameStage />

      {phase === "playing" && <HUD onPause={() => setPaused(true)} />}
      {phase === "paused" && (
        <PauseOverlay onResume={() => setPaused(false)} onQuit={() => resumeMenu()} />
      )}
      {phase === "menu" && <MainMenu onPlay={() => startRun()} />}
      {(phase === "gameover" || phase === "surfaced") && (
        <EndScreen won={phase === "surfaced"} onRetry={() => startRun()} onMenu={() => resumeMenu()} />
      )}
    </div>
  );
}
