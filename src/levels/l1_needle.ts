// Level 1: rotate a needle inside a disk, watch the swept area accumulate on
// the pixel grid, then bet on whether a smooth convex region can be optimal.
import { LevelDef } from "../level";
import { el, readout, slider, formalize } from "../dom";
import { PaintLayer } from "../paint";

const SIZE = 360;
const L = 260; // needle length in px = 1 unit

export const l1: LevelDef = {
  navTitle: "Spin the needle",
  year: "1917",
  title: "Spin the Needle, Place Your Bets",
  lede:
    "Sōichi Kakeya asked: what is the smallest region in which a needle can turn all the way around? Sweep the needle and read the area it paints. Every area in this game is counted the same way: shaded cells on a grid.",
  card: {
    title: "The needle problem is a minimization game",
    body:
      "A needle can turn through every direction inside many regions — the question is how small the region's area can get. Convexity provably costs area (Pál, 1921), and even Kakeya's own deltoid guess was later beaten.",
  },
  mount(container, ctx) {
    const board = el("canvas", { class: "board", width: String(SIZE), height: String(SIZE) });
    const paint = new PaintLayer(SIZE, SIZE);
    const areaOut = readout("swept area (needle² units)", "0.000");
    const angleOut = readout("rotation", "0°");
    let theta = 0;
    let maxTheta = 0;
    let betPlaced = false;
    let swept = false;

    const bctx = board.getContext("2d")!;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    function needleEnds(a: number): [number, number, number, number] {
      const dx = (Math.cos(a) * L) / 2;
      const dy = (Math.sin(a) * L) / 2;
      return [cx - dx, cy - dy, cx + dx, cy + dy];
    }

    function paintUpTo(a: number): void {
      // Paint each intermediate needle position so the swept region is real.
      for (let t = maxTheta; t <= a; t += 0.006) {
        const [x0, y0, x1, y1] = needleEnds(t);
        paint.ctx.strokeStyle = "#C8102E";
        paint.ctx.lineWidth = 2;
        paint.ctx.beginPath();
        paint.ctx.moveTo(x0, y0);
        paint.ctx.lineTo(x1, y1);
        paint.ctx.stroke();
      }
      maxTheta = Math.max(maxTheta, a);
    }

    function draw(): void {
      bctx.clearRect(0, 0, SIZE, SIZE);
      bctx.globalAlpha = 0.35;
      bctx.drawImage(paint.canvas, 0, 0);
      bctx.globalAlpha = 1;
      // Boundary disk: the naive answer.
      bctx.strokeStyle = "#1B2130";
      bctx.setLineDash([5, 4]);
      bctx.beginPath();
      bctx.arc(cx, cy, L / 2 + 4, 0, Math.PI * 2);
      bctx.stroke();
      bctx.setLineDash([]);
      const [x0, y0, x1, y1] = needleEnds(theta);
      bctx.strokeStyle = "#C8102E";
      bctx.lineWidth = 3;
      bctx.beginPath();
      bctx.moveTo(x0, y0);
      bctx.lineTo(x1, y1);
      bctx.stroke();
      bctx.lineWidth = 1;
    }

    const update = (deg: number) => {
      theta = (deg * Math.PI) / 180;
      paintUpTo(theta);
      draw();
      angleOut.set(`${Math.round(deg)}°`);
      const area = paint.area(L);
      areaOut.set(area.toFixed(3));
      ctx.setScope(0.1 + (0.25 * deg) / 180);
      if (deg >= 180 && !swept) {
        swept = true;
        betPanel.hidden = false;
        checkWin();
      }
    };

    function checkWin(): void {
      if (swept && betPlaced) {
        reveal.hidden = false;
        ctx.win();
      }
    }

    // Bet: does convex win?
    const betPanel = el("div", { class: "panel", hidden: "" }, [
      el("h3", { text: "Full turn complete — the disk costs ≈ 0.785. Place your bet." }),
      el("p", {
        text: "Some region of least area lets the needle turn through every direction. What must it look like?",
      }),
    ]);
    const reveal = el("div", { class: "panel", hidden: "" });
    const choices = [
      { label: "A smooth convex shape is best", convex: true },
      { label: "You need dents — non-convex wins", convex: false },
    ];
    const btnRow = el("div", { class: "controls" });
    choices.forEach((c) => {
      const b = el("button", { class: "act choice secondary", text: c.label });
      b.addEventListener("click", () => {
        if (betPlaced) return;
        betPlaced = true;
        b.classList.add("selected");
        renderReveal(c.convex);
        checkWin();
      });
      btnRow.append(b);
    });
    betPanel.append(btnRow);

    function renderReveal(guessedConvex: boolean): void {
      const verdict = guessedConvex
        ? "Kakeya guessed along these lines too — and was wrong."
        : "Right instinct. Dents win.";
      reveal.append(
        el("p", { html: `<strong>${verdict}</strong>` }),
        shapesCanvas(),
        el("p", {
          html:
            "Among <em>convex</em> regions the champion is the equilateral triangle, area 1/√3 ≈ <strong>0.577</strong> (Pál, 1921). " +
            "Kakeya's own 1917 favorite, the three-cusped <em>deltoid</em>, does better: π/8 ≈ <strong>0.393</strong> — by combining rotation with three-point turns. " +
            "And the true answer is stranger still. Next level.",
        })
      );
    }

    function shapesCanvas(): HTMLCanvasElement {
      const c = el("canvas", { class: "board", width: "560", height: "170" });
      const g = c.getContext("2d")!;
      g.font = "12px ui-monospace, Menlo, monospace";
      g.fillStyle = "#1B2130";
      g.strokeStyle = "#1B2130";
      // Disk
      g.beginPath();
      g.arc(90, 75, 55, 0, Math.PI * 2);
      g.stroke();
      g.fillText("disk 0.785", 52, 155);
      // Triangle (equilateral, height = needle length visual scale)
      g.beginPath();
      g.moveTo(280, 20);
      g.lineTo(215, 132);
      g.lineTo(345, 132);
      g.closePath();
      g.stroke();
      g.fillText("triangle 0.577", 235, 155);
      // Deltoid: x = 2r cos t + r cos 2t, y = 2r sin t - r sin 2t
      const r = 38;
      g.beginPath();
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.02) {
        const x = 470 + 2 * r * Math.cos(t) + r * Math.cos(2 * t);
        const y = 75 + 2 * r * Math.sin(t) - r * Math.sin(2 * t);
        if (t === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.strokeStyle = "#C8102E";
      g.fillStyle = "#C8102E";
      g.fillText("deltoid 0.393", 425, 155);
      return c;
    }

    container.append(
      el("div", { class: "panel" }, [
        board,
        el("div", { class: "controls" }, [
          slider("rotate needle", { min: 0, max: 180, step: 1, value: 0 }, update),
        ]),
        el("div", { class: "readouts" }, [angleOut.root, areaOut.root]),
        el("p", {
          class: "hint",
          text: "The number is literally counted: painted cells ÷ cells per needle-length². No hidden scoring.",
        }),
      ]),
      betPanel,
      reveal,
      formalize(
        "Kakeya needle problem",
        "Find the region of least area inside which a unit needle can rotate through 180°, ending reversed. Rotating about the center gives a disk of area π/4 ≈ 0.785 — the baseline your sweep just measured."
      )
    );
    update(0);
  },
};
