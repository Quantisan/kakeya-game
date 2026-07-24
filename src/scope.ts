// The signature: a small oscilloscope strip that reacts to every level's key
// quantity, unexplained until the wave level pays it off. Alignment 0 shows
// scrambled phases; alignment 1 lines the phases up into one sharp packet —
// the same "waves conspiring" idea the game builds toward.

const HARMONICS = [1, 2, 3, 5, 7, 9, 11];
const SCRAMBLE = [2.1, 5.5, 1.3, 4.4, 0.7, 3.8, 5.9];

let alignment = 0;
let target = 0;

export function setScopeAlignment(a: number): void {
  target = Math.max(0, Math.min(1, a));
}

export function mountScope(canvas: HTMLCanvasElement, reducedMotion: boolean): void {
  const ctx = canvas.getContext("2d")!;
  const draw = (time: number) => {
    alignment += (target - alignment) * 0.06;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#233247";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    ctx.strokeStyle = "#FFB000";
    ctx.lineWidth = 1.6;
    ctx.shadowColor = "rgba(255, 176, 0, 0.6)";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    const drift = reducedMotion ? 0 : time * 0.0011;
    for (let x = 0; x < w; x++) {
      const t = (x / w) * 2 - 1;
      let y = 0;
      for (let j = 0; j < HARMONICS.length; j++) {
        const phase = (1 - alignment) * SCRAMBLE[j];
        y += (1 / (1 + j * 0.6)) * Math.sin(Math.PI * HARMONICS[j] * (t - drift) + phase);
      }
      const py = h / 2 - y * (h / 7.5);
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  if (reducedMotion) {
    // Redraw only when alignment changes meaningfully.
    let last = -1;
    setInterval(() => {
      if (Math.abs(target - last) > 0.02) {
        alignment = target;
        last = target;
        draw(0);
      }
    }, 300);
    draw(0);
  } else {
    const loop = (time: number) => {
      draw(time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
