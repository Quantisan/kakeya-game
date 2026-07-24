// Tiny DOM helpers shared by the shell and levels.

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export interface Readout {
  root: HTMLElement;
  set(value: string, tone?: "good" | "bad" | ""): void;
}

export function readout(label: string, initial = "—"): Readout {
  const v = el("span", { class: "v", text: initial });
  const root = el("div", { class: "readout" }, [el("span", { class: "k", text: label }), v]);
  return {
    root,
    set(value, tone = "") {
      v.textContent = value;
      root.classList.remove("good", "bad");
      if (tone) root.classList.add(tone);
    },
  };
}

export function slider(
  label: string,
  opts: { min: number; max: number; step: number; value: number },
  onInput: (v: number) => void
): HTMLElement {
  const input = el("input", {
    type: "range",
    min: String(opts.min),
    max: String(opts.max),
    step: String(opts.step),
    value: String(opts.value),
  });
  input.addEventListener("input", () => onInput(Number(input.value)));
  return el("label", {}, [label, input]);
}

export function formalize(term: string, body: string): HTMLElement {
  return el("details", { class: "formalize" }, [
    el("summary", { text: `Formalize: ${term}` }),
    el("p", { html: body }),
  ]);
}
