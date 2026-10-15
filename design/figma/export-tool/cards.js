// Exports single cards from the Deck screen as standalone SVGs (500 x 784,
// the cards' own drawing space) with the artwork embedded at full size.
// Usage: node cards.js <out dir>   (with `npx expo start --web --port 8081` running)
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT = process.argv[2];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cards = [
  { label: "Shepherd, Eichel", file: "card-shepherd-blue" },
  { label: "Dog, Herz", file: "card-dog-red" },
  { label: "Sheep, Gras", file: "card-sheep-green" },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--mute-audio"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:8081", { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector('[aria-label="Settings"]', { timeout: 120000 });
  await wait(1500);
  await page.click('[aria-label="Settings"]');
  await page.waitForSelector('[aria-label^="View the "]');
  await page.click('[aria-label^="View the "]');
  await page.waitForSelector('[aria-label="Dog, Herz"]');
  await wait(1500);

  for (const { label, file } of cards) {
    const svg = await page.evaluate(async (l) => {
      const fonts = {
        AlfaSlabOne_400Regular: ['"Alfa Slab One"', 400],
        BarlowCondensed_700Bold: ['"Barlow Condensed"', 700],
      };
      const src = document.querySelector(`[aria-label="${l}"] svg[viewBox="0 0 500 784"]`);
      const clone = src.cloneNode(true);
      for (const im of clone.querySelectorAll("image")) {
        const href = im.getAttribute("href") || im.getAttribute("xlink:href");
        if (!href || href.startsWith("data:")) continue;
        const img = new Image();
        img.src = new URL(href, location.href).href;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        im.removeAttribute("xlink:href");
        im.setAttribute("href", c.toDataURL("image/png"));
      }
      // Real font names, so Figma picks up its own copies of the fonts.
      for (const t of clone.querySelectorAll("[font-family]")) {
        const f = fonts[t.getAttribute("font-family")];
        if (f) {
          t.setAttribute("font-family", f[0].replace(/"/g, ""));
          t.setAttribute("font-weight", f[1]);
        }
      }
      clone.removeAttribute("style");
      clone.removeAttribute("class");
      clone.setAttribute("width", 500);
      clone.setAttribute("height", 784);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      return `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
    }, label);
    fs.writeFileSync(path.join(OUT, `${file}.svg`), svg);
    console.log("saved", file, Math.round(svg.length / 1024), "KB");
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
