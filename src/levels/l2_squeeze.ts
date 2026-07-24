// Level 2: the Besicovitch squeeze. Split the triangle into slivers and
// slide them together — translation is free, and the union area collapses
// while every needle direction survives. Rotating instead goes nowhere.
import { LevelDef } from "../level";
import { el, readout, slider, formalize } from "../dom";
import { PaintLayer } from "../paint";
import { perronTranslate, rotateSlivers, directionsCovered, CONSTRUCTION_BOUNDS } from "../core/perron";
import { Triangle } from "../core/geom";

const W = 560;
const H = 360;
export const L2_WIN_AREA = 0.2;

const B = CONSTRUCTION_BOUNDS;
const scaleX = W / (B.x1 - B.x0);
const scaleY = H / (B.y1 - B.y0);
const SCALE = Math.min(scaleX, scaleY); // px per unit
const toPx = (x: number, y: number): [number, number] => [
  (x - B.x0) * SCALE,
  H - (y - B.y0) * SCALE,
];

function tracePath(g: CanvasRenderingContext2D, tris: Triangle[]): void {
  g.beginPath();
  for (const t of tris) {
    const [x0, y0] = toPx(t[0].x, t[0].y);
    const [x1, y1] = toPx(t[1].x, t[1].y);
    const [x2, y2] = toPx(t[2].x, t[2].y);
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.lineTo(x2, y2);
    g.closePath();
  }
}

export const l2: LevelDef = {
  navTitle: "Besicovitch squeeze",
  year: "1919",
  title: "The Besicovitch Squeeze",
  lede:
    "Abram Besicovitch found the loophole: a needle has zero width, so sliding a piece sideways is free — only rotation sweeps new area. Split the triangle and slide the slivers into each other. Keep every direction. Shrink the area.",
  card: {
    title: "Sliding is free; the area can go arbitrarily low",
    body:
      "Split into thin slivers and translate them to overlap: every needle direction survives while the union's area collapses (Besicovitch 1919; Perron's tree, 1928). Push the construction further and the area drops toward zero.",
  },
  mount(container, ctx) {
    const board = el("canvas", { class: "board", width: String(W), height: String(H) });
    const paint = new PaintLayer(W, H);
    const g = board.getContext("2d")!;
    const areaOut = readout("union area", "0.500");
    const dirOut = readout("directions kept", "—");
    const verdict = el("p", { class: "verdict", text: "" });

    let nPow = 0; // n = 2^nPow
    let slide = 0;
    let mode: "translate" | "rotate" = "translate";

    function currentTris(): Triangle[] {
      const n = 2 ** nPow;
      return mode === "translate" ? perronTranslate(n, slide, 0.7) : rotateSlivers(n, slide);
    }

    function render(): void {
      const n = 2 ** nPow;
      const tris = currentTris();
      paint.clear();
      paint.ctx.fillStyle = "#C8102E";
      tracePath(paint.ctx, tris);
      paint.ctx.fill();

      g.clearRect(0, 0, W, H);
      g.fillStyle = "rgba(200, 16, 46, 0.28)";
      g.strokeStyle = "#C8102E";
      tracePath(g, tris);
      g.fill();
      g.stroke();

      const area = paint.count() / (SCALE * SCALE);
      const dirs = directionsCovered(tris, n);
      areaOut.set(area.toFixed(3), area <= L2_WIN_AREA ? "good" : "");
      dirOut.set(`${dirs} / ${n}`, dirs === n ? "good" : "bad");
      ctx.setScope(0.15 + 0.45 * (1 - area / 0.5));

      if (mode === "translate" && dirs === n && area <= L2_WIN_AREA) {
        verdict.textContent = `Area ${area.toFixed(3)} with all ${n} directions intact — the squeeze works.`;
        verdict.className = "verdict win";
        if (ctx.state.l2BestArea === null || area < ctx.state.l2BestArea) {
          ctx.state.l2BestArea = area;
          ctx.state.l2Config = { n, slide };
          ctx.save();
        }
        ctx.win();
      } else if (mode === "rotate" && slide > 0.6) {
        verdict.textContent =
          "Rotating the slivers into line doesn't shrink the union — and now they all point the same way. Directions lost, nothing gained.";
        verdict.className = "verdict miss";
      } else {
        verdict.textContent = "";
      }
    }

    const modeRow = el("div", { class: "controls" });
    const tBtn = el("button", { class: "act choice selected", text: "Translate (slide sideways)" });
    const rBtn = el("button", { class: "act choice secondary", text: "Rotate (turn in place)" });
    tBtn.addEventListener("click", () => {
      mode = "translate";
      tBtn.classList.add("selected");
      rBtn.classList.remove("selected");
      render();
    });
    rBtn.addEventListener("click", () => {
      mode = "rotate";
      rBtn.classList.add("selected");
      tBtn.classList.remove("selected");
      render();
    });
    modeRow.append(tBtn, rBtn);

    container.append(
      el("div", { class: "panel" }, [
        board,
        modeRow,
        el("div", { class: "controls" }, [
          slider("splits (1 → 16 slivers)", { min: 0, max: 4, step: 1, value: 0 }, (v) => {
            nPow = v;
            render();
          }),
          slider("slide the slivers", { min: 0, max: 1, step: 0.01, value: 0 }, (v) => {
            slide = v;
            render();
          }),
        ]),
        el("div", { class: "readouts" }, [areaOut.root, dirOut.root]),
        verdict,
        el("p", {
          class: "hint",
          text: `Goal: union area ≤ ${L2_WIN_AREA.toFixed(2)} while keeping every direction. Try both modes — only one of them can do it.`,
        }),
      ]),
      formalize(
        "Besicovitch set",
        "A region containing a unit needle in every direction. Besicovitch (1919) showed such sets exist with arbitrarily small area; Perron's 1928 tree — the sliding-slivers construction you just used — is the classic way to build them. With more splits and longer connecting corridors, the area heads to zero."
      )
    );
    render();
  },
};
