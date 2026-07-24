// Level 7: honesty firewall. Sort real technologies into what they actually
// run. The third bucket's correct population is zero.
import { LevelDef } from "../level";
import { el, formalize } from "../dom";

interface Card {
  name: string;
  detail: string;
  bucket: number;
}

const CARDS: Card[] = [
  { name: "MRI scanner", detail: "reconstructs images from k-space", bucket: 0 },
  { name: "WiFi / 5G (OFDM)", detail: "modulates data across frequencies", bucket: 0 },
  { name: "Song recognition", detail: "fingerprints audio spectrograms", bucket: 0 },
  { name: "JPEG photos", detail: "compresses 8×8 pixel blocks", bucket: 1 },
  { name: "MP3 audio", detail: "compresses sound in frequency bands", bucket: 1 },
];

const BUCKETS = [
  "Genuinely runs the Fourier transform today",
  "Runs a cosine-transform cousin (DCT / MDCT)",
  "Waits on the Kakeya tower being resolved",
];

export const l7: LevelDef = {
  navTitle: "What's running",
  year: "today",
  title: "What's Really Running",
  lede:
    "So is any of this in your phone? Time to be precise. Sort each technology into the bucket that describes the mathematics it actually executes. One bucket's correct population may surprise you.",
  card: {
    title: "The transform ships; the conjectures don't",
    body:
      "MRI, WiFi/5G, and audio fingerprinting genuinely run the Fourier transform — via classical, decades-old, exact algorithms. JPEG and MP3 run cosine-transform cousins (DCT/MDCT). And nothing shipping today waits on Kakeya, restriction, or Bochner–Riesz: those are the worst-case guarantees mathematicians still want about wave mathematics itself — the ceiling, not the code.",
  },
  mount(container, ctx) {
    let selected: HTMLElement | null = null;
    const placement = new Map<HTMLElement, number>();
    const tray = el("div", { class: "cardtray" });
    const cardEls: Array<[HTMLElement, Card]> = CARDS.map((c) => {
      const cardEl = el("div", { class: "techcard", tabindex: "0", role: "button" }, [
        el("strong", { text: c.name }),
        el("span", { class: "hint", text: ` — ${c.detail}` }),
      ]);
      const pick = () => {
        selected?.classList.remove("selected");
        selected = cardEl;
        cardEl.classList.add("selected");
      };
      cardEl.addEventListener("click", pick);
      cardEl.addEventListener("keydown", (e) => e.key === "Enter" && pick());
      tray.append(cardEl);
      return [cardEl, c];
    });

    const bucketEls = BUCKETS.map((title, bi) => {
      const bucket = el("div", { class: "bucket" }, [el("h4", { text: title })]);
      const drop = () => {
        if (!selected) return;
        bucket.append(selected);
        placement.set(selected, bi);
        selected.classList.remove("selected", "right", "wrong");
        selected = null;
        checkBtn.toggleAttribute("disabled", placement.size < CARDS.length);
      };
      bucket.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest(".techcard")) return;
        drop();
      });
      return bucket;
    });

    const verdict = el("p", { class: "verdict", text: "" });
    const checkBtn = el("button", { class: "act", text: "Check my sorting", disabled: "" });
    checkBtn.addEventListener("click", () => {
      let allRight = true;
      for (const [cardEl, c] of cardEls) {
        const right = placement.get(cardEl) === c.bucket;
        cardEl.classList.toggle("right", right);
        cardEl.classList.toggle("wrong", !right);
        if (!right) allRight = false;
      }
      if (allRight) {
        verdict.textContent =
          "All five correct — and notice the third bucket: empty. That's the honest headline. The tower is about guaranteeing wave mathematics in the worst case, not about upgrading your phone.";
        verdict.className = "verdict win";
        ctx.setScope(1);
        ctx.win();
      } else {
        verdict.textContent = "Not quite — red cards are in the wrong bucket. Reassign them and check again.";
        verdict.className = "verdict miss";
      }
    });

    container.append(
      el("div", { class: "panel" }, [
        el("h3", { text: "Select a card, then click a bucket" }),
        tray,
        el("div", { class: "sortgrid" }, bucketEls),
        el("div", { class: "controls" }, [checkBtn]),
        verdict,
      ]),
      formalize(
        "Why the empty bucket matters",
        "It is easy to oversell famous problems. The Fourier transform is genuinely everywhere — but through the FFT and its relatives, settled since the 1960s. The Kakeya tower asks whether the <em>theory</em> behind frequency decompositions can ever fail in the worst case. Its value is foundational: certifying the mathematics every wave technology stands on."
      )
    );
  },
};
