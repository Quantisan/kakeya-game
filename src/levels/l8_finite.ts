// Level 8 (bonus): the finite-field Kakeya puzzle. Pick one line per
// direction on a 5×5 modular grid; minimize the union of points. Par is
// computed by the game's own greedy search — not attributed to any paper.
import { LevelDef } from "../level";
import { el, readout, formalize } from "../dom";
import { Q, DIRECTIONS, linePoints, unionSize, greedyPar } from "../core/finite";

const DIR_LABELS = ["slope 0", "slope 1", "slope 2", "slope 3", "slope 4", "vertical"];

export const l8: LevelDef = {
  navTitle: "Bonus: finite grid",
  year: "2008",
  optional: true,
  title: "Bonus: Finite Directions",
  lede:
    "The same puzzle on a 5×5 grid where arithmetic wraps around (mod 5). Choose one full line in each of the six directions; overlap them to keep the total point count low. In this miniature world, the Kakeya problem is completely solved.",
  card: {
    title: "Kakeya thinking pays off in computer science",
    body:
      "Zeev Dvir (2008) solved the finite-field Kakeya problem with the 'polynomial method' — a short, stunning argument showing such sets must be large. The technique fed real tools: deterministic randomness extractors used in derandomization. A concrete payoff of needle-thinking, separate from the harmonic-analysis tower.",
  },
  mount(container, ctx) {
    const par = greedyPar();
    const offsets = new Array(DIRECTIONS).fill(0);
    const cells: HTMLElement[] = [];
    const grid = el("div", { class: "fgrid" });
    for (let i = 0; i < Q * Q; i++) {
      const cell = el("div", { class: "fcell" });
      cells.push(cell);
      grid.append(cell);
    }
    const countOut = readout("points used", "—");
    const parOut = readout("par (greedy search)", String(par.size));
    const verdict = el("p", { class: "verdict", text: "" });

    function render(): void {
      const used = new Set<number>();
      offsets.forEach((o, dir) => {
        for (const p of linePoints(dir, o)) used.add(p);
      });
      cells.forEach((c, i) => c.classList.toggle("on", used.has(i)));
      const n = unionSize(offsets);
      countOut.set(String(n), n <= par.size ? "good" : "");
      if (n <= par.size) {
        verdict.textContent = `${n} points covering all six directions — you matched the search bound. Every direction, minimal footprint: a Kakeya set in miniature.`;
        verdict.className = "verdict win";
        ctx.win();
      } else {
        verdict.textContent = "";
      }
    }

    const rows = DIR_LABELS.map((label, dir) => {
      const val = el("span", { text: "offset 0" });
      const mk = (delta: number) => {
        const b = el("button", { text: delta > 0 ? "▶" : "◀" });
        b.addEventListener("click", () => {
          offsets[dir] = (offsets[dir] + delta + Q) % Q;
          val.textContent = `offset ${offsets[dir]}`;
          render();
        });
        return b;
      };
      return el("div", { class: "dirrow" }, [mk(-1), val, mk(1), el("span", { text: `— ${label}` })]);
    });

    container.append(
      el("div", { class: "panel" }, [
        el("h3", { text: "One line per direction; lines wrap around mod 5" }),
        el("div", { class: "controls" }, [grid, el("div", {}, rows)]),
        el("div", { class: "readouts" }, [countOut.root, parOut.root]),
        verdict,
        el("p", {
          class: "hint",
          text: "Slide each direction's offset so the lines reuse each other's points. Par comes from the game's own greedy search over this exact grid.",
        }),
      ]),
      formalize(
        "The polynomial method",
        "Dvir's proof: if a finite-grid Kakeya set were too small, some low-degree polynomial would vanish on all of it — and then, because the set contains a full line in every direction, on the whole grid: contradiction. Ten lines of algebra where decades of geometry had struggled. The idea went on to power results across combinatorics and theoretical computer science."
      )
    );
    render();
  },
};
