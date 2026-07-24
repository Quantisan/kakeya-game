// Pure wave-packet math (Level 4): sum plane waves whose wavevectors sit in
// an angular wedge of frequency space, then measure the resulting energy
// blob's orientation and aspect ratio from its second moments.

export interface WedgeSpec {
  /** Center angle of the wedge in frequency space, radians. */
  angle: number;
  /** Full angular width of the wedge, radians. */
  width: number;
}

export interface FieldSpec {
  /** Grid resolution (grid is res x res over [-1,1]^2). */
  res: number;
  /** Number of plane waves summed. */
  waves: number;
  /** Wavevector magnitude in cycles across the domain. */
  cycles: number;
}

/** Energy field u(x)^2 where u = sum of cos(k.x), k sampled inside the wedge. */
export function waveEnergy(wedge: WedgeSpec, spec: FieldSpec): Float32Array {
  const { res, waves, cycles } = spec;
  const ks: { kx: number; ky: number }[] = [];
  for (let i = 0; i < waves; i++) {
    const t = waves === 1 ? 0.5 : i / (waves - 1);
    const a = wedge.angle + (t - 0.5) * wedge.width;
    const mag = Math.PI * cycles;
    ks.push({ kx: mag * Math.cos(a), ky: mag * Math.sin(a) });
  }
  const out = new Float32Array(res * res);
  for (let iy = 0; iy < res; iy++) {
    const y = (iy / (res - 1)) * 2 - 1;
    for (let ix = 0; ix < res; ix++) {
      const x = (ix / (res - 1)) * 2 - 1;
      let u = 0;
      for (const k of ks) u += Math.cos(k.kx * x + k.ky * y);
      out[iy * res + ix] = u * u;
    }
  }
  return out;
}

export interface TubeShape {
  /** Principal-axis angle of the energy blob, radians in [0, pi). */
  orientation: number;
  /** Long-axis / short-axis standard-deviation ratio. */
  aspect: number;
}

/** Orientation and aspect from energy-weighted second moments about center. */
export function tubeShape(energy: Float32Array, res: number): TubeShape {
  let total = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let iy = 0; iy < res; iy++) {
    const y = (iy / (res - 1)) * 2 - 1;
    for (let ix = 0; ix < res; ix++) {
      const x = (ix / (res - 1)) * 2 - 1;
      const e = energy[iy * res + ix];
      total += e;
      sxx += e * x * x;
      syy += e * y * y;
      sxy += e * x * y;
    }
  }
  if (total === 0) return { orientation: 0, aspect: 1 };
  sxx /= total;
  syy /= total;
  sxy /= total;
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  let orientation = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  if (orientation < 0) orientation += Math.PI;
  return { orientation, aspect: l2 > 1e-9 ? Math.sqrt(l1 / l2) : 99 };
}

/** Smallest absolute difference between two axis angles (mod pi). */
export function axisAngleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d;
}
