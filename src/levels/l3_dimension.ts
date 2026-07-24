// Level 3: box counting. Three subjects under one instrument — a needle, a
// known fractal, and the player's own squeezed construction. Refining the
// grid shows the construction acting fully two-dimensional even though its
// area readout is tiny.
import { LevelDef } from "../level";
import { el, readout, slider, formalize } from "../dom";
import { rasterize, boxCounts, dimensionSlope, BoxPoint } from "../core/boxcount";
import { perronTranslate } from "../core/perron";
import { CONSTRUCTION_BOUNDS } from "../core/perron";
import { pointInTriangle } from "../core/geom";

const RES = 512;
const WINDOWS = [
  [128, 96, 64, 48],
  [64, 48, 32, 24],
  [32, 24, 16, 12],
  [16, 12, 8, 6],
  [8, 6, 4, 3, 2],
];
const WIN_SLOPE = 1.65;

interface Subject {
  key: string;
  label: string;
  color: string;
  bitmap: Uint8Array;
}

export const l3: LevelDef = {
  navTitle: "Box-count it",
  year: "1971",
  title: "How Big Is Almost Nothing?",
  lede:
    "Your squeezed set has almost no area. Is it 'small'? Roy Davies proved the opposite: in the sense of dimension, these sets are as big as the whole plane. Count grid boxes at finer and finer scales and read the slope.",
  card: {
    title: "Tiny area, full dimension",
    body:
      "Boxes needed to cover a shape grow like (1/size)^dimension. A needle: slope 1. A famous fractal: ≈1.58. Your squeezed set: the slope climbs toward 2 as the grid refines — Davies (1971) proved the ideal set is exactly 2. The Kakeya conjecture says the same in every dimension: proven for the plane (1971) and, per a 2025 arXiv preprint by Wang and Zahl, in 3D. Four dimensions and up: open.",
  },
  mount(container, ctx) {
    const cfg = ctx.state.l2Config ?? { n: 16, slide: 1 };
    const tris = perronTranslate(cfg.n, cfg.slide, 0.7);
    const Bd = CONSTRUCTION_BOUNDS;
    const bw = Bd.x1 - Bd.x0;
    const bh = Bd.y1 - Bd.y0;

    const status = el("p", { class: "hint", text: "Rasterizing subjects onto the 512-cell master grid…" });
    const panel = el("div", { class: "panel" }, [status]);
    container.append(panel);

    // Rasterizing three 512² subjects takes ~100ms; let the page paint first.
    setTimeout(() => {
      const subjects: Subject[] = [
        {
          key: "needle",
          label: "needle",
          color: "#5A6376",
          bitmap: rasterize((x, y) => Math.abs(y - 0.503) < 1.2 / RES && x > 0.1 && x < 0.9, RES),
        },
        {
          key: "fractal",
          label: "fractal dust (Sierpinski)",
          color: "#2C6E9E",
          bitmap: rasterize((x, y) => (Math.floor(x * RES) & Math.floor(y * RES)) === 0, RES),
        },
        {
          key: "yours",
          label: "your squeezed set",
          color: "#C8102E",
          bitmap: rasterize((u, v) => {
            const p = { x: Bd.x0 + u * bw, y: Bd.y0 + (1 - v) * bh };
            return tris.some((t) => pointInTriangle(p, t));
          }, RES),
        },
      ];
      status.remove();
      build(subjects);
    }, 30);

    function build(subjects: Subject[]): void {
      const view = el("canvas", { class: "board", width: "300", height: "300" });
      const chart = el("canvas", { class: "board", width: "340", height: "300" });
      const slopeOut = readout("slope — your set", "—");
      const boxOut = readout("finest box in window", "—");
      const verdict = el("p", { class: "verdict", text: "" });
      let windowIdx = 0;
      let subjectIdx = 2;

      const counts: BoxPoint[][] = subjects.map((s) =>
        boxCounts(s.bitmap, RES, [...new Set(WINDOWS.flat())].sort((a, b) => b - a))
      );

      const tabs = el("div", { class: "controls" });
      subjects.forEach((s, i) => {
        const b = el("button", {
          class: `act choice ${i === subjectIdx ? "selected" : "secondary"}`,
          text: s.label,
        });
        b.addEventListener("click", () => {
          subjectIdx = i;
          tabs.querySelectorAll("button").forEach((x, j) => {
            x.classList.toggle("selected", j === i);
            x.classList.toggle("secondary", j !== i);
          });
          render();
        });
        tabs.append(b);
      });

      function drawSubject(): void {
        const g = view.getContext("2d")!;
        const s = subjects[subjectIdx];
        g.clearRect(0, 0, 300, 300);
        const img = g.createImageData(300, 300);
        for (let y = 0; y < 300; y++) {
          for (let x = 0; x < 300; x++) {
            const sx = Math.floor((x / 300) * RES);
            const sy = Math.floor((y / 300) * RES);
            if (s.bitmap[sy * RES + sx]) {
              const o = (y * 300 + x) * 4;
              img.data[o] = subjectIdx === 2 ? 200 : 27;
              img.data[o + 1] = subjectIdx === 2 ? 16 : 33;
              img.data[o + 2] = subjectIdx === 2 ? 46 : 48;
              img.data[o + 3] = 210;
            }
          }
        }
        g.putImageData(img, 0, 0);
        // Grid overlay at the window's finest box size.
        const box = WINDOWS[windowIdx][WINDOWS[windowIdx].length - 1];
        const step = (box / RES) * 300;
        g.strokeStyle = "rgba(44, 110, 158, 0.5)";
        for (let x = 0; x <= 300; x += step) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, 300);
          g.stroke();
        }
        for (let y = 0; y <= 300; y += step) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(300, y);
          g.stroke();
        }
      }

      function drawChart(): void {
        const g = chart.getContext("2d")!;
        g.clearRect(0, 0, 340, 300);
        const x0 = 44;
        const y0 = 260;
        const xmax = 330;
        const ymax = 16;
        const logSpanX = Math.log(RES / 2) - Math.log(RES / 128); // box 128 -> 2
        const X = (box: number) => x0 + ((Math.log(RES / box) - Math.log(RES / 128)) / logSpanX) * (xmax - x0);
        const Y = (count: number) => y0 - (Math.log(count) / Math.log(65536)) * (y0 - ymax);
        g.strokeStyle = "#1B2130";
        g.beginPath();
        g.moveTo(x0, ymax);
        g.lineTo(x0, y0);
        g.lineTo(xmax, y0);
        g.stroke();
        g.fillStyle = "#5A6376";
        g.font = "11px ui-monospace, Menlo, monospace";
        g.fillText("log boxes needed ↑", 6, 12);
        g.fillText("finer grid →", 240, 290);
        // Reference slopes through the first construction point.
        const anchor = counts[2][0];
        for (const [slope, label] of [
          [1, "slope 1 (a curve)"],
          [2, "slope 2 (fills space)"],
        ] as const) {
          g.strokeStyle = "#C8D9E6";
          g.setLineDash([4, 4]);
          g.beginPath();
          g.moveTo(X(anchor.boxSize * RES), Y(anchor.count));
          const endBox = 2;
          const factor = (anchor.boxSize * RES) / endBox;
          g.lineTo(X(endBox), Y(anchor.count * factor ** slope));
          g.stroke();
          g.setLineDash([]);
          g.fillText(label, xmax - 150, Y(anchor.count * ((anchor.boxSize * RES) / 3) ** slope) + (slope === 1 ? -6 : 14));
        }
        // Window shading.
        const wBoxes = WINDOWS[windowIdx];
        g.fillStyle = "rgba(255, 176, 0, 0.15)";
        const wx0 = X(wBoxes[0]);
        const wx1 = X(wBoxes[wBoxes.length - 1]);
        g.fillRect(wx0, ymax, wx1 - wx0, y0 - ymax);
        // Points.
        subjects.forEach((s, i) => {
          g.fillStyle = s.color;
          for (const p of counts[i]) {
            g.beginPath();
            g.arc(X(p.boxSize * RES), Y(p.count), i === 2 ? 4 : 2.6, 0, Math.PI * 2);
            g.fill();
          }
        });
      }

      function render(): void {
        drawSubject();
        drawChart();
        const wBoxes = WINDOWS[windowIdx];
        const windowPts = counts[2].filter((p) => wBoxes.includes(Math.round(p.boxSize * RES)));
        const slope = dimensionSlope(windowPts);
        slopeOut.set(slope.toFixed(2), slope >= WIN_SLOPE ? "good" : "");
        boxOut.set(`${wBoxes[wBoxes.length - 1]} px`);
        ctx.setScope(0.3 + 0.2 * (slope / 2));
        const areaOK = (ctx.state.l2BestArea ?? 1) <= 0.2;
        if (slope >= WIN_SLOPE && windowIdx === WINDOWS.length - 1 && areaOK) {
          verdict.textContent = `Slope ${slope.toFixed(2)} and climbing toward 2 — while the same set's area reads ${(
            ctx.state.l2BestArea ?? 0
          ).toFixed(3)}. Small in area, full-size in dimension.`;
          verdict.className = "verdict win";
          ctx.win();
        } else if (slope >= WIN_SLOPE) {
          verdict.textContent = "Good slope — now push to the finest grid to clinch it.";
          verdict.className = "verdict";
        } else {
          verdict.textContent = "";
        }
      }

      panel.append(
        tabs,
        el("div", { class: "controls" }, [view, chart]),
        el("div", { class: "controls" }, [
          slider("grid fineness", { min: 0, max: WINDOWS.length - 1, step: 1, value: 0 }, (v) => {
            windowIdx = v;
            render();
          }),
        ]),
        el("div", { class: "readouts" }, [slopeOut.root, boxOut.root]),
        verdict,
        el("p", {
          class: "hint",
          text: `Goal: refine the grid until your set's slope reads ≥ ${WIN_SLOPE}. Compare the needle (slope 1) and the fractal (≈1.58) on the way.`,
        })
      );
      container.append(
        formalize(
          "Box-counting dimension, and the Kakeya conjecture",
          "Cover a shape with boxes of side s; if the count grows like (1/s)^d, the shape has dimension d. Davies (1971): every planar Besicovitch set has dimension exactly 2 despite arbitrarily small area. The <strong>Kakeya conjecture</strong> generalizes: in n-dimensional space such sets must have full dimension n. Status: n = 2 proven (1971); n = 3 proven in a February 2025 arXiv preprint by Hong Wang and Joshua Zahl, hailed as the field's biggest advance in decades; n ≥ 4 open."
        )
      );
      render();
    }
  },
};
