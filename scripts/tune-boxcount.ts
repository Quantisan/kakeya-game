// Measure the box-counting slope of the actual Level 2 construction at game
// scales, with and without the sliver-width clamp, to set the win tolerance.
import { perronTranslate, CONSTRUCTION_BOUNDS } from "../src/core/perron";
import { pointInTriangle } from "../src/core/geom";
import { rasterize, boxCounts, dimensionSlope } from "../src/core/boxcount";

const res = 512;
const B = CONSTRUCTION_BOUNDS;
const w = B.x1 - B.x0;
const h = B.y1 - B.y0;

for (const n of [4, 8, 16]) {
  const tris = perronTranslate(n, 1, 0.7);
  const bitmap = rasterize((u, v) => {
    const p = { x: B.x0 + u * w, y: B.y0 + v * h };
    return tris.some((t) => pointInTriangle(p, t));
  }, res);
  const sliverBasePx = (1 / n / w) * res;
  const windows: Record<string, number[]> = {
    coarse: [128, 96, 64, 48],
    mid: [48, 32, 24, 16],
    fine: [16, 12, 8, 6, 4],
    finest: [8, 6, 4, 3, 2],
  };
  const parts = Object.entries(windows).map(
    ([name, boxes]) => `${name}=${dimensionSlope(boxCounts(bitmap, res, boxes)).toFixed(3)}`
  );
  console.log(`n=${n} sliverBasePx=${sliverBasePx.toFixed(1)}  ${parts.join("  ")}`);
}
