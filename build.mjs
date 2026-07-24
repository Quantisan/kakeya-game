// Bundles src/main.ts (plus any imported libraries) and inlines the result
// into a single self-contained dist/kakeya-game.html that runs offline.
import { build, context } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const watch = process.argv.includes("--watch");

const inlinePlugin = {
  name: "inline-into-html",
  setup(b) {
    b.onEnd((result) => {
      if (result.errors.length > 0) return;
      const js = readFileSync("dist/bundle.js", "utf8");
      const template = readFileSync("src/template.html", "utf8");
      const html = template.replace(
        "<!-- BUNDLE -->",
        `<script>\n${js}\n</script>`
      );
      writeFileSync("dist/kakeya-game.html", html);
      console.log(`built dist/kakeya-game.html (${(html.length / 1024).toFixed(0)} KB)`);
    });
  },
};

const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "dist/bundle.js",
  loader: { ".woff2": "dataurl" },
  plugins: [inlinePlugin],
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching...");
} else {
  await build(options);
}
