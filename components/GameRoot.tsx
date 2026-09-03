"use client";

import { GameCanvas, useGameRefs } from "./GameCanvas";
import { useSteering } from "@/hooks/useSteering";
import { useGameStore } from "@/lib/store";
import { HUD, PauseOverlay } from "./ui/HUD";
import { MainMenu, EndScreen } from "./ui/MenuScreens";

export default function GameRoot() {
  const phase = useGameStore((s) => s.phase);
  const startRun = useGameStore((s) => s.startRun);
  const resumeMenu = useGameStore((s) => s.resumeMenu);
  const setPaused = useGameStore((s) => s.setPaused);
  const refs = useGameRefs();
  const steering = useSteering();

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black touch-none">
      <GameCanvas refs={refs} steering={steering} />

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
