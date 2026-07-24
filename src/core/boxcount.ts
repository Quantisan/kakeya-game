// Pure box-counting dimension estimation (Level 3).
// Subjects are rasterized once onto a fine occupancy bitmap; box counts at a
// given scale aggregate pixel blocks of that bitmap. Features must be drawn
// at least ~1.5 pixels thick to register.

export type Membership = (x: number, y: number) => boolean;

/** Rasterize a membership function over the unit square. */
export function rasterize(subject: Membership, res: number): Uint8Array {
  const bitmap = new Uint8Array(res * res);
  for (let iy = 0; iy < res; iy++) {
    const y = (iy + 0.5) / res;
    for (let ix = 0; ix < res; ix++) {
      if (subject((ix + 0.5) / res, y)) bitmap[iy * res + ix] = 1;
    }
  }
  return bitmap;
}

/** Number of boxPx-sized blocks containing at least one occupied pixel. */
export function boxCount(bitmap: Uint8Array, res: number, boxPx: number): number {
  const n = Math.ceil(res / boxPx);
  let occupied = 0;
  for (let by = 0; by < n; by++) {
    for (let bx = 0; bx < n; bx++) {
      let hit = false;
      const yEnd = Math.min(res, (by + 1) * boxPx);
      const xEnd = Math.min(res, (bx + 1) * boxPx);
      for (let iy = by * boxPx; iy < yEnd && !hit; iy++) {
        for (let ix = bx * boxPx; ix < xEnd && !hit; ix++) {
          if (bitmap[iy * res + ix]) hit = true;
        }
      }
      if (hit) occupied++;
    }
  }
  return occupied;
}

export interface BoxPoint {
  /** Box size as a fraction of the unit square. */
  boxSize: number;
  count: number;
}

export function boxCounts(bitmap: Uint8Array, res: number, boxPxSizes: number[]): BoxPoint[] {
  return boxPxSizes.map((boxPx) => ({
    boxSize: boxPx / res,
    count: boxCount(bitmap, res, boxPx),
  }));
}

/** Least-squares slope of log(count) vs log(1/boxSize). */
export function dimensionSlope(points: BoxPoint[]): number {
  const pts = points.filter((p) => p.count > 0);
  if (pts.length < 2) return 0;
  const xs = pts.map((p) => Math.log(1 / p.boxSize));
  const ys = pts.map((p) => Math.log(p.count));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}
