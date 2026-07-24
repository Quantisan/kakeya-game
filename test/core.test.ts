import { test } from "node:test";
import assert from "node:assert/strict";
import { perronTranslate, rotateSlivers, constructionArea, directionsCovered, CONSTRUCTION_BOUNDS } from "../src/core/perron";
import { rasterize, boxCounts, dimensionSlope } from "../src/core/boxcount";
import { waveEnergy, tubeShape, axisAngleDiff } from "../src/core/wave";
import { greedyPar, exactMin, unionSize, Q, DIRECTIONS } from "../src/core/finite";
import { pointInTriangle } from "../src/core/geom";

test("Perron translate shrinks union area while keeping every direction", () => {
  const start = constructionArea(perronTranslate(16, 0, 0.7));
  const packed = constructionArea(perronTranslate(16, 1, 0.7));
  assert.ok(Math.abs(start - 0.5) < 0.02, `start area ~0.5, got ${start}`);
  assert.ok(packed < 0.2, `packed area below Level 2 win threshold, got ${packed}`);
  assert.equal(directionsCovered(perronTranslate(16, 1, 0.7), 16), 16);
});

test("rotate mode keeps area put and collapses directions", () => {
  const tris = rotateSlivers(16, 1);
  assert.ok(constructionArea(tris) > 0.45);
  assert.equal(directionsCovered(tris, 16), 1);
});

test("box-counting slope: line ~1, Sierpinski ~1.58, filled region ~2", () => {
  const res = 256;
  const boxPx = [64, 32, 16, 8];
  // Off box boundaries: a line exactly on a shared box edge double-counts at
  // some scales and not others, skewing the fit.
  const line = dimensionSlope(boxCounts(rasterize((x, y) => Math.abs(y - 0.503) < 0.004, res), res, boxPx));
  assert.ok(line > 0.85 && line < 1.2, `line slope ~1, got ${line}`);

  const sierpinski = dimensionSlope(
    boxCounts(rasterize((x, y) => ((Math.floor(x * res) & Math.floor(y * res)) === 0 ? true : false), res), res, boxPx)
  );
  assert.ok(Math.abs(sierpinski - Math.log(3) / Math.log(2)) < 0.1, `Sierpinski slope ~1.585, got ${sierpinski}`);

  const filled = dimensionSlope(boxCounts(rasterize(() => true, res), res, boxPx));
  assert.ok(Math.abs(filled - 2) < 0.01, `filled square slope 2, got ${filled}`);
});

test("packed construction: slope climbs toward 2 at fine grids while area stays small", () => {
  const res = 512;
  const B = CONSTRUCTION_BOUNDS;
  const tris = perronTranslate(16, 1, 0.7);
  const bitmap = rasterize((u, v) => {
    const p = { x: B.x0 + u * (B.x1 - B.x0), y: B.y0 + v * (B.y1 - B.y0) };
    return tris.some((t) => pointInTriangle(p, t));
  }, res);
  const coarse = dimensionSlope(boxCounts(bitmap, res, [128, 96, 64, 48]));
  const finest = dimensionSlope(boxCounts(bitmap, res, [8, 6, 4, 3, 2]));
  assert.ok(finest > coarse, `slope climbs with refinement: ${coarse} -> ${finest}`);
  assert.ok(finest >= 1.65, `finest-window slope clears the Level 3 win threshold, got ${finest}`);
});

test("narrow frequency wedge produces a long thin tube along the wedge direction", () => {
  const spec = { res: 96, waves: 41, cycles: 20 };
  const narrow = tubeShape(waveEnergy({ angle: Math.PI / 6, width: 0.3 }, spec), spec.res);
  const wide = tubeShape(waveEnergy({ angle: Math.PI / 6, width: 2.0 }, spec), spec.res);
  assert.ok(narrow.aspect > wide.aspect * 1.5, `narrow wedge more elongated: ${narrow.aspect} vs ${wide.aspect}`);
  // The packet is a beam: its long axis lies along the mean wavevector.
  assert.ok(axisAngleDiff(narrow.orientation, Math.PI / 6) < 0.2, `orientation along wedge axis, off by ${axisAngleDiff(narrow.orientation, Math.PI / 6)}`);
});

test("finite-field puzzle: greedy par is achievable and bounded by exact minimum", () => {
  const par = greedyPar();
  const min = exactMin();
  assert.equal(unionSize(par.offsets), par.size);
  assert.ok(min <= par.size, `exact min ${min} <= greedy ${par.size}`);
  assert.ok(min >= Q * DIRECTIONS - (DIRECTIONS * (DIRECTIONS - 1)) / 2 - Q, "sane lower bound");
  assert.ok(par.size <= Q * Q, "par fits in the grid");
});
