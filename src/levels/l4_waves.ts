// Level 4: waves are needles. Pick a wedge of frequency space; the summed
// plane waves concentrate on a long thin tube. Match the target tube.
// This is the level that pays off the header oscilloscope.
import { LevelDef } from "../level";
import { el, readout, slider, formalize } from "../dom";
import { waveEnergy, tubeShape, axisAngleDiff, FieldSpec } from "../core/wave";

const SPEC: FieldSpec = { res: 96, waves: 41, cycles: 20 };
const TARGET_WEDGE = { angle: (25 * Math.PI) / 180, width: 0.35 };
const TARGET = tubeShape(waveEnergy(TARGET_WEDGE, SPEC), SPEC.res);
const ANGLE_TOL = (8 * Math.PI) / 180;
const ASPECT_TOL = 0.3;

export const l4: LevelDef = {
  navTitle: "Waves are needles",
  year: "1971 · Fourier",
  title: "Waves Are Needles",
  lede:
    "Charles Fefferman connected the needle to the Fourier transform — the tool that writes any signal as a sum of waves. Here is the bridge: confine a wave's frequencies to a narrow wedge of directions, and its energy concentrates on a long thin tube. Build the tube we've drawn for you.",
  card: {
    title: "A wave with narrow frequency spread is a needle",
    body:
      "Frequencies confined to a thin angular wedge ⇒ energy concentrated on a long thin tube pointing the wedge's way (the uncertainty principle at work). Any wave splits into many such tube-packets — so questions about waves conspiring become questions about tubes overlapping. Needle geometry, again.",
  },
  mount(container, ctx) {
    // ---- payoff for the header scope ----
    container.append(
      el("div", { class: "panel" }, [
        el("p", {
          html:
            "<strong>About that amber trace in the header:</strong> it has been reacting to you the whole game. It is a sum of waves — and the closer your constructions got to needle-like, the more its phases lined up into one sharp packet. Needle world and wave world are the same world. Now you'll see why.",
        }),
      ])
    );

    // ---- optional warm-up: winding a signal to find its frequency ----
    const warm = el("details", { class: "formalize" }, [
      el("summary", { text: "Optional 45-second warm-up: what is a 'frequency', really?" }),
    ]);
    const wCanvas = el("canvas", { class: "board", width: "240", height: "240" });
    const wBar = readout("centroid pull", "0.00");
    const wHint = el("p", { class: "hint", text: "Wind the signal around a circle. At the signal's own frequency, the winding stops cancelling and the centroid lurches sideways. This is the Fourier transform's core move." });
    const wg = wCanvas.getContext("2d")!;
    function drawWinding(freq: number): void {
      wg.fillStyle = "#0E1520";
      wg.fillRect(0, 0, 240, 240);
      wg.strokeStyle = "#FFB000";
      wg.lineWidth = 1.2;
      wg.beginPath();
      let sx = 0;
      let sy = 0;
      const N = 700;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * 4;
        const f = Math.cos(2 * Math.PI * 3 * t);
        const r = 62 + 34 * f;
        const a = 2 * Math.PI * freq * t;
        const x = 120 + r * Math.cos(a);
        const y = 120 + r * Math.sin(a);
        sx += x;
        sy += y;
        if (i === 0) wg.moveTo(x, y);
        else wg.lineTo(x, y);
      }
      wg.stroke();
      const cx = sx / 701;
      const cy = sy / 701;
      wg.fillStyle = "#C8102E";
      wg.beginPath();
      wg.arc(cx, cy, 5, 0, Math.PI * 2);
      wg.fill();
      const pull = Math.hypot(cx - 120, cy - 120) / 34;
      wBar.set(pull.toFixed(2), pull > 0.5 ? "good" : "");
    }
    warm.append(
      wCanvas,
      el("div", { class: "controls" }, [
        slider("winding frequency", { min: 0.5, max: 5, step: 0.02, value: 1 }, drawWinding),
      ]),
      el("div", { class: "readouts" }, [wBar.root]),
      wHint
    );
    container.append(warm);
    drawWinding(1);

    // ---- core: wedge -> wave packet, with a target tube to reproduce ----
    const freqPanel = el("canvas", { class: "board", width: "240", height: "240" });
    const physPanel = el("canvas", { class: "board", width: "300", height: "300" });
    const angleOut = readout("tube angle", "—");
    const aspectOut = readout("length ÷ width", "—");
    const verdict = el("p", { class: "verdict", text: "" });

    let wedgeAngle = (120 * Math.PI) / 180;
    let wedgeWidth = 1.6;
    let raf = 0;

    const fg = freqPanel.getContext("2d")!;
    const pg = physPanel.getContext("2d")!;

    function drawFreq(): void {
      fg.fillStyle = "#0E1520";
      fg.fillRect(0, 0, 240, 240);
      fg.strokeStyle = "#233247";
      fg.beginPath();
      fg.moveTo(120, 0);
      fg.lineTo(120, 240);
      fg.moveTo(0, 120);
      fg.lineTo(240, 120);
      fg.stroke();
      fg.strokeStyle = "#3A4E68";
      fg.beginPath();
      fg.arc(120, 120, 88, 0, Math.PI * 2);
      fg.stroke();
      fg.fillStyle = "rgba(255, 176, 0, 0.3)";
      fg.strokeStyle = "#FFB000";
      fg.beginPath();
      fg.moveTo(120, 120);
      fg.arc(120, 120, 100, wedgeAngle - wedgeWidth / 2, wedgeAngle + wedgeWidth / 2);
      fg.closePath();
      fg.fill();
      fg.stroke();
      fg.fillStyle = "#8A9BB4";
      fg.font = "11px ui-monospace, Menlo, monospace";
      fg.fillText("frequency space — drag the wedge", 10, 16);
    }

    function drawPhys(): void {
      const energy = waveEnergy({ angle: wedgeAngle, width: wedgeWidth }, SPEC);
      let max = 0;
      for (let i = 0; i < energy.length; i++) if (energy[i] > max) max = energy[i];
      const res = SPEC.res;
      const img = pg.createImageData(res, res);
      for (let i = 0; i < energy.length; i++) {
        const v = Math.pow(energy[i] / max, 0.55);
        const o = i * 4;
        img.data[o] = 14 + v * 241;
        img.data[o + 1] = 21 + v * 155;
        img.data[o + 2] = 32;
        img.data[o + 3] = 255;
      }
      const off = document.createElement("canvas");
      off.width = res;
      off.height = res;
      off.getContext("2d")!.putImageData(img, 0, 0);
      pg.imageSmoothingEnabled = true;
      pg.drawImage(off, 0, 0, 300, 300);

      // Target ghost tube.
      pg.save();
      pg.translate(150, 150);
      pg.rotate(TARGET.orientation);
      pg.strokeStyle = "rgba(255, 255, 255, 0.75)";
      pg.setLineDash([6, 5]);
      pg.strokeRect(-105, -105 / TARGET.aspect / 2 - 0, 210, 105 / TARGET.aspect);
      pg.setLineDash([]);
      pg.restore();
      pg.fillStyle = "#8A9BB4";
      pg.font = "11px ui-monospace, Menlo, monospace";
      pg.fillText("physical space — match the dashed tube", 10, 16);

      const shape = tubeShape(energy, res);
      const diff = axisAngleDiff(shape.orientation, TARGET.orientation);
      const aspectOk = Math.abs(shape.aspect - TARGET.aspect) <= ASPECT_TOL * TARGET.aspect;
      const angleOk = diff <= ANGLE_TOL;
      angleOut.set(`${((shape.orientation * 180) / Math.PI).toFixed(0)}°`, angleOk ? "good" : "");
      aspectOut.set(shape.aspect.toFixed(2), aspectOk ? "good" : "");
      ctx.setScope(0.4 + 0.6 * Math.min(1, shape.aspect / TARGET.aspect));
      if (angleOk && aspectOk) {
        verdict.textContent = "Matched. You built a needle out of nothing but waves.";
        verdict.className = "verdict win";
        ctx.win();
      } else {
        verdict.textContent = angleOk
          ? "Angle is right — adjust the wedge width to set the tube's slenderness."
          : "Rotate the wedge to swing the tube.";
        verdict.className = "verdict";
      }
    }

    function schedule(): void {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        drawFreq();
        drawPhys();
      });
    }

    let dragging = false;
    freqPanel.addEventListener("pointerdown", (e) => {
      dragging = true;
      freqPanel.setPointerCapture(e.pointerId);
      onDrag(e);
    });
    freqPanel.addEventListener("pointermove", (e) => dragging && onDrag(e));
    freqPanel.addEventListener("pointerup", () => (dragging = false));
    function onDrag(e: PointerEvent): void {
      const r = freqPanel.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 240 - 120;
      const y = ((e.clientY - r.top) / r.height) * 240 - 120;
      if (Math.hypot(x, y) > 6) {
        wedgeAngle = Math.atan2(y, x);
        schedule();
      }
    }

    container.append(
      el("div", { class: "panel scopepanel" }, [
        el("h3", { text: "The bridge: wedge in, tube out" }),
        el("div", { class: "controls" }, [freqPanel, physPanel]),
        el("div", { class: "controls" }, [
          slider("wedge width", { min: 0.12, max: 2.5, step: 0.01, value: 1.6 }, (v) => {
            wedgeWidth = v;
            schedule();
          }),
        ]),
        el("div", { class: "readouts" }, [angleOut.root, aspectOut.root]),
        verdict,
        el("p", {
          class: "hint",
          text: "Narrower wedge → longer, thinner tube, pointing the wedge's way. The dashed outline is a target tube: reproduce its direction and slenderness.",
        }),
      ]),
      formalize(
        "Wave packets and tubes",
        "A wave whose frequencies sit in a narrow angular wedge cannot be localized in every way at once — its energy spreads along a tube in the wedge's direction. Every signal decomposes into such packets. Fefferman's 1971 insight: geometry of overlapping tubes controls whether wave sums behave — and Besicovitch's needle sets are exactly the worst case."
      )
    );
    drawFreq();
    drawPhys();
  },
};
