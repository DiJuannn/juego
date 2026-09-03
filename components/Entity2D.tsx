"use client";

import { useEffect, useRef, useState } from "react";
import type { SpawnItem } from "@/lib/chunks";
import { CHUNK_LENGTH, LANE_RADIUS, PLAYER_RADIUS_PCT } from "@/lib/constants";

const OBSTACLE_RADIUS: Record<string, number> = {
  jellyfish: 9,
  urchin: 7,
  net: 9,
  predator: 10,
};
const PICKUP_RADIUS: Record<string, number> = {
  pearl: 6,
  oxygen: 8,
  shield: 8,
  magnet: 8,
  speed: 8,
};

export const PLAYER_SCREEN_Y_FRACTION = 0.6;

export interface StageRefs {
  depthRef: React.RefObject<number>;
  pxPerMeterRef: React.RefObject<number>;
  containerSizeRef: React.RefObject<{ width: number; height: number }>;
  playerXRef: React.RefObject<number>;
  magnetTimeRef: React.RefObject<number>;
}

export function Entity2D({
  item,
  chunkIndex,
  refs,
  onObstacleHit,
  onPickup,
  active,
}: {
  item: SpawnItem;
  chunkIndex: number;
  refs: StageRefs;
  onObstacleHit: (kind: SpawnItem["kind"]) => void;
  onPickup: (kind: SpawnItem["kind"], item: SpawnItem) => void;
  active: boolean;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef(false);
  const [collected, setCollected] = useState(false);
  const baseY = chunkIndex * CHUNK_LENGTH + item.yOffset;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = (now - start) / 1000;
      const depth = refs.depthRef.current ?? 0;
      const relY = baseY - depth;

      let x = item.x;
      if (item.kind === "predator") {
        x = Math.max(-LANE_RADIUS, Math.min(LANE_RADIUS, item.x + Math.sin(t * 1.4 + item.seed * 10) * 8));
      }

      const { width, height } = refs.containerSizeRef.current ?? { width: 0, height: 0 };
      const pxPerMeter = refs.pxPerMeterRef.current ?? 1;
      const bob = !item.isObstacle ? Math.sin(t * 2.4 + item.seed * 20) * 6 : 0;
      const screenX = (0.5 + x / 100) * width;
      const screenY = height * PLAYER_SCREEN_Y_FRACTION - relY * pxPerMeter + bob;

      const el = elRef.current;
      if (el) {
        const scale = item.kind === "jellyfish" ? 1 + Math.sin(t * 3 + item.seed * 10) * 0.05 : 1;
        const rot = !item.isObstacle ? t * (item.kind === "pearl" ? 90 : 20) : 0;
        el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px) rotate(${rot}deg) scale(${scale})`;
      }

      if (resolvedRef.current || Math.abs(relY) > 0.8 || width === 0) return;

      const playerX = refs.playerXRef.current ?? 0;
      let radiusPct = (item.isObstacle ? OBSTACLE_RADIUS[item.kind] : PICKUP_RADIUS[item.kind]) + PLAYER_RADIUS_PCT;
      if (!item.isObstacle && (item.kind === "pearl" || item.kind === "oxygen") && (refs.magnetTimeRef.current ?? 0) > 0) {
        radiusPct += 16;
      }
      if (Math.abs(x - playerX) <= radiusPct) {
        resolvedRef.current = true;
        if (item.isObstacle) {
          onObstacleHit(item.kind);
        } else {
          onPickup(item.kind, item);
          setCollected(true);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depende de refs estables, no de valores reactivos
  }, [active]);

  if (collected) return null;

  return (
    <div ref={elRef} className="absolute top-0 left-0 will-change-transform">
      <EntityVisual item={item} />
    </div>
  );
}

const OUTLINE = "#5b4b63";

function EntityVisual({ item }: { item: SpawnItem }) {
  switch (item.kind) {
    case "jellyfish":
      return (
        <svg width={56} height={56} viewBox="0 0 56 56">
          <path d="M10,26 Q10,8 28,8 Q46,8 46,26 Z" fill="#c9a6f2" stroke={OUTLINE} strokeWidth={2.5} />
          <circle cx={21} cy={20} r={2.2} fill={OUTLINE} />
          <circle cx={35} cy={20} r={2.2} fill={OUTLINE} />
          {[16, 24, 32, 40].map((x, i) => (
            <path
              key={i}
              d={`M${x},27 Q${x + (i % 2 ? 4 : -4)},38 ${x},48`}
              fill="none"
              stroke="#c9a6f2"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
    case "urchin":
      return (
        <svg width={48} height={48} viewBox="0 0 48 48">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={24}
                y1={24}
                x2={24 + Math.cos(a) * 22}
                y2={24 + Math.sin(a) * 22}
                stroke="#4b3a63"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={24} cy={24} r={11} fill="#6a4f8f" stroke={OUTLINE} strokeWidth={2} />
        </svg>
      );
    case "net":
      return (
        <svg width={60} height={60} viewBox="0 0 60 60" opacity={0.9}>
          <rect x={4} y={4} width={52} height={52} rx={8} fill="#e6d3ad" opacity={0.35} stroke="#b99a63" strokeWidth={2} />
          {[16, 30, 44].map((v, i) => (
            <line key={`h${i}`} x1={4} y1={v} x2={56} y2={v} stroke="#b99a63" strokeWidth={2} />
          ))}
          {[16, 30, 44].map((v, i) => (
            <line key={`v${i}`} x1={v} y1={4} x2={v} y2={56} stroke="#b99a63" strokeWidth={2} />
          ))}
        </svg>
      );
    case "predator":
      return (
        <svg width={64} height={44} viewBox="0 0 64 44">
          <path d="M4,22 C14,4 50,4 60,14 L52,22 L60,30 C50,40 14,40 4,22 Z" fill="#ff8a65" stroke={OUTLINE} strokeWidth={2.5} />
          <path d="M18,22 L26,16 L26,28 Z" fill="#ffb199" />
          <circle cx={22} cy={16} r={2.4} fill={OUTLINE} />
          <path d="M14,10 L20,14 M14,10 L10,15" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
    case "pearl":
      return (
        <svg width={30} height={30} viewBox="0 0 30 30">
          <circle cx={15} cy={15} r={11} fill="#fff2c9" stroke="#f0c96b" strokeWidth={2} />
          <circle cx={11} cy={11} r={3} fill="#ffffff" opacity={0.9} />
        </svg>
      );
    case "oxygen":
      return (
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={16} fill="#d8f3ff" opacity={0.7} stroke="#8fd9f2" strokeWidth={2} />
          <circle cx={14} cy={13} r={4} fill="#ffffff" opacity={0.8} />
        </svg>
      );
    case "shield":
      return <Badge color="#8CF2A6" icon="M16,4 L27,9 V17 C27,24 22,28 16,30 C10,28 5,24 5,17 V9 Z" />;
    case "magnet":
      return <Badge color="#ffb066" icon="M11,6 V17 A5,5 0 0 0 21,17 V6" iconOnly />;
    case "speed":
      return <Badge color="#8fd0ff" icon="M17,3 L7,18 H15 L13,29 L25,13 H17 Z" />;
    default:
      return null;
  }
}

function Badge({ color, icon, iconOnly }: { color: string; icon: string; iconOnly?: boolean }) {
  return (
    <svg width={44} height={44} viewBox="0 0 32 32">
      <circle cx={16} cy={16} r={15} fill={color} stroke="#ffffff" strokeWidth={2.5} />
      <path
        d={icon}
        fill={iconOnly ? "none" : "#ffffff"}
        stroke="#ffffff"
        strokeWidth={iconOnly ? 3.5 : 0}
        strokeLinecap="round"
      />
    </svg>
  );
}
