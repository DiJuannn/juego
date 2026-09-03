"use client";

import { useEffect, useRef } from "react";
import { LANE_RADIUS } from "@/lib/constants";

// Control de un solo eje (izquierda/derecha): teclado (flechas/WASD) o
// arrastre táctil/ratón sobre el escenario. Devuelve un ref con la posición
// objetivo en % (-LANE_RADIUS..LANE_RADIUS) y si se está pulsando impulso.
export interface SteeringState {
  targetX: number;
  boosting: boolean;
}

export function useSteering() {
  const state = useRef<SteeringState>({ targetX: 0, boosting: false });
  const keys = useRef<Record<string, boolean>>({});
  const dragging = useRef(false);
  const dragOriginX = useRef(0);
  const dragBaseX = useRef(0);

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
      if ((e.target as HTMLElement)?.closest?.("[data-boost-button]")) {
        state.current.boosting = true;
        return;
      }
      dragging.current = true;
      dragOriginX.current = e.clientX;
      dragBaseX.current = state.current.targetX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dxPct = ((e.clientX - dragOriginX.current) / window.innerWidth) * 100;
      state.current.targetX = clamp(dragBaseX.current + dxPct * 1.4, -LANE_RADIUS, LANE_RADIUS);
    };
    const onPointerUp = () => {
      dragging.current = false;
      state.current.boosting = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const applyKeyboard = (deltaSeconds: number) => {
    if (dragging.current) return;
    const speed = LANE_RADIUS * 2.1 * deltaSeconds;
    let x = state.current.targetX;
    if (keys.current["ArrowLeft"] || keys.current["KeyA"]) x -= speed;
    if (keys.current["ArrowRight"] || keys.current["KeyD"]) x += speed;
    state.current.targetX = clamp(x, -LANE_RADIUS, LANE_RADIUS);
  };

  const reset = () => {
    state.current.targetX = 0;
    state.current.boosting = false;
  };

  return { state, applyKeyboard, reset };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
