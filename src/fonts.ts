// Inline STIX Two Text (the typeface of scientific publishing) so the single
// HTML file renders identically offline. esbuild turns these imports into
// data: URIs.
import regular from "@fontsource/stix-two-text/files/stix-two-text-latin-400-normal.woff2";
import semibold from "@fontsource/stix-two-text/files/stix-two-text-latin-600-normal.woff2";
import italic from "@fontsource/stix-two-text/files/stix-two-text-latin-400-italic.woff2";

const faces: Array<[string, number, string]> = [
  [regular, 400, "normal"],
  [semibold, 600, "normal"],
  [italic, 400, "italic"],
];

export function installFonts(): void {
  const css = faces
    .map(
      ([url, weight, style]) =>
        `@font-face { font-family: "STIX Two Text"; src: url("${url}") format("woff2"); font-weight: ${weight}; font-style: ${style}; font-display: swap; }`
    )
    .join("\n");
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
}
