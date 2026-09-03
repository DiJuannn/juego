"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getZoneForDepth, lerpZone, ZONES, type ZoneId } from "@/lib/constants";

export function Environment({ depthRef }: { depthRef: React.RefObject<number> }) {
  const { scene, gl } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const [zoneId, setZoneId] = useState<ZoneId>("abismo");
  const lastZone = useRef<ZoneId>("abismo");
  // useRef (no useMemo): este objeto de Three.js se muta cada frame a propósito.
  const fogRef = useRef<THREE.FogExp2 | null>(null);
  if (fogRef.current === null) {
    fogRef.current = new THREE.FogExp2("#01030a", 0.05);
  }

  // `scene` es el objeto Three.js real de la escena (viene de useThree()):
  // asignarle `.fog` es la única forma de fijar la niebla, como en cualquier
  // app de three.js/r3f — no es una mutación de estado de React.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    scene.fog = fogRef.current;
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  /* eslint-enable react-hooks/immutability */

  useFrame(() => {
    const depth = depthRef.current ?? 0;
    const currentZone = getZoneForDepth(depth);
    const idx = ZONES.findIndex((z) => z.id === currentZone.id);
    const next = ZONES[idx + 1];
    let params = currentZone;
    let t = 0;
    if (next) {
      t = THREE.MathUtils.clamp((depth - currentZone.fromDepth) / (next.fromDepth - currentZone.fromDepth), 0, 1);
      params = { ...currentZone, ...lerpZone(currentZone, next, t) } as typeof currentZone;
    }

    const fogColor = new THREE.Color(...params.fogColor);
    const fog = fogRef.current;
    if (fog) {
      fog.color.copy(fogColor);
      fog.density = params.fogDensity;
    }
    gl.setClearColor(fogColor, 1);

    if (ambientRef.current) {
      ambientRef.current.color.setRGB(...params.ambientColor);
      ambientRef.current.intensity = params.ambientIntensity;
    }
    if (keyLightRef.current) {
      keyLightRef.current.color.setRGB(...params.lightColor);
      keyLightRef.current.intensity = params.lightIntensity;
    }

    if (currentZone.id !== lastZone.current) {
      lastZone.current = currentZone.id;
      setZoneId(currentZone.id);
    }
  });

  const zone = ZONES.find((z) => z.id === zoneId) ?? ZONES[0];

  return (
    <>
      <ambientLight ref={ambientRef} />
      <directionalLight ref={keyLightRef} position={[3, 12, 4]} />
      <Sparkles
        count={140}
        scale={[10, 40, 10]}
        size={2.2}
        speed={0.25}
        opacity={0.6}
        color={zone.particleColor}
        position={[0, 8, 0]}
      />
      <Sparkles
        count={60}
        scale={[6, 20, 6]}
        size={4}
        speed={0.6}
        opacity={0.35}
        color={zone.accentColor}
        position={[0, 4, 0]}
      />
    </>
  );
}
