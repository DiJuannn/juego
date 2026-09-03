"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { rgb, zoneColorsAtDepth, SURFACE_DEPTH } from "@/lib/constants";

export interface BackgroundHandle {
  setDepth: (depth: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const Background2D = forwardRef<BackgroundHandle>(function Background2D(_props, ref) {
  const skyRef = useRef<HTMLDivElement>(null);
  const terrainRef = useRef<SVGPathElement>(null);
  const coralRef = useRef<HTMLDivElement>(null);
  const liliesRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      setDepth(depth: number) {
        const c = zoneColorsAtDepth(depth);
        if (skyRef.current) {
          skyRef.current.style.background = `linear-gradient(to bottom, ${rgb(c.skyTop)}, ${rgb(c.skyBottom)})`;
        }
        if (terrainRef.current) {
          terrainRef.current.setAttribute("fill", rgb(c.silhouette));
          terrainRef.current.style.opacity = String(clamp01(1 - depth / 200));
        }
        if (coralRef.current) {
          const t = depth < 260 ? 0 : depth > 500 ? clamp01(1 - (depth - 500) / 160) : clamp01((depth - 260) / 100);
          coralRef.current.style.opacity = String(t);
        }
        if (liliesRef.current) {
          liliesRef.current.style.opacity = String(clamp01((depth - (SURFACE_DEPTH - 140)) / 140));
        }
      },
    }),
    []
  );

  const bubbles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        size: 6 + ((i * 13) % 18),
        duration: 9 + ((i * 7) % 10),
        delay: -((i * 3.3) % 12),
        drift: `${((i % 5) - 2) * 10}px`,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={skyRef} className="absolute inset-0 transition-none" />

      {/* Terreno rocoso del fondo, se desvanece al ascender */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "18vh" }}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
      >
        <path
          ref={terrainRef}
          d="M0,100 L0,40 Q50,10 100,35 T200,30 T300,40 T400,25 L400,100 Z"
        />
      </svg>

      {/* Coral, visible en la zona de arrecife */}
      <div ref={coralRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <CoralCluster className="absolute bottom-0 left-0" flip={false} />
        <CoralCluster className="absolute bottom-0 right-0" flip />
      </div>

      {/* Nenúfares, aparecen cerca de la superficie */}
      <div ref={liliesRef} className="absolute inset-x-0 top-0" style={{ opacity: 0, height: "22vh" }}>
        <LilyPads />
      </div>

      {/* Burbujas ambientales */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/70"
          style={{
            left: b.left,
            bottom: -20,
            width: b.size,
            height: b.size,
            animation: `bubble-rise ${b.duration}s linear infinite`,
            animationDelay: `${b.delay}s`,
            ["--drift" as string]: b.drift,
          }}
        />
      ))}

      {/* Pececillos decorativos */}
      <DecorFish top="22%" duration={22} color="#7fb2e0" />
      <DecorFish top="48%" duration={28} color="#ffb4c6" reverse />
      <DecorFish top="68%" duration={18} color="#ffe28a" />
    </div>
  );
});

function CoralCluster({ className, flip }: { className: string; flip: boolean }) {
  return (
    <svg
      className={className}
      style={{ height: "16vh", width: "36vw", transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 200 140"
      preserveAspectRatio="xMinYMax meet"
    >
      <path d="M10,140 C10,90 40,80 40,50 C40,30 30,20 20,10" fill="none" stroke="#ff9db8" strokeWidth={10} strokeLinecap="round" />
      <path d="M40,140 C40,100 65,95 65,65 C65,45 75,35 70,15" fill="none" stroke="#ffc2d1" strokeWidth={9} strokeLinecap="round" />
      <path d="M70,140 C72,95 95,90 92,55 C90,35 100,25 95,5" fill="none" stroke="#ff8fae" strokeWidth={8} strokeLinecap="round" />
      <circle cx={20} cy={8} r={7} fill="#ffd6e2" />
      <circle cx="70" cy="4" r="6" fill="#ffd6e2" />
      <circle cx="95" cy="4" r="5" fill="#ffd6e2" />
    </svg>
  );
}

function LilyPads() {
  const pads = [
    { left: "8%", size: 70 },
    { left: "28%", size: 46 },
    { left: "52%", size: 84 },
    { left: "74%", size: 54 },
    { left: "90%", size: 40 },
  ];
  return (
    <>
      {pads.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: -p.size * 0.3,
            width: p.size,
            height: p.size * 0.6,
            background: "#8fd6a0",
            border: "2px solid #6fbf86",
            clipPath: "path('M0 15 Q10 0 25 5 L30 15 Z')",
          }}
        />
      ))}
    </>
  );
}

function DecorFish({
  top,
  duration,
  color,
  reverse,
}: {
  top: string;
  duration: number;
  color: string;
  reverse?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left: 0,
        animation: `fish-swim ${duration}s linear infinite`,
        animationDirection: reverse ? "reverse" : "normal",
        opacity: 0.55,
      }}
    >
      <svg width={34} height={20} viewBox="0 0 34 20">
        <path d="M2,10 C8,0 24,0 32,5 L26,10 L32,15 C24,20 8,20 2,10 Z" fill={color} />
        <circle cx={10} cy={9} r={1.4} fill="#3b2b3f" />
      </svg>
    </div>
  );
}
