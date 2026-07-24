// Level 6: the tower. Two predictions, then the reveal — failure would
// propagate up; a proven foundation removes one obstruction, nothing more.
import { LevelDef } from "../level";
import { el, formalize } from "../dom";

interface Tier {
  name: string;
  blurb: string;
  chips: Array<{ text: string; cls: string }>;
}

const TIERS: Tier[] = [
  {
    name: "Kakeya conjecture",
    blurb: "Needle sets have full dimension — pure geometry. The foundation.",
    chips: [
      { text: "n=2 proven 1971", cls: "solved" },
      { text: "n=3 2025 arXiv preprint", cls: "preprint" },
      { text: "n≥4 open", cls: "" },
    ],
  },
  {
    name: "Restriction conjecture",
    blurb: "Does a Fourier transform restricted to a curved surface still carry real information?",
    chips: [
      { text: "n=2 proven", cls: "solved" },
      { text: "n≥3 open", cls: "" },
    ],
  },
  {
    name: "Bochner–Riesz conjecture",
    blurb: "Does a softened, tapered frequency cutoff converge where the sharp one failed?",
    chips: [
      { text: "n=2 proven", cls: "solved" },
      { text: "n≥3 open", cls: "" },
    ],
  },
  {
    name: "Local smoothing conjecture",
    blurb: "Do propagating waves average out their rough spots rather than compound them?",
    chips: [{ text: "n≥3 open", cls: "" }],
  },
];

export const l6: LevelDef = {
  navTitle: "The tower",
  year: "1990s → 2025",
  title: "The Tower",
  lede:
    "After Fefferman, mathematicians built a tower of conjectures about waves — each level harder than, and implying, the one below. At the bottom sits Kakeya. Before we animate anything: make two predictions.",
  card: {
    title: "Implication flows down; failure would flow up",
    body:
      "Each harder conjecture (restriction → Bochner–Riesz → local smoothing) proves the ones below it. So one false Kakeya set would have toppled the entire tower. The 2025 Wang–Zahl preprint secures the 3D foundation — it removes an obstruction, but proves none of the upper floors by itself. Those stay open.",
  },
  mount(container, ctx) {
    const tower = el("div", { class: "tower" });
    const tierEls: HTMLElement[] = TIERS.map((t, i) => {
      const tier = el("div", { class: `tier ${i === 0 ? "foundation" : ""}` }, [
        el("strong", { text: t.name }),
        el("p", { class: "hint", text: t.blurb }),
        el("div", { class: "chips" }, t.chips.map((c) => el("span", { class: `chip ${c.cls}`, text: c.text }))),
      ]);
      tower.append(tier);
      return tier;
    });

    let q1: boolean | null = null;
    let q2: boolean | null = null;

    function question(
      title: string,
      options: Array<{ label: string; correct: boolean }>,
      explainRight: string,
      explainWrong: string,
      onCorrect: () => void
    ): HTMLElement {
      const verdict = el("p", { class: "verdict", text: "" });
      const row = el("div", { class: "controls" });
      options.forEach((o) => {
        const b = el("button", { class: "act choice secondary", text: o.label });
        b.addEventListener("click", () => {
          row.querySelectorAll("button").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          if (o.correct) {
            verdict.textContent = explainRight;
            verdict.className = "verdict win";
            onCorrect();
          } else {
            verdict.textContent = explainWrong;
            verdict.className = "verdict miss";
          }
        });
        row.append(b);
      });
      return el("div", { class: "panel" }, [el("h3", { text: title }), row, verdict]);
    }

    const check = () => {
      if (q1 && q2) ctx.win();
    };

    container.append(
      el("div", { class: "panel" }, [el("h3", { text: "The tower, as it really stands" }), tower]),
      question(
        "Prediction 1 — Suppose someone found a Kakeya counterexample (a needle set of less-than-full dimension). Which upper floors would survive?",
        [
          { label: "All of them", correct: false },
          { label: "Some of them", correct: false },
          { label: "None of them", correct: true },
        ],
        "Correct. Each upper floor implies Kakeya — so a false Kakeya falsifies every one of them. Watch:",
        "Look at the arrows of implication: every upper floor implies Kakeya. If Kakeya is false, no floor above it can be true. Try again.",
        () => {
          q1 = true;
          animateCollapse();
          check();
        }
      ),
      question(
        "Prediction 2 — Wang–Zahl's 2025 preprint proves Kakeya in 3D. Which upper floors does that automatically prove?",
        [
          { label: "All of them", correct: false },
          { label: "Restriction, at least", correct: false },
          { label: "None — it removes one obstruction", correct: true },
        ],
        "Correct. Implication runs downward, not up. The foundation is secure; every floor above still needs its own proof — though the field now expects a climb.",
        "Tempting — but implication only flows down the tower. Proving the foundation guarantees nothing above it. Try again.",
        () => {
          q2 = true;
          animateFoundation();
          check();
        }
      ),
      formalize(
        "Reading the tower",
        "Local smoothing ⇒ Bochner–Riesz ⇒ restriction ⇒ Kakeya. Proving a floor proves everything <em>below</em> it; disproving a floor disproves everything <em>above</em> it. Kakeya is the cheapest place for the tower to die — which is why the 2025 result matters so much, and why restriction, Bochner–Riesz, and local smoothing (n ≥ 3) are still open problems."
      )
    );

    function animateCollapse(): void {
      tierEls.forEach((t, i) => {
        setTimeout(() => t.classList.add("fallen"), ctx.reducedMotion ? 0 : i * 350);
      });
      setTimeout(() => tierEls.forEach((t) => t.classList.remove("fallen")), ctx.reducedMotion ? 1200 : 2600);
    }
    function animateFoundation(): void {
      tierEls[0].classList.add("lit");
    }
  },
};
