// Smoke-drive the built game: play through the levels like a player would,
// screenshotting each, and fail loudly on console errors.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shots = path.join(root, "scripts", "shots");
const url = "file://" + path.join(root, "dist", "kakeya-game.html");

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 960, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

async function shot(name) {
  await page.screenshot({ path: path.join(shots, name + ".png"), fullPage: false });
  console.log("shot:", name);
}
async function setRange(selector, value) {
  await page.$eval(
    selector,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    value
  );
}
const winVisible = () => page.waitForSelector(".winbar:not([hidden])", { timeout: 4000 });
const next = async () => {
  await page.click(".winbar button.act");
  await page.waitForTimeout(200);
};

await page.goto(url);
await page.waitForTimeout(600);
await shot("00-load");

// L1: sweep to 180, then bet.
for (let v = 0; v <= 180; v += 10) await setRange(".level input[type=range]", v);
await page.waitForTimeout(200);
await page.click('button:has-text("non-convex wins")');
await winVisible();
await shot("01-needle");
await next();

// L2: 16 slivers, full slide (translate is default).
const l2sliders = await page.$$(".level input[type=range]");
await l2sliders[0].evaluate((el) => { el.value = "4"; el.dispatchEvent(new Event("input", { bubbles: true })); });
for (let s = 0; s <= 1.001; s += 0.1) {
  await l2sliders[1].evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, s);
}
await winVisible();
await shot("02-squeeze");
await next();

// L3: wait for rasterize, push fineness to max.
await page.waitForSelector(".level canvas.board", { timeout: 6000 });
await page.waitForTimeout(700);
await setRange(".level input[type=range]", 4);
await winVisible();
await shot("03-dimension");
await next();

// L4: set wedge width to target-ish, drag wedge to ~25 deg.
await page.waitForTimeout(300);
const sliders4 = await page.$$(".level input[type=range]");
const wedgeSlider = sliders4[sliders4.length - 1];
await wedgeSlider.evaluate((el) => { el.value = "0.35"; el.dispatchEvent(new Event("input", { bubbles: true })); });
const freq = (await page.$$(".level .scopepanel canvas.board"))[0];
const box = await freq.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
const r = 70;
const a = (25 * Math.PI) / 180;
await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
await page.mouse.down();
await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
await page.mouse.up();
await page.waitForTimeout(400);
await winVisible();
await shot("04-waves");
await next();

// L5: drag all tubes to center, then cutoff. Scroll settles first so the
// board's coordinates hold still during the drags.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const before = (await page.$$(".level canvas.board"))[0];
await before.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const b5 = await before.boundingBox();
for (let i = 0; i < 9; i++) {
  const sx = b5.x + 60 + (i % 3) * 100;
  const sy = b5.y + 60 + Math.floor(i / 3) * 100;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(b5.x + 160, b5.y + 160 + (i - 4) * 2, { steps: 5 });
  await page.mouse.up();
}
await page.waitForTimeout(400);
await shot("05a-packed");
const cutoff = await page.$('button:has-text("Apply sharp cutoff")');
const disabled = await cutoff.getAttribute("disabled");
console.log("cutoff disabled?", disabled === null ? "no" : "yes");
if (disabled === null) {
  await cutoff.click();
  await page.waitForTimeout(400);
  await winVisible();
}
await shot("05b-cutoff");
if (disabled === null) await next();
else { console.log("L5 not packed under par — see screenshot"); process.exit(1); }

// L6: answer both predictions correctly.
await page.click('button:has-text("None of them")');
await page.waitForTimeout(300);
await page.click('button:has-text("None — it removes one obstruction")');
await winVisible();
await shot("06-tower");
await next();

// L7: sort cards.
const assign = async (cardText, bucketIdx) => {
  await page.click(`.techcard:has-text("${cardText}")`);
  const headers = await page.$$(".bucket h4");
  await headers[bucketIdx].click();
};
await assign("MRI", 0);
await assign("WiFi", 0);
await assign("Song", 0);
await assign("JPEG", 1);
await assign("MP3", 1);
await page.click('button:has-text("Check my sorting")');
await winVisible();
await shot("07-running");
await next();

// L8: just verify it renders and try a few offsets.
await page.waitForTimeout(300);
await shot("08-finite");

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
process.exit(errors.length ? 1 : 0);
