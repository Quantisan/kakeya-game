import confetti from "canvas-confetti";
import { installFonts } from "./fonts";
import { el } from "./dom";
import { loadState, saveState } from "./state";
import { mountScope, setScopeAlignment } from "./scope";
import { LevelDef } from "./level";
import { levels } from "./levels/index";

installFonts();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = loadState();
const app = document.getElementById("app")!;

// ---------- masthead + scope ----------
const scopeCanvas = el("canvas", { width: "820", height: "48" });
app.append(
  el("header", { class: "masthead" }, [
    el("span", { class: "eyebrow", text: "An interactive tour of the Kakeya conjecture · 1917–2025" }),
    el("h1", { html: 'The Needle <span class="amp">&</span> The Wave' }),
    el("p", {
      class: "subtitle",
      text: "How a puzzle about spinning a needle became the foundation under the mathematics of signals.",
    }),
    el("div", { class: "scope-wrap" }, [
      el("div", { class: "scope-label" }, [
        el("span", { text: "signal — uncalibrated" }),
        el("span", { text: "ch 1 · amber" }),
      ]),
      scopeCanvas,
    ]),
  ])
);
mountScope(scopeCanvas, reducedMotion);

// ---------- timeline navigation ----------
const nav = el("nav", { class: "timeline", "aria-label": "Levels" });
const stage = el("main", {});
const gallery = el("section", { class: "gallery" }, [
  el("h2", { text: "Field notes — what you have established so far" }),
]);
const cardsBox = el("div", { class: "cards" });
gallery.append(cardsBox);
app.append(nav, stage, gallery);
app.append(
  el("footer", { class: "colophon" }, [
    el("p", {
      html:
        "Made for curious students. Wang–Zahl's 3D proof is a 2025 arXiv preprint (2502.17655); dimensions four and up stay open. " +
        "Further reading: Quanta Magazine's Kakeya coverage, or search “Kakeya conjecture”.",
    }),
  ])
);

const navButtons: HTMLButtonElement[] = [];

function renderNav(): void {
  navButtons.forEach((b, i) => {
    const def = levels[i];
    b.disabled = i > state.unlocked;
    b.classList.toggle("active", i === state.level);
    b.classList.toggle("done", state.completed.includes(i));
    const done = state.completed.includes(i) ? " ✓" : "";
    (b.querySelector(".t") as HTMLElement).textContent = def.navTitle + done;
  });
}

function addCardFor(index: number): void {
  const def = levels[index];
  if (cardsBox.querySelector(`[data-card="${index}"]`)) return;
  cardsBox.append(
    el("div", { class: "insight", "data-card": String(index) }, [
      el("h4", { text: def.card.title }),
      el("p", { html: def.card.body }),
    ])
  );
}

function openLevel(index: number): void {
  state.level = index;
  saveState(state);
  const def: LevelDef = levels[index];
  stage.replaceChildren();
  const wrap = el("section", { class: "level" }, [
    el("span", { class: "eyebrow", text: `Level ${index + 1} of ${levels.length} · ${def.year}${def.optional ? " · optional" : ""}` }),
    el("h2", { text: def.title }),
    el("p", { class: "lede", text: def.lede }),
  ]);
  const body = el("div", {});
  wrap.append(body);
  stage.append(wrap);

  let won = state.completed.includes(index);
  const winBar = el("div", { class: "winbar", hidden: "" }, [
    el("span", { class: "msg", text: "Cleared." }),
  ]);
  const nextBtn = el("button", { class: "act", text: index + 1 < levels.length ? "Next level →" : "Done" });
  nextBtn.addEventListener("click", () => {
    if (index + 1 < levels.length) openLevel(index + 1);
  });
  winBar.append(nextBtn);
  wrap.append(winBar);
  if (won) {
    winBar.hidden = false;
    addCardFor(index);
  }

  def.mount(body, {
    state,
    reducedMotion,
    save: () => saveState(state),
    setScope: setScopeAlignment,
    win: () => {
      if (!won) {
        won = true;
        if (!state.completed.includes(index)) state.completed.push(index);
        state.unlocked = Math.max(state.unlocked, index + 1);
        saveState(state);
        addCardFor(index);
        renderNav();
        const corePath = levels.filter((l) => !l.optional).length;
        const coreDone = state.completed.filter((i) => !levels[i]?.optional).length;
        if (coreDone === corePath && !reducedMotion) {
          confetti({ particleCount: 120, spread: 75, colors: ["#C8102E", "#FFB000", "#1B2130"] });
        }
      }
      winBar.hidden = false;
      winBar.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    },
  });
  renderNav();
}

levels.forEach((def, i) => {
  const b = el("button", {}, [
    el("span", { class: "yr", text: def.year }),
    el("span", { class: "t", text: def.navTitle }),
  ]) as HTMLButtonElement;
  b.addEventListener("click", () => openLevel(i));
  navButtons.push(b);
  nav.append(b);
});

// Restore any cards already earned, then open the saved level.
state.completed.forEach(addCardFor);
openLevel(Math.min(state.level, levels.length - 1));
