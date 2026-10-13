// Prepares the card artwork from the originals in src/assets/Illus:
//
// 1. bg.png -> Illus/bg-card.png, a luminance-only texture: darker-than-average
//    areas become translucent black, lighter ones translucent white, and
//    mid-tones transparent. Laid over a coloured panel it shifts only
//    brightness, so the suit colour keeps its saturation instead of going grey.
// 2. Every <motif>-<colour>.png -> src/assets/card-art/, downscaled so a full
//    deck stays light on phone memory, plus card-art/sizes.json with their
//    dimensions. The originals are left untouched.
//
// Usage: npm run card-art

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const dir = path.join(__dirname, "../src/assets/Illus");
const artDir = path.join(__dirname, "../src/assets/card-art");
const ART_MAX_SIZE = 720;
const TARGET_HEIGHT = 1000;
const STRENGTH = 2; // how far a pixel's luminance distance from the mean is amplified

// Box-filter downscale with premultiplied alpha, so transparent edges stay clean.
function downscale(src, width, height) {
    const out = new PNG({ width, height });
    const sx = src.width / width;
    const sy = src.height / height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0, n = 0;
            for (let py = Math.floor(y * sy); py < Math.min(src.height, Math.ceil((y + 1) * sy)); py++) {
                for (let px = Math.floor(x * sx); px < Math.min(src.width, Math.ceil((x + 1) * sx)); px++) {
                    const i = (py * src.width + px) * 4;
                    const pa = src.data[i + 3];
                    r += src.data[i] * pa;
                    g += src.data[i + 1] * pa;
                    b += src.data[i + 2] * pa;
                    a += pa;
                    n++;
                }
            }
            const o = (y * width + x) * 4;
            out.data[o] = a ? Math.round(r / a) : 0;
            out.data[o + 1] = a ? Math.round(g / a) : 0;
            out.data[o + 2] = a ? Math.round(b / a) : 0;
            out.data[o + 3] = Math.round(a / n);
        }
    }
    return out;
}

fs.mkdirSync(artDir, { recursive: true });
const sizes = {};
for (const file of fs.readdirSync(dir)) {
    if (!/^[a-z]+-[a-z]+\.png$/.test(file) || file === "bg-card.png") continue;
    const art = PNG.sync.read(fs.readFileSync(path.join(dir, file)));
    const factor = Math.min(1, ART_MAX_SIZE / Math.max(art.width, art.height));
    const resized = downscale(art, Math.round(art.width * factor), Math.round(art.height * factor));
    fs.writeFileSync(path.join(artDir, file), PNG.sync.write(resized));
    sizes[file] = { width: resized.width, height: resized.height };
    console.log(`card-art/${file}: ${resized.width} x ${resized.height}`);
}
// Image sizes for layouts that need the exact aspect ratio (the shepherd figures).
fs.writeFileSync(path.join(artDir, "sizes.json"), JSON.stringify(sizes, null, 2) + "\n");

const src = PNG.sync.read(fs.readFileSync(path.join(dir, "bg.png")));
const scale = src.height / TARGET_HEIGHT;
const width = Math.round(src.width / scale);
const height = TARGET_HEIGHT;

// Box-filter downscale to the texture's luminance as it appears over white (0-1).
const lum = new Float32Array(width * height);
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        let l = 0, a = 0, n = 0;
        for (let sy = Math.floor(y * scale); sy < Math.min(src.height, Math.floor((y + 1) * scale)); sy++) {
            for (let sx = Math.floor(x * scale); sx < Math.min(src.width, Math.floor((x + 1) * scale)); sx++) {
                const i = (sy * src.width + sx) * 4;
                const pa = src.data[i + 3] / 255;
                l += pa * (0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2]) / 255;
                a += pa;
                n++;
            }
        }
        // Composite over white: transparent areas count as light, opaque grey as darker.
        lum[y * width + x] = n ? 1 - (a - l) / n : 1;
    }
}

const mean = lum.reduce((sum, l) => sum + l, 0) / lum.length;

const out = new PNG({ width, height });
for (let i = 0; i < lum.length; i++) {
    const delta = lum[i] - mean;
    const value = delta > 0 ? 255 : 0;
    out.data[i * 4] = value;
    out.data[i * 4 + 1] = value;
    out.data[i * 4 + 2] = value;
    out.data[i * 4 + 3] = Math.round(Math.min(1, Math.abs(delta) * STRENGTH) * 255);
}

fs.writeFileSync(path.join(dir, "bg-card.png"), PNG.sync.write(out));
console.log(`bg-card.png: ${width} x ${height}, mean luminance ${mean.toFixed(2)}`);
