"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { SpawnItem } from "@/lib/chunks";
import { CHUNK_LENGTH } from "@/lib/constants";
import type { PlayerHandle } from "./Player";

const OBSTACLE_RADIUS: Record<string, number> = {
  jellyfish: 0.85,
  urchin: 0.7,
  net: 0.65,
  predator: 0.95,
};
const PICKUP_RADIUS: Record<string, number> = {
  pearl: 0.55,
  oxygen: 0.7,
  shield: 0.75,
  magnet: 0.75,
  speed: 0.75,
};
const PLAYER_RADIUS = 0.55;

export function Entity({
  item,
  chunkIndex,
  depthRef,
  playerPositionRef,
  magnetTimeRef,
  onObstacleHit,
  onPickup,
  active,
}: {
  item: SpawnItem;
  chunkIndex: number;
  depthRef: React.RefObject<number>;
  playerPositionRef: React.RefObject<PlayerHandle>;
  magnetTimeRef: React.RefObject<number>;
  onObstacleHit: (kind: SpawnItem["kind"]) => void;
  onPickup: (kind: SpawnItem["kind"], item: SpawnItem) => void;
  active: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  // Guardia local sincrónica: evita contar el mismo golpe dos veces antes de
  // que el setState de abajo llegue a re-renderizar (los refs no mutan props).
  const resolvedRef = useRef(false);
  const [collected, setCollected] = useState(false);
  const baseY = chunkIndex * CHUNK_LENGTH + item.yOffset;

  useFrame((state) => {
    if (!group.current || !active) return;
    const t = state.clock.elapsedTime;
    const depth = depthRef.current ?? 0;
    const worldY = baseY - depth;
    group.current.position.y = worldY;

    let x = item.x;
    let z = item.z;
    if (item.kind === "predator") {
      x += Math.sin(t * 1.4 + item.seed * 10) * 1.4;
      z += Math.cos(t * 1.1 + item.seed * 10) * 0.6;
    } else if (!item.isObstacle) {
      group.current.position.y += Math.sin(t * 2 + item.seed * 20) * 0.12;
      group.current.rotation.y = t * (item.kind === "pearl" ? 1.6 : 0.6);
    } else if (item.kind === "jellyfish") {
      group.current.scale.setScalar(1 + Math.sin(t * 3 + item.seed * 10) * 0.06);
    }
    group.current.position.x = x;
    group.current.position.z = z;

    if (resolvedRef.current || Math.abs(worldY) > 0.85) return;

    const pp = playerPositionRef.current;
    if (!pp) return;
    let radius = (item.isObstacle ? OBSTACLE_RADIUS[item.kind] : PICKUP_RADIUS[item.kind]) + PLAYER_RADIUS;
    if (!item.isObstacle && (item.kind === "pearl" || item.kind === "oxygen") && (magnetTimeRef.current ?? 0) > 0) {
      radius += 2.2;
    }
    const dx = x - pp.x;
    const dz = z - pp.z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= radius * radius) {
      resolvedRef.current = true;
      if (item.isObstacle) {
        onObstacleHit(item.kind);
      } else {
        onPickup(item.kind, item);
        setCollected(true);
      }
    }
  });

  if (collected) return null;

  return (
    <group ref={group} position={[item.x, baseY, item.z]}>
      <EntityVisual item={item} />
    </group>
  );
}

function EntityVisual({ item }: { item: SpawnItem }) {
  switch (item.kind) {
    case "jellyfish":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial
              color="#c9a6ff"
              transparent
              opacity={0.55}
              emissive="#a06bff"
              emissiveIntensity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 0.3, -0.5, Math.sin((i / 4) * Math.PI * 2) * 0.3]}>
              <cylinderGeometry args={[0.03, 0.02, 0.9, 4]} />
              <meshStandardMaterial color="#a06bff" transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      );
    case "urchin":
      return (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial color="#241a3a" roughness={0.8} />
          </mesh>
          {Array.from({ length: 12 }).map((_, i) => {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / 12);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            const dir = new THREE.Vector3(
              Math.cos(theta) * Math.sin(phi),
              Math.sin(theta) * Math.sin(phi),
              Math.cos(phi)
            );
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              dir
            );
            return (
              <mesh key={i} position={dir.clone().multiplyScalar(0.4)} quaternion={quaternion}>
                <coneGeometry args={[0.05, 0.5, 4]} />
                <meshStandardMaterial color="#4b2e7a" roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      );
    case "net":
      return (
        <mesh rotation={[0, 0, 0]}>
          <planeGeometry args={[1.6, 1.6, 6, 6]} />
          <meshStandardMaterial color="#8a7355" wireframe transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      );
    case "predator":
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.4, 1.5, 8]} />
            <meshStandardMaterial color="#ff5d3a" emissive="#ff2200" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0.15, 0.15, 0.5]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#fff200" emissive="#fff200" emissiveIntensity={1} />
          </mesh>
          <mesh position={[-0.15, 0.15, 0.5]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#fff200" emissive="#fff200" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    case "pearl":
      return (
        <mesh>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshStandardMaterial color="#fff7d6" emissive="#ffe9a3" emissiveIntensity={0.9} roughness={0.2} />
        </mesh>
      );
    case "oxygen":
      return (
        <mesh>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial
            color="#bdf3ff"
            transparent
            opacity={0.45}
            emissive="#7fe0ff"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
      );
    case "shield":
      return (
        <mesh>
          <torusKnotGeometry args={[0.32, 0.08, 64, 8, 2, 3]} />
          <meshStandardMaterial color="#7CFC9A" emissive="#43d16a" emissiveIntensity={0.6} />
        </mesh>
      );
    case "magnet":
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.12, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#ff9f45" emissive="#ff7a00" emissiveIntensity={0.6} />
        </mesh>
      );
    case "speed":
      return (
        <group rotation={[Math.PI, 0, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <coneGeometry args={[0.28, 0.4, 6]} />
            <meshStandardMaterial color="#5ad1ff" emissive="#2fa8ff" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <coneGeometry args={[0.22, 0.35, 6]} />
            <meshStandardMaterial color="#5ad1ff" emissive="#2fa8ff" emissiveIntensity={0.5} transparent opacity={0.7} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
