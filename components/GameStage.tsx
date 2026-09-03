"use client";

import { useEffect, useRef } from "react";
import { gameAudio } from "@/lib/audio";
import type { SpawnItem } from "@/lib/chunks";
import {
  BASE_ASCEND_SPEED,
  BOOST_OXYGEN_COST,
  BOOST_SPEED_MULT,
  MAX_ASCEND_SPEED,
  OXYGEN_BUBBLE_VALUE,
  OXYGEN_DRAIN_PER_SEC,
  SPEED_RAMP_PER_METER,
  VISIBLE_METERS,
} from "@/lib/constants";
import { useGameStore } from "@/lib/store";
import { useSteering } from "@/hooks/useSteering";
import { AxolotlSprite, type AxolotlHandle } from "./AxolotlSprite";
import { Background2D, type BackgroundHandle } from "./Background2D";
import { PLAYER_SCREEN_Y_FRACTION, type StageRefs } from "./Entity2D";
import { World2D, type WorldHandle } from "./World2D";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function GameStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const axolotlRef = useRef<AxolotlHandle>(null);
  const backgroundRef = useRef<BackgroundHandle>(null);
  const steering = useSteering();
  const worldRef = useRef<WorldHandle>(null);
  const equippedSkin = useGameStore((s) => s.save.equippedSkin);
  const phase = useGameStore((s) => s.phase);
  const worldActive = phase === "playing" || phase === "paused";

  const depthRef = useRef(0);
  const pxPerMeterRef = useRef(1);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const playerXRef = useRef(0);
  const hitFlashRef = useRef(0);
  const shieldTimeRef = useRef(0);
  const magnetTimeRef = useRef(0);
  const speedTimeRef = useRef(0);

  const refs: StageRefs = {
    depthRef,
    pxPerMeterRef,
    containerSizeRef,
    playerXRef,
    magnetTimeRef,
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      containerSizeRef.current = { width: rect.width, height: rect.height };
      pxPerMeterRef.current = rect.height / VISIBLE_METERS;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      depthRef.current = 0;
      shieldTimeRef.current = 0;
      magnetTimeRef.current = 0;
      speedTimeRef.current = 0;
      playerXRef.current = 0;
      steering.reset();
      worldRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs estables, solo se reacciona a `phase`
  }, [phase]);

  const handleObstacleHit = (kind: SpawnItem["kind"]) => {
    if ((shieldTimeRef.current ?? 0) > 0) {
      gameAudio.powerup();
      return;
    }
    useGameStore.getState().registerHit();
    hitFlashRef.current = 1;
    gameAudio.hit();
    void kind;
  };

  const handlePickup = (kind: SpawnItem["kind"], item: SpawnItem) => {
    const store = useGameStore.getState();
    switch (kind) {
      case "pearl":
        store.collectPearl(1);
        gameAudio.pearl();
        break;
      case "oxygen":
        store.addOxygen(OXYGEN_BUBBLE_VALUE);
        gameAudio.oxygen();
        break;
      case "shield":
        shieldTimeRef.current = 6;
        axolotlRef.current?.setShieldActive(true);
        gameAudio.powerup();
        break;
      case "magnet":
        magnetTimeRef.current = 8;
        gameAudio.powerup();
        break;
      case "speed":
        speedTimeRef.current = 4;
        gameAudio.powerup();
        break;
    }
    void item;
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      hitFlashRef.current = Math.max(0, hitFlashRef.current - delta * 2.2);
      shieldTimeRef.current = Math.max(0, shieldTimeRef.current - delta);
      magnetTimeRef.current = Math.max(0, magnetTimeRef.current - delta);
      speedTimeRef.current = Math.max(0, speedTimeRef.current - delta);

      axolotlRef.current?.setHitFlash(hitFlashRef.current);
      if (shieldTimeRef.current <= 0) axolotlRef.current?.setShieldActive(false);

      const phase = useGameStore.getState().phase;
      let speed = 0;
      if (phase === "playing") {
        steering.applyKeyboard(delta);

        const depth = depthRef.current;
        const boosting = steering.state.current.boosting && useGameStore.getState().oxygen > 1;
        const speedMult = (boosting ? BOOST_SPEED_MULT : 1) * (speedTimeRef.current > 0 ? 1.5 : 1);
        const baseSpeed = clamp(BASE_ASCEND_SPEED + depth * SPEED_RAMP_PER_METER, BASE_ASCEND_SPEED, MAX_ASCEND_SPEED);
        speed = baseSpeed * speedMult;

        depthRef.current = depth + speed * delta;

        const drain = OXYGEN_DRAIN_PER_SEC * delta + (boosting ? BOOST_OXYGEN_COST * delta : 0);
        const store = useGameStore.getState();
        store.applyOxygenDelta(-drain);
        store.addDepth(speed * delta);
        store.tickCombo(delta);
      }

      const lerpT = 1 - Math.pow(0.0008, delta);
      const targetX = steering.state.current.targetX;
      const prevX = playerXRef.current;
      playerXRef.current = prevX + (targetX - prevX) * lerpT;

      if (playerWrapRef.current) {
        playerWrapRef.current.style.left = `${50 + playerXRef.current}%`;
      }
      axolotlRef.current?.setLean(clamp((targetX - prevX) * 4, -22, 22));
      axolotlRef.current?.setSpeedNorm(speed / (MAX_ASCEND_SPEED * BOOST_SPEED_MULT * 1.5));

      backgroundRef.current?.setDepth(depthRef.current);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bucle imperativo, usa refs estables
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden touch-none select-none">
      <Background2D ref={backgroundRef} />
      {worldActive && (
        <World2D
          ref={worldRef}
          refs={refs}
          onObstacleHit={handleObstacleHit}
          onPickup={handlePickup}
          active={phase === "playing"}
        />
      )}
      <div
        ref={playerWrapRef}
        className="absolute"
        style={{ top: `${PLAYER_SCREEN_Y_FRACTION * 100}%`, left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <AxolotlSprite ref={axolotlRef} skinId={equippedSkin} size={104} />
      </div>
    </div>
  );
}
