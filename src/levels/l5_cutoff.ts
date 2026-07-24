// Level 5: Fefferman's mechanism. Pack near-parallel wave-packet tubes into
// almost no area (your Besicovitch score is the par), then apply the sharp
// frequency cutoff: each packet's energy moves to a shifted, disjoint copy.
// Spread-out output over packed-in input = a computed blowup ratio.
import { LevelDef } from "../level";
import { el, readout, formalize } from "../dom";
import { PaintLayer } from "../paint";

const N = 9;
const ANGLES = Array.from({ length: N }, (_, i) => ((32 + i * 2) * Math.PI) / 180);
const TUBE_L = 180; // px = 1 unit
const TUBE_W = 7;
const BW = 320;
const BH = 320;
const AW = 340;
const AH = 420;
const UNSAFE = 1.7;

interface Tube {
  x: number;
  y: number;
  angle: number;
}

function traceTube(g: CanvasRenderingContext2D, t: Tube): void {
  g.save();
  g.translate(t.x, t.y);
  g.rotate(t.angle);
  g.rect(-TUBE_L / 2, -TUBE_W / 2, TUBE_L, TUBE_W);
  g.restore();
}

export const l5: LevelDef = {
  navTitle: "Break the cutoff",
  year: "1971 · Fefferman",
  title: "Pack the Tubes, Break the Cutoff",
  lede:
    "Nine wave packets from neighboring frequency wedges — nine nearly-parallel tubes. Drag them into as little area as you can (Besicovitch's trick, repeated across every angular scale, does this for all directions at once). Then apply a sharp frequency cutoff and watch what it does to packed waves.",
  card: {
    title: "Small Kakeya sets break sharp frequency cutoffs",
    body:
      "Fefferman, 1971: pack tubes into almost no area; a sharp ball cutoff shovels each packet onto a shifted, spread-out copy. Output-to-input imbalance grows as the packing shrinks — so in 2D and up, sharply truncating a Fourier transform and summing back fails to reconstruct reliably (for p ≠ 2). The needle broke the filter.",
  },
  mount(container, ctx) {
    const par = Math.max(0.12, ctx.state.l2BestArea ?? 0.2);
    const before = el("canvas", { class: "board", width: String(BW), height: String(BH) });
    const after = el("canvas", { class: "board", width: String(AW), height: String(AH), hidden: "" });
    const beforePaint = new PaintLayer(BW, BH);
    const afterPaint = new PaintLayer(AW, AH);
    const areaOut = readout("packed area", "—");
    const parOut = readout("par (your level-2 score)", par.toFixed(3));
    const ratioOut = readout("output ÷ input area", "—");
    const verdict = el("p", { class: "verdict", text: "" });
    const cutoffBtn = el("button", { class: "act", text: "Apply sharp cutoff", disabled: "" });

    const tubes: Tube[] = ANGLES.map((angle, i) => ({
      x: 60 + (i % 3) * 100,
      y: 60 + Math.floor(i / 3) * 100,
      angle,
    }));
    let packedArea = 1;
    let cutoffDone = false;

    const bg = before.getContext("2d")!;
    function render(): void {
      bg.fillStyle = "#0E1520";
      bg.fillRect(0, 0, BW, BH);
      beforePaint.clear();
      beforePaint.ctx.fillStyle = "#fff";
      beforePaint.ctx.beginPath();
      for (const t of tubes) traceTube(beforePaint.ctx, t);
      beforePaint.ctx.fill();
      for (const t of tubes) {
        bg.fillStyle = "rgba(255, 176, 0, 0.4)";
        bg.strokeStyle = "#FFB000";
        bg.beginPath();
        traceTube(bg, t);
        bg.fill();
        bg.stroke();
      }
      bg.fillStyle = "#8A9BB4";
      bg.font = "11px ui-monospace, Menlo, monospace";
      bg.fillText("before the cutoff — drag tubes", 10, 16);

      packedArea = beforePaint.area(TUBE_L);
      areaOut.set(packedArea.toFixed(3), packedArea <= par ? "good" : "");
      ctx.setScope(0.5 + 0.4 * Math.min(1, par / packedArea));
      const ok = packedArea <= par;
      if (ok) {
        cutoffBtn.removeAttribute("disabled");
        if (!cutoffDone) {
          verdict.textContent = "Packed under par — every wedge direction still present. Now hit the cutoff.";
          verdict.className = "verdict";
        }
      } else if (!cutoffDone) {
        cutoffBtn.setAttribute("disabled", "");
        verdict.textContent = "";
      }
    }

    function runCutoff(): void {
      after.hidden = false;
      afterPaint.clear();
      afterPaint.ctx.fillStyle = "#fff";
      const ag = after.getContext("2d")!;
      ag.fillStyle = "#0E1520";
      ag.fillRect(0, 0, AW, AH);
      // Place each shifted copy so copies stay disjoint: staircase seed, then
      // nudge perpendicular until the pixel count actually grows by a full tube.
      const tubePx = new PaintLayer(AW, AH);
      let placedCount = 0;
      tubes.forEach((t, i) => {
        const seed: Tube = { x: 46 + i * 30, y: AH - 60 - i * 40, angle: t.angle };
        const perp = { x: -Math.sin(t.angle), y: Math.cos(t.angle) };
        let placed = seed;
        for (let tries = 0; tries < 30; tries++) {
          tubePx.clear();
          tubePx.ctx.fillStyle = "#fff";
          tubePx.ctx.beginPath();
          traceTube(tubePx.ctx, placed);
          tubePx.ctx.fill();
          const alone = tubePx.count();
          afterPaint.ctx.beginPath();
          traceTube(afterPaint.ctx, placed);
          afterPaint.ctx.save();
          const beforeCount = placedCount;
          afterPaint.ctx.fill();
          afterPaint.ctx.restore();
          const grown = afterPaint.count();
          if (grown - beforeCount >= alone * 0.96) {
            placedCount = grown;
            break;
          }
          // Undo is cheap: repaint from scratch next try.
          afterPaint.clear();
          afterPaint.ctx.fillStyle = "#fff";
          for (let j = 0; j < i; j++) {
            const prev = placedTubes[j];
            afterPaint.ctx.beginPath();
            traceTube(afterPaint.ctx, prev);
            afterPaint.ctx.fill();
          }
          placedCount = afterPaint.count();
          placed = { ...placed, x: placed.x + perp.x * 8, y: placed.y + perp.y * 8 };
        }
        placedTubes.push(placed);
        ag.fillStyle = "rgba(255, 176, 0, 0.4)";
        ag.strokeStyle = "#FFB000";
        ag.beginPath();
        traceTube(ag, placed);
        ag.fill();
        ag.stroke();
      });
      ag.fillStyle = "#8A9BB4";
      ag.font = "11px ui-monospace, Menlo, monospace";
      ag.fillText("after the cutoff — shifted copies, no overlap", 10, 16);

      const spread = afterPaint.area(TUBE_L);
      const ratio = spread / packedArea;
      ratioOut.set(`${ratio.toFixed(2)}×`, ratio >= UNSAFE ? "bad" : "");
      ctx.setScope(1);
      if (ratio >= UNSAFE) {
        cutoffDone = true;
        verdict.textContent = `Blowup ${ratio.toFixed(2)}× — past the ${UNSAFE}× line. The tighter you pack, the worse it gets: with area near zero, the imbalance grows without bound. This is Fefferman's 1971 proof, acted out.`;
        verdict.className = "verdict win";
        ctx.win();
      } else {
        verdict.textContent = `Ratio ${ratio.toFixed(2)}× — pack tighter and run it again.`;
        verdict.className = "verdict miss";
      }
    }
    const placedTubes: Tube[] = [];
    cutoffBtn.addEventListener("click", () => {
      placedTubes.length = 0;
      runCutoff();
    });

    // Dragging.
    let dragIdx = -1;
    let raf = 0;
    before.addEventListener("pointerdown", (e) => {
      const r = before.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * BW;
      const y = ((e.clientY - r.top) / r.height) * BH;
      for (let i = tubes.length - 1; i >= 0; i--) {
        const t = tubes[i];
        const dx = x - t.x;
        const dy = y - t.y;
        const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
        const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);
        if (Math.abs(lx) < TUBE_L / 2 && Math.abs(ly) < TUBE_W / 2 + 6) {
          dragIdx = i;
          before.setPointerCapture(e.pointerId);
          break;
        }
      }
    });
    before.addEventListener("pointermove", (e) => {
      if (dragIdx < 0) return;
      const r = before.getBoundingClientRect();
      tubes[dragIdx].x = ((e.clientX - r.left) / r.width) * BW;
      tubes[dragIdx].y = ((e.clientY - r.top) / r.height) * BH;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          render();
        });
      }
    });
    before.addEventListener("pointerup", () => (dragIdx = -1));

    container.append(
      el("div", { class: "panel scopepanel" }, [
        el("div", { class: "controls" }, [before, after]),
        el("div", { class: "readouts" }, [areaOut.root, parOut.root, ratioOut.root]),
        el("div", { class: "controls" }, [cutoffBtn]),
        verdict,
        el("p", {
          class: "hint",
          text: "Par is the area you yourself reached in the Besicovitch squeeze. Tubes overlap best along their length — think like Besicovitch.",
        }),
      ]),
      formalize(
        "The ball multiplier theorem",
        "In one dimension, truncating a signal's frequencies to a range and resumming is safe. Fefferman (1971) proved the natural 2D-and-up version fails: the 'ball multiplier' is unbounded for p ≠ 2 — and the proof runs on Besicovitch's small needle sets, exactly the packing-versus-spreading imbalance you just produced."
      )
    );
    render();
  },
};
