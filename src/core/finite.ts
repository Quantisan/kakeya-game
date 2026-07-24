// Pure finite-field Kakeya puzzle (Level 8, bonus).
// Grid is F_q x F_q. Directions: slopes 0..q-1 plus vertical (q+1 total).
// A line in direction s with offset b is {(x, sx+b mod q)}; vertical lines
// are {(b, y)}. The player picks one line per direction; the score is the
// size of the union of the chosen lines' points.

export const Q = 5;
export const DIRECTIONS = Q + 1;

/** Points of line `offset` in direction `dir` (dir === Q means vertical). */
export function linePoints(dir: number, offset: number, q = Q): number[] {
  const pts: number[] = [];
  for (let x = 0; x < q; x++) {
    if (dir === q) pts.push(offset * q + x);
    else pts.push(x * q + ((dir * x + offset) % q));
  }
  return pts;
}

export function unionSize(offsets: number[], q = Q): number {
  const seen = new Set<number>();
  offsets.forEach((offset, dir) => {
    for (const p of linePoints(dir, offset, q)) seen.add(p);
  });
  return seen.size;
}

/** Greedy par: pick each direction's line to minimize newly added points. */
export function greedyPar(q = Q): { offsets: number[]; size: number } {
  const offsets: number[] = [];
  const seen = new Set<number>();
  for (let dir = 0; dir <= q; dir++) {
    let bestOffset = 0;
    let bestNew = Infinity;
    for (let offset = 0; offset < q; offset++) {
      const added = linePoints(dir, offset, q).filter((p) => !seen.has(p)).length;
      if (added < bestNew) {
        bestNew = added;
        bestOffset = offset;
      }
    }
    offsets.push(bestOffset);
    for (const p of linePoints(dir, bestOffset, q)) seen.add(p);
  }
  return { offsets, size: seen.size };
}

/** Exact minimum over all q^(q+1) offset choices (tiny for q=5). */
export function exactMin(q = Q): number {
  const dirs = q + 1;
  let best = Infinity;
  const offsets = new Array<number>(dirs).fill(0);
  const rec = (dir: number) => {
    if (dir === dirs) {
      best = Math.min(best, unionSize(offsets, q));
      return;
    }
    for (let o = 0; o < q; o++) {
      offsets[dir] = o;
      rec(dir + 1);
    }
  };
  rec(0);
  return best;
}
