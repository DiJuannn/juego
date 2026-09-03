"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SKINS, type SkinId } from "@/lib/constants";
import type { SteeringState } from "@/hooks/useSteering";

export interface PlayerHandle {
  x: number;
  z: number;
}

export function Player({
  steering,
  positionRef,
  skinId,
  hitFlashRef,
  shieldRef,
  speedRef,
}: {
  steering: React.RefObject<SteeringState>;
  positionRef: React.RefObject<PlayerHandle>;
  skinId: SkinId;
  hitFlashRef: React.RefObject<number>;
  shieldRef: React.RefObject<number>;
  speedRef: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const shieldMesh = useRef<THREE.Mesh>(null);
  const skin = useMemo(() => SKINS.find((s) => s.id === skinId) ?? SKINS[0], [skinId]);

  // Patrón determinista (no Math.random) para que el render se mantenga puro.
  const spots = useMemo(() => {
    const pts: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const a = i * 2.399963; // ángulo áureo: reparte los puntos sin repetir patrón
      pts.push({
        x: Math.sin(a) * 0.22,
        y: 0.15 + ((i * 37) % 100) / 400,
        z: -0.3 + Math.cos(a * 1.7) * 0.45 + 0.45,
        s: 0.05 + ((i * 53) % 100) / 1600,
      });
    }
    return pts;
  }, []);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const st = steering.current;
    if (!st || !group.current) return;

    const lerpSpeed = 1 - Math.pow(0.0008, delta);
    group.current.position.x += (st.targetX - group.current.position.x) * lerpSpeed;
    group.current.position.z += (st.targetZ - group.current.position.z) * lerpSpeed;

    if (positionRef.current) {
      positionRef.current.x = group.current.position.x;
      positionRef.current.z = group.current.position.z;
    }

    // Bob de flotación + inclinación según dirección de movimiento (game feel).
    const vx = st.targetX - group.current.position.x;
    const vz = st.targetZ - group.current.position.z;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -vx * 0.9, 0.15);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, vz * 0.6, 0.15);
    group.current.position.y = Math.sin(t * 1.6) * 0.08;

    if (bodyMat.current) {
      const flash = hitFlashRef.current ?? 0;
      bodyMat.current.emissive.setRGB(flash, flash * 0.2, flash * 0.3);
    }

    if (shieldMesh.current) {
      const active = (shieldRef.current ?? 0) > 0;
      shieldMesh.current.visible = active;
      shieldMesh.current.rotation.y = t * 1.5;
      const scale = 1.35 + Math.sin(t * 6) * 0.03;
      shieldMesh.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={group}>
      {/* Cuerpo */}
      <mesh castShadow position={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.42, 0.7, 6, 12]} />
        <meshStandardMaterial ref={bodyMat} color={skin.color} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Vientre más claro */}
      <mesh position={[0, -0.22, 0.1]}>
        <capsuleGeometry args={[0.3, 0.6, 6, 10]} />
        <meshStandardMaterial color="#ffe8ef" roughness={0.5} transparent opacity={0.55} />
      </mesh>

      {spots.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.s, 6, 6]} />
          <meshStandardMaterial color={skin.spots} roughness={0.6} />
        </mesh>
      ))}

      {/* Cabeza */}
      <group position={[0, 0.08, 0.62]}>
        <mesh castShadow>
          <sphereGeometry args={[0.36, 16, 16]} />
          <meshStandardMaterial color={skin.color} roughness={0.35} />
        </mesh>
        {/* Sonrisa característica del ajolote: boca curva */}
        <mesh position={[0, -0.08, 0.3]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.14, 0.02, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#5a2a3a" />
        </mesh>
        {/* Ojos */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.16, 0.08, 0.28]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}
        {/* Branquias externas (3 por lado) */}
        {[-1, 1].map((side) =>
          [0, 1, 2].map((i) => (
            <group
              key={`${side}-${i}`}
              position={[side * 0.34, 0.1 + i * 0.09, -0.05 - i * 0.06]}
              rotation={[0, 0, side * (0.5 + i * 0.15)]}
            >
              <mesh>
                <coneGeometry args={[0.05, 0.32, 6]} />
                <meshStandardMaterial color={skin.spots} roughness={0.4} emissive={skin.spots} emissiveIntensity={0.15} />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* Patitas (4 nubs) */}
      {[
        [-0.35, -0.05, 0.35],
        [0.35, -0.05, 0.35],
        [-0.32, -0.05, -0.25],
        [0.32, -0.05, -0.25],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.22, 6]} />
          <meshStandardMaterial color={skin.color} roughness={0.5} />
        </mesh>
      ))}

      {/* Cola segmentada con ondulación */}
      <TailChain skin={skin} speedRef={speedRef} />

      {/* Escudo (power-up) */}
      <mesh ref={shieldMesh} visible={false}>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial
          color="#7CFC9A"
          transparent
          opacity={0.28}
          emissive="#7CFC9A"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function TailChain({
  skin,
  speedRef,
}: {
  skin: (typeof SKINS)[number];
  speedRef: React.RefObject<number>;
}) {
  const segments = 5;
  return (
    <TailSegment index={0} segments={segments} skin={skin} speedRef={speedRef} basePos={[0, 0, -0.35]} />
  );
}

// Cada segmento anima su propia rotación en su propio useFrame: no hace
// falta compartir un array de refs mutable entre componentes.
function TailSegment({
  index,
  segments,
  skin,
  speedRef,
  basePos,
}: {
  index: number;
  segments: number;
  skin: (typeof SKINS)[number];
  speedRef: React.RefObject<number>;
  basePos: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const scale = 1 - (index / segments) * 0.65;

  useFrame((state) => {
    if (!group.current) return;
    const phase = state.clock.elapsedTime * 5 - index * 0.9;
    group.current.rotation.y = Math.sin(phase) * (0.22 + index * 0.05) * (1 + (speedRef.current ?? 1) * 0.15);
  });

  return (
    <group position={basePos} ref={group}>
      <mesh position={[0, 0, -0.18 * scale]}>
        <boxGeometry args={[0.05, 0.28 * scale, 0.4 * scale]} />
        <meshStandardMaterial color={skin.color} roughness={0.4} />
      </mesh>
      {index < segments - 1 && (
        <group position={[0, 0, -0.36 * scale]}>
          <TailSegment
            index={index + 1}
            segments={segments}
            skin={skin}
            speedRef={speedRef}
            basePos={[0, 0, 0]}
          />
        </group>
      )}
    </group>
  );
}
