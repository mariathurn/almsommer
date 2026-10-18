const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT = process.argv[2];
const URL = "http://localhost:8081";
const converter = fs.readFileSync(path.join(__dirname, "dom2svg.js"), "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const viewports = {
  portrait: { width: 430, height: 932 },
  landscape: { width: 1280, height: 800 },
};

async function markStage(page) {
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find((d) => /scale\(/.test(d.style.transform));
    el.setAttribute("data-stage", "1");
  });
}

async function save(page, name) {
  await markStage(page);
  await page.evaluate(converter);
  const svg = await page.evaluate((n) => window.__dom2svg('[data-stage="1"]', n), name);
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
  await page.screenshot({ path: path.join(OUT, "_png", `${name}.png`) });
  console.log("saved", name, Math.round(svg.length / 1024), "KB");
}

const clickLabel = (page, label) =>
  page.evaluate((l) => {
    const el = document.querySelector(`[aria-label="${l}"]`);
    if (el) el.click();
    return Boolean(el);
  }, label);
const hasLabel = (page, label) => page.evaluate((l) => Boolean(document.querySelector(`[aria-label="${l}"]`)), label);

async function reachPicker(page) {
  for (let attempt = 0; attempt < 15; attempt++) {
    await page.keyboard.press("p");
    await wait(800);
    await clickLabel(page, "Deal");
    for (let t = 0; t < 40; t++) {
      await wait(300);
      if (await hasLabel(page, "Pass")) return true;
      // Marriage offer for us: decline it.
      if (await clickLabel(page, "No")) continue;
      await clickLabel(page, "Decline");
      await clickLabel(page, "Choose game");
    }
    // Esc opens the pause menu; leave the game (and confirm if a round is on).
    await page.keyboard.press("Escape");
    await wait(300);
    await clickLabel(page, "Leave game");
    await wait(300);
    await clickLabel(page, "Leave game");
    await wait(500);
  }
  return false;
}

(async () => {
  fs.mkdirSync(path.join(OUT, "_png"), { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  for (const [orientation, vp] of Object.entries(viewports)) {
    const page = await browser.newPage();
    await page.setViewport({ ...vp, deviceScaleFactor: 2 });
    await page.goto(URL, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => document.querySelector("img") || [...document.querySelectorAll("div")].some((d) => d.style.backgroundImage), { timeout: 120000 });
    await wait(4000);
    await save(page, `menu-${orientation}`);

    if (!(await reachPicker(page))) throw new Error("never got the game picker");
    await wait(1200);
    await save(page, `game-choice-${orientation}`);

    // Pick the first available game and play into the first trick.
    await page.evaluate(() => {
      const tile = [...document.querySelectorAll('[role="button"][aria-label*="coins"]')].find((t) => t.getAttribute("aria-disabled") !== "true");
      tile && tile.click();
    });
    await wait(600);
    const played = await page.evaluate(() => {
      const b = [...document.querySelectorAll('[aria-label^="Play "]')][0];
      if (b) b.click();
      return Boolean(b);
    });
    if (!played) await clickLabel(page, "Pass");
    // Let the others finish announcing and lead; play one of our cards if asked.
    for (let t = 0; t < 30; t++) {
      await wait(300);
      if (await clickLabel(page, "Pass")) continue;
    }
    // Play cards from the hand (bottom of the stage) until the trick has a few cards.
    for (let round = 0; round < 3; round++) {
      await wait(2500);
      await page.evaluate(async () => {
        const vh = window.innerHeight;
        const cards = [...document.querySelectorAll('[tabindex="0"]')].filter((e) => e.getBoundingClientRect().top > vh * 0.7 && !e.getAttribute("aria-label"));
        for (const c of cards.reverse()) {
          c.click();
          await new Promise((r) => setTimeout(r, 250));
        }
      });
    }
    await wait(1500);
    await save(page, `game-${orientation}`);
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
