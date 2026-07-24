// Pure model of the Besicovitch/Perron sliver construction (Level 2)
// and its "rotate instead" foil. The big triangle has base [0,1] on y=0
// and apex (0.5, 1); it is split into n slivers sharing the apex.
// Translate mode slides sliver groups sideways (Perron-tree bisection):
// direction coverage is kept and the union area shrinks.
// Rotate mode turns each sliver about its base midpoint toward vertical:
// slivers align in direction (coverage collapses) but the union area stays put.

import { Pt, Triangle, translateTri, rotateTri, sampleUnionArea } from "./geom";

export const APEX: Pt = { x: 0.5, y: 1 };

export function slivers(n: number): Triangle[] {
  const tris: Triangle[] = [];
  for (let i = 0; i < n; i++) {
    tris.push([{ x: i / n, y: 0 }, { x: (i + 1) / n, y: 0 }, { ...APEX }]);
  }
  return tris;
}

/** Axis direction of a sliver: angle of the line apex -> base midpoint. */
export function sliverAngle(t: Triangle): number {
  const mid = { x: (t[0].x + t[1].x) / 2, y: 0 };
  return Math.atan2(t[2].y - mid.y, t[2].x - mid.x);
}

/**
 * Perron-tree bisection: recursively translate the right half-group left so
 * its slivers overlap the left group's. `slide` in [0,1] interpolates from
 * the original triangle (0) to the fully packed tree (1). `alpha` is the
 * fraction of the child base width absorbed at each merge.
 */
export function perronTranslate(n: number, slide: number, alpha: number): Triangle[] {
  const base = slivers(n);
  const rec = (lo: number, hi: number): Triangle[] => {
    if (hi - lo === 1) return [base[lo]];
    const mid = (lo + hi) / 2;
    const left = rec(lo, mid);
    const right = rec(mid, hi);
    const childWidth = (hi - lo) / 2 / n;
    const dx = -slide * alpha * childWidth;
    return [...left, ...right.map((t) => translateTri(t, dx, 0))];
  };
  return rec(0, n);
}

/** Foil mode: rotate each sliver about its base midpoint toward vertical. */
export function rotateSlivers(n: number, slide: number): Triangle[] {
  return slivers(n).map((t) => {
    const mid = { x: (t[0].x + t[1].x) / 2, y: 0 };
    const target = Math.PI / 2;
    const current = sliverAngle(t);
    return rotateTri(t, mid, slide * (target - current));
  });
}

export const CONSTRUCTION_BOUNDS = { x0: -0.6, y0: 0, x1: 1.1, y1: 1.05 };

export function constructionArea(tris: Triangle[], resolution = 350): number {
  return sampleUnionArea(tris, CONSTRUCTION_BOUNDS, resolution);
}

/**
 * Distinct needle directions the slivers still cover, counted as unique axis
 * angles (translation never changes an angle; rotation merges them).
 */
export function directionsCovered(tris: Triangle[], n: number): number {
  const angles = new Set<number>();
  for (const t of tris) {
    angles.add(Math.round(sliverAngle(t) * 500));
  }
  return Math.min(n, angles.size);
}
