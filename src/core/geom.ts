// Pure geometry: points, triangles, membership tests, sampled areas.

export interface Pt {
  x: number;
  y: number;
}

export type Triangle = [Pt, Pt, Pt];

export function translateTri(t: Triangle, dx: number, dy: number): Triangle {
  return t.map((p) => ({ x: p.x + dx, y: p.y + dy })) as Triangle;
}

export function rotateTri(t: Triangle, center: Pt, angle: number): Triangle {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return t.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c };
  }) as Triangle;
}

function sign(a: Pt, b: Pt, c: Pt): number {
  return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
}

export function pointInTriangle(p: Pt, t: Triangle): boolean {
  const d1 = sign(p, t[0], t[1]);
  const d2 = sign(p, t[1], t[2]);
  const d3 = sign(p, t[2], t[0]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export function triangleCentroid(t: Triangle): Pt {
  return { x: (t[0].x + t[1].x + t[2].x) / 3, y: (t[0].y + t[1].y + t[2].y) / 3 };
}

/** Area of the union of triangles, by grid sampling over the given bounds. */
export function sampleUnionArea(
  tris: Triangle[],
  bounds: { x0: number; y0: number; x1: number; y1: number },
  resolution: number
): number {
  const w = bounds.x1 - bounds.x0;
  const h = bounds.y1 - bounds.y0;
  const nx = resolution;
  const ny = Math.max(1, Math.round((resolution * h) / w));
  let hits = 0;
  for (let iy = 0; iy < ny; iy++) {
    const y = bounds.y0 + ((iy + 0.5) / ny) * h;
    for (let ix = 0; ix < nx; ix++) {
      const x = bounds.x0 + ((ix + 0.5) / nx) * w;
      const p = { x, y };
      for (const t of tris) {
        if (pointInTriangle(p, t)) {
          hits++;
          break;
        }
      }
    }
  }
  return (hits / (nx * ny)) * w * h;
}

/** Deterministic PRNG (mulberry32) so scattered-dust demos are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
