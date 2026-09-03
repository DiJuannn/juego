"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { generateChunk, type SpawnItem } from "@/lib/chunks";
import { CHUNK_LENGTH, DESPAWN_BEHIND, SPAWN_LOOKAHEAD_CHUNKS, SURFACE_DEPTH } from "@/lib/constants";
import { Entity } from "./Entity";
import type { PlayerHandle } from "./Player";

interface ActiveChunk {
  index: number;
  items: SpawnItem[];
}

export function World({
  depthRef,
  playerPositionRef,
  magnetTimeRef,
  onObstacleHit,
  onPickup,
  active,
}: {
  depthRef: React.RefObject<number>;
  playerPositionRef: React.RefObject<PlayerHandle>;
  magnetTimeRef: React.RefObject<number>;
  onObstacleHit: (kind: SpawnItem["kind"]) => void;
  onPickup: (kind: SpawnItem["kind"], item: SpawnItem) => void;
  active: boolean;
}) {
  const [chunks, setChunks] = useState<ActiveChunk[]>([]);
  const highestGenerated = useRef(-1);
  const lowestActive = useRef(0);

  useFrame(() => {
    if (!active) return;
    const depth = depthRef.current ?? 0;
    const difficulty = Math.min(1, depth / SURFACE_DEPTH);

    const wantIndexUpTo = Math.floor((depth + SPAWN_LOOKAHEAD_CHUNKS * CHUNK_LENGTH) / CHUNK_LENGTH);
    if (wantIndexUpTo > highestGenerated.current) {
      const newChunks: ActiveChunk[] = [];
      for (let i = highestGenerated.current + 1; i <= wantIndexUpTo; i++) {
        newChunks.push({ index: i, items: generateChunk(i, difficulty) });
      }
      highestGenerated.current = wantIndexUpTo;
      setChunks((prev) => [...prev, ...newChunks]);
    }

    const cutoff = (depth - DESPAWN_BEHIND) / CHUNK_LENGTH - 1;
    if (cutoff > lowestActive.current) {
      lowestActive.current = Math.floor(cutoff);
      setChunks((prev) => prev.filter((c) => c.index >= cutoff));
    }
  });

  return (
    <group>
      {chunks.map((chunk) =>
        chunk.items.map((item) => (
          <Entity
            key={item.id}
            item={item}
            chunkIndex={chunk.index}
            depthRef={depthRef}
            playerPositionRef={playerPositionRef}
            magnetTimeRef={magnetTimeRef}
            onObstacleHit={onObstacleHit}
            onPickup={onPickup}
            active={active}
          />
        ))
      )}
    </group>
  );
}
