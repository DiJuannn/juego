"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { generateChunk, type SpawnItem } from "@/lib/chunks";
import { CHUNK_LENGTH, DESPAWN_BEHIND, SPAWN_LOOKAHEAD_CHUNKS, SURFACE_DEPTH } from "@/lib/constants";
import { Entity2D, type StageRefs } from "./Entity2D";

export interface WorldHandle {
  reset: () => void;
}

interface ActiveChunk {
  index: number;
  items: SpawnItem[];
}

export const World2D = forwardRef<
  WorldHandle,
  {
    refs: StageRefs;
    onObstacleHit: (kind: SpawnItem["kind"]) => void;
    onPickup: (kind: SpawnItem["kind"], item: SpawnItem) => void;
    active: boolean;
  }
>(function World2D({ refs, onObstacleHit, onPickup, active }, ref) {
  const [chunks, setChunks] = useState<ActiveChunk[]>([]);
  const highestGenerated = useRef(-1);
  const lowestActive = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        highestGenerated.current = -1;
        lowestActive.current = 0;
        setChunks([]);
      },
    }),
    []
  );

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const depth = refs.depthRef.current ?? 0;
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
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs estables
  }, [active]);

  return (
    <>
      {chunks.map((chunk) =>
        chunk.items.map((item) => (
          <Entity2D
            key={item.id}
            item={item}
            chunkIndex={chunk.index}
            refs={refs}
            onObstacleHit={onObstacleHit}
            onPickup={onPickup}
            active={active}
          />
        ))
      )}
    </>
  );
});
