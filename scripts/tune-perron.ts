// Numeric experiment: pick the Perron bisection alpha and the Level 2 win
// threshold from measured union areas, instead of guessing.
import { perronTranslate, rotateSlivers, constructionArea, directionsCovered } from "../src/core/perron";

for (const alpha of [0.5, 0.7, 0.85, 1.0]) {
  const row: string[] = [];
  for (const n of [1, 2, 4, 8, 16]) {
    const tris = perronTranslate(n, 1, alpha);
    row.push(`n=${n}: ${constructionArea(tris).toFixed(3)}`);
  }
  console.log(`alpha=${alpha}  ${row.join("  ")}`);
}

console.log("\nrotate mode (slide=1):");
for (const n of [4, 8, 16]) {
  const tris = rotateSlivers(n, 1);
  console.log(
    `n=${n}: area=${constructionArea(tris).toFixed(3)} directions=${directionsCovered(tris, n)}/${n}`
  );
}
console.log("\ntranslate mode directions (alpha=0.85, slide=1):");
for (const n of [4, 8, 16]) {
  const tris = perronTranslate(n, 1, 0.85);
  console.log(`n=${n}: directions=${directionsCovered(tris, n)}/${n}`);
}
