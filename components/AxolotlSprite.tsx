"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { SKINS, type SkinId } from "@/lib/constants";

export interface AxolotlHandle {
  setLean: (deg: number) => void;
  setHitFlash: (v: number) => void;
  setShieldActive: (active: boolean) => void;
  setSpeedNorm: (v: number) => void;
}

const OUTLINE = "#5b4b63";

export const AxolotlSprite = forwardRef<AxolotlHandle, { skinId: SkinId; size?: number }>(
  function AxolotlSprite({ skinId, size = 120 }, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const flashRef = useRef<SVGEllipseElement>(null);
    const shieldRef = useRef<SVGCircleElement>(null);
    const skin = useMemo(() => SKINS.find((s) => s.id === skinId) ?? SKINS[0], [skinId]);

    useImperativeHandle(
      ref,
      () => ({
        setLean(deg: number) {
          if (rootRef.current) rootRef.current.style.transform = `rotate(${deg}deg)`;
        },
        setHitFlash(v: number) {
          if (flashRef.current) flashRef.current.style.opacity = String(v);
        },
        setShieldActive(active: boolean) {
          if (shieldRef.current) shieldRef.current.style.display = active ? "" : "none";
        },
        setSpeedNorm(v: number) {
          if (rootRef.current) rootRef.current.style.setProperty("--swim-speed", String(0.6 + v * 0.9));
        },
      }),
      []
    );

    return (
      <div
        ref={rootRef}
        className="axolotl-sprite"
        style={{ width: size, height: size * 1.15, ["--swim-speed" as string]: 1 }}
      >
        <div className="axolotl-bob" style={{ width: "100%", height: "100%" }}>
          <svg viewBox="0 0 200 240" width="100%" height="100%">
            {/* Cola ondulante */}
            <g className="axolotl-tail" style={{ transformOrigin: "100px 150px" }}>
              <path
                d="M -20,-10 C -30,15 -18,55 0,88 C 18,55 30,15 20,-10 C 10,-20 -10,-20 -20,-10 Z"
                transform="translate(100,150)"
                fill={skin.body}
                stroke={OUTLINE}
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <path
                d="M 0,-6 C -6,20 -3,48 0,72"
                transform="translate(100,150)"
                fill="none"
                stroke={skin.gill}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.7}
              />
            </g>

            {/* Patitas */}
            {[
              [76, 176, -20],
              [124, 176, 20],
              [80, 197, -12],
              [120, 197, 12],
            ].map(([x, y, rot], i) => (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx={10}
                ry={7}
                transform={`rotate(${rot} ${x} ${y})`}
                fill={skin.body}
                stroke={OUTLINE}
                strokeWidth={2.5}
              />
            ))}

            {/* Cuerpo */}
            <ellipse cx={100} cy={142} rx={46} ry={58} fill={skin.body} stroke={OUTLINE} strokeWidth={3.5} />
            <ellipse cx={100} cy={158} rx={26} ry={34} fill="#ffffff" opacity={0.35} />

            {/* Branquias (detrás de la cabeza) */}
            <Gills side="left" skin={skin} />
            <Gills side="right" skin={skin} />

            {/* Cabeza */}
            <circle cx={100} cy={76} r={54} fill={skin.body} stroke={OUTLINE} strokeWidth={3.5} />

            {/* Mejillas */}
            <circle cx={68} cy={90} r={11} fill={skin.blush} opacity={0.8} />
            <circle cx={132} cy={90} r={11} fill={skin.blush} opacity={0.8} />

            {/* Ojos */}
            <g className="axolotl-eyes" style={{ transformOrigin: "100px 70px" }}>
              <ellipse cx={82} cy={68} rx={7.5} ry={9.5} fill="#3b2b3f" />
              <ellipse cx={118} cy={68} rx={7.5} ry={9.5} fill="#3b2b3f" />
              <circle cx={79.5} cy={64} r={2.2} fill="#ffffff" />
              <circle cx={115.5} cy={64} r={2.2} fill="#ffffff" />
            </g>

            {/* Boca */}
            <path
              d="M 92,96 Q 100,102 108,96"
              fill="none"
              stroke="#3b2b3f"
              strokeWidth={2.6}
              strokeLinecap="round"
            />

            {/* Escudo (power-up) */}
            <circle
              ref={shieldRef}
              cx={100}
              cy={130}
              r={98}
              fill="none"
              stroke="#8CF2A6"
              strokeWidth={6}
              opacity={0.7}
              style={{ display: "none" }}
              className="axolotl-shield"
            />

            {/* Destello al chocar */}
            <ellipse cx={100} cy={130} rx={80} ry={100} fill="#ff5d5d" opacity={0} ref={flashRef} />
          </svg>
        </div>
      </div>
    );
  }
);

function Gills({ side, skin }: { side: "left" | "right"; skin: (typeof SKINS)[number] }) {
  const attachX = side === "left" ? 50 : 150;
  const attachY = 84;
  // El pétalo base apunta hacia -Y (arriba) en local; rotar ±90° lo orienta
  // hacia afuera (izquierda/derecha) para que abaniquen desde la cabeza.
  const baseAngle = side === "left" ? -90 : 90;
  const fanAngles = [-30, 0, 30];

  return (
    <g>
      {fanAngles.map((a, i) => (
        <g key={i} transform={`translate(${attachX},${attachY}) rotate(${baseAngle + a})`}>
          <path
            d="M0,0 C -9,-10 -9,-30 0,-42 C 9,-30 9,-10 0,0 Z"
            fill={skin.gill}
            stroke={OUTLINE}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
}
