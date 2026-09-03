"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
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
} from "@/lib/constants";
import { useGameStore } from "@/lib/store";
import { useSteering } from "@/hooks/useSteering";
import { Environment } from "./Environment";
import { Player, type PlayerHandle } from "./Player";
import { World } from "./World";

interface Refs {
  depthRef: React.RefObject<number>;
  playerPositionRef: React.RefObject<PlayerHandle>;
  hitFlashRef: React.RefObject<number>;
  shieldTimeRef: React.RefObject<number>;
  magnetTimeRef: React.RefObject<number>;
  speedTimeRef: React.RefObject<number>;
  ascendNormRef: React.RefObject<number>;
}

export function GameCanvas({ refs, steering }: { refs: Refs; steering: ReturnType<typeof useSteering> }) {
  const equippedSkin = useGameStore((s) => s.save.equippedSkin);
  return (
    <Canvas shadows camera={{ fov: 62, near: 0.1, far: 120, position: [0, 2.4, 6] }} dpr={[1, 1.8]}>
      <Suspense fallback={null}>
        <Environment depthRef={refs.depthRef} />
        <Player
          steering={steering.state}
          positionRef={refs.playerPositionRef}
          skinId={equippedSkin}
          hitFlashRef={refs.hitFlashRef}
          shieldRef={refs.shieldTimeRef}
          speedRef={refs.ascendNormRef}
        />
        <World
          depthRef={refs.depthRef}
          playerPositionRef={refs.playerPositionRef}
          magnetTimeRef={refs.magnetTimeRef}
          onObstacleHit={(kind) => handleObstacleHit(kind, refs)}
          onPickup={(kind, item) => handlePickup(kind, item, refs)}
          active
        />
        <CameraRig playerPositionRef={refs.playerPositionRef} speedTimeRef={refs.speedTimeRef} />
        <GameLoop refs={refs} steering={steering} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.25} luminanceSmoothing={0.35} mipmapBlur />
          <ChromaticAberration offset={[0.0008, 0.0012]} />
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

function handleObstacleHit(kind: SpawnItem["kind"], refs: Refs) {
  if ((refs.shieldTimeRef.current ?? 0) > 0) {
    gameAudio.powerup();
    return;
  }
  useGameStore.getState().registerHit();
  refs.hitFlashRef.current = 1;
  gameAudio.hit();
  void kind;
}

function handlePickup(kind: SpawnItem["kind"], item: SpawnItem, refs: Refs) {
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
      refs.shieldTimeRef.current = 6;
      gameAudio.powerup();
      break;
    case "magnet":
      refs.magnetTimeRef.current = 8;
      gameAudio.powerup();
      break;
    case "speed":
      refs.speedTimeRef.current = 4;
      gameAudio.powerup();
      break;
  }
  void item;
}

// `refs` bundles several plain useRef() containers created once in
// useGameRefs() (GameCanvas) and shared with Player/World/CameraRig so they
// can read the same live values without React re-renders. Writing to
// `.current` from this frame loop is the standard react-three-fiber pattern
// for driving a real-time scene (see useFrame docs) — it intentionally sits
// outside React's render/commit cycle, so the stricter "Rules of React"
// immutability lint (aimed at render-phase code) doesn't apply here.
/* eslint-disable react-hooks/immutability */
function GameLoop({ refs, steering }: { refs: Refs; steering: ReturnType<typeof useSteering> }) {
  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const phase = useGameStore.getState().phase;

    refs.hitFlashRef.current = Math.max(0, (refs.hitFlashRef.current ?? 0) - delta * 2.2);
    refs.shieldTimeRef.current = Math.max(0, (refs.shieldTimeRef.current ?? 0) - delta);
    refs.magnetTimeRef.current = Math.max(0, (refs.magnetTimeRef.current ?? 0) - delta);
    refs.speedTimeRef.current = Math.max(0, (refs.speedTimeRef.current ?? 0) - delta);

    if (phase !== "playing") return;

    steering.applyKeyboard(delta);

    const depth = refs.depthRef.current ?? 0;
    const boosting = steering.state.current.boosting && useGameStore.getState().oxygen > 1;
    const speedMult =
      (boosting ? BOOST_SPEED_MULT : 1) * ((refs.speedTimeRef.current ?? 0) > 0 ? 1.5 : 1);
    const baseSpeed = THREE.MathUtils.clamp(
      BASE_ASCEND_SPEED + depth * SPEED_RAMP_PER_METER,
      BASE_ASCEND_SPEED,
      MAX_ASCEND_SPEED
    );
    const speed = baseSpeed * speedMult;
    refs.ascendNormRef.current = speed / (MAX_ASCEND_SPEED * BOOST_SPEED_MULT * 1.5);

    refs.depthRef.current = depth + speed * delta;

    const drain = OXYGEN_DRAIN_PER_SEC * delta + (boosting ? BOOST_OXYGEN_COST * delta : 0);
    useGameStore.getState().applyOxygenDelta(-drain);
    useGameStore.getState().addDepth(speed * delta);
    useGameStore.getState().tickCombo(delta);
  });
  return null;
}
/* eslint-enable react-hooks/immutability */

function CameraRig({
  playerPositionRef,
  speedTimeRef,
}: {
  playerPositionRef: React.RefObject<PlayerHandle>;
  speedTimeRef: React.RefObject<number>;
}) {
  const { camera } = useThree();
  const targetRef = useRef<THREE.Vector3 | null>(null);
  if (targetRef.current === null) {
    targetRef.current = new THREE.Vector3();
  }
  const baseFov = 62;

  // `camera` comes from useThree(), but driving it every frame (position,
  // fov, lookAt) via useFrame is exactly how react-three-fiber expects
  // cameras to be controlled — it's imperative scene control, not render
  // output, so it's exempt from the render-phase immutability lint.
  /* eslint-disable react-hooks/immutability */
  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const pp = playerPositionRef.current;
    if (!pp) return;
    const desired = new THREE.Vector3(pp.x * 0.55, 2.4, pp.z * 0.55 + 6.2);
    camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
    const target = targetRef.current!;
    target.set(pp.x * 0.8, 0.6, pp.z * 0.8 - 3);
    camera.lookAt(target);

    const cam = camera as THREE.PerspectiveCamera;
    const boosting = (speedTimeRef.current ?? 0) > 0;
    const targetFov = boosting ? baseFov + 6 : baseFov;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.05);
    cam.updateProjectionMatrix();
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}

export function useGameRefs(): Refs {
  const depthRef = useRef(0);
  const playerPositionRef = useRef<PlayerHandle>({ x: 0, z: 0 });
  const hitFlashRef = useRef(0);
  const shieldTimeRef = useRef(0);
  const magnetTimeRef = useRef(0);
  const speedTimeRef = useRef(0);
  const ascendNormRef = useRef(0.5);

  const phase = useGameStore((s) => s.phase);
  useEffect(() => {
    if (phase === "playing") {
      depthRef.current = 0;
      shieldTimeRef.current = 0;
      magnetTimeRef.current = 0;
      speedTimeRef.current = 0;
    }
  }, [phase]);

  return { depthRef, playerPositionRef, hitFlashRef, shieldTimeRef, magnetTimeRef, speedTimeRef, ascendNormRef };
}
