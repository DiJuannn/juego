"use client";

import { useEffect, useRef } from "react";
import { LANE_RADIUS } from "@/lib/constants";

// Control de dirección en un disco horizontal: teclado (flechas/WASD) o
// arrastre táctil/ratón. Devuelve un ref con el objetivo {x,z} normalizado
// y si se está pulsando el botón de impulso.
export interface SteeringState {
  targetX: number;
  targetZ: number;
  boosting: boolean;
}

export function useSteering() {
  const state = useRef<SteeringState>({ targetX: 0, targetZ: 0, boosting: false });
  const keys = useRef<Record<string, boolean>>({});
  const dragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const dragBase = useRef({ x: 0, z: 0 });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Space") state.current.boosting = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === "Space") state.current.boosting = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      dragOrigin.current = { x: e.clientX, y: e.clientY };
      dragBase.current = { x: state.current.targetX, z: state.current.targetZ };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = (e.clientX - dragOrigin.current.x) / 90;
      const dy = (e.clientY - dragOrigin.current.y) / 90;
      state.current.targetX = clamp(dragBase.current.x + dx, -LANE_RADIUS, LANE_RADIUS);
      state.current.targetZ = clamp(dragBase.current.z + dy, -LANE_RADIUS, LANE_RADIUS);
    };
    const onPointerUp = () => {
      dragging.current = false;
    };
    const onPointerDown2 = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-boost-button]")) {
        state.current.boosting = true;
      }
    };
    const onPointerUp2 = () => {
      state.current.boosting = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerdown", onPointerDown2);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointerup", onPointerUp2);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerdown", onPointerDown2);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerup", onPointerUp2);
    };
  }, []);

  const applyKeyboard = (deltaSeconds: number) => {
    if (dragging.current) return;
    const speed = LANE_RADIUS * 1.6 * deltaSeconds;
    let x = state.current.targetX;
    let z = state.current.targetZ;
    if (keys.current["ArrowLeft"] || keys.current["KeyA"]) x -= speed;
    if (keys.current["ArrowRight"] || keys.current["KeyD"]) x += speed;
    if (keys.current["ArrowUp"] || keys.current["KeyW"]) z -= speed;
    if (keys.current["ArrowDown"] || keys.current["KeyS"]) z += speed;
    state.current.targetX = clamp(x, -LANE_RADIUS, LANE_RADIUS);
    state.current.targetZ = clamp(z, -LANE_RADIUS, LANE_RADIUS);
  };

  return { state, applyKeyboard };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
