// Runs inside the page: converts the rendered DOM under the stage canvas into
// a layered SVG string (groups, rects, text, images, inline svgs).
window.__dom2svg = async function (rootSelector, frameName) {
  const root = document.querySelector(rootSelector) || document.body;
  const fontMap = {
    AlegreyaSans_400Regular: ["Alegreya Sans", 400],
    AlegreyaSans_500Medium: ["Alegreya Sans", 500],
    AlegreyaSans_700Bold: ["Alegreya Sans", 700],
    AlegreyaSans_800ExtraBold: ["Alegreya Sans", 800],
    CaveatBrush_400Regular: ["Caveat Brush", 400],
    AlfaSlabOne_400Regular: ["Alfa Slab One", 400],
    BarlowCondensed_700Bold: ["Barlow Condensed", 700],
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const r2 = (n) => Math.round(n * 100) / 100;
  let uid = 0;
  const defs = [];

  // 1. Layout without transforms.
  const kill = document.createElement("style");
  kill.textContent = "*{transform:none!important;transition:none!important;animation:none!important}";
  const all = [root, ...root.querySelectorAll("*")];
  const styles = new Map();
  for (const el of all) {
    const cs = getComputedStyle(el);
    styles.set(el, { transform: cs.transform, origin: cs.transformOrigin });
  }
  document.head.appendChild(kill);
  const boxes = new Map();
  const textLines = new Map();
  for (const el of all) boxes.set(el, el.getBoundingClientRect());
  // Text nodes: split into lines by measuring characters.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent;
    if (!text.trim()) continue;
    const lines = [];
    let cur = null;
    for (let i = 0; i < text.length; i++) {
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const rc = rects[0];
      if (!cur || Math.abs(rc.top - cur.top) > 2) {
        cur = { top: rc.top, left: rc.left, height: rc.height, text: "" };
        lines.push(cur);
      }
      cur.text += text[i];
    }
    textLines.set(n, lines.map((l) => ({ ...l, text: l.text.replace(/\s+$/, "") })).filter((l) => l.text.trim()));
  }
  kill.remove();

  // 2. Images to data URIs, scaled to at most 2x their displayed size.
  const imgCache = new Map();
  async function toDataUri(src, w, h) {
    const key = `${src}|${Math.round(w)}|${Math.round(h)}`;
    if (imgCache.has(key)) return imgCache.get(key);
    const p = (async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      await img.decode();
      const scale = Math.min(1, Math.max((Math.max(w, 1) * 2) / img.naturalWidth, (Math.max(h, 1) * 2) / img.naturalHeight));
      const cw = Math.max(1, Math.round(img.naturalWidth * scale));
      const ch = Math.max(1, Math.round(img.naturalHeight * scale));
      if (src.startsWith("data:image/svg")) return { uri: src, nw: img.naturalWidth, nh: img.naturalHeight };
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, cw, ch);
      // Opaque pictures (backgrounds) as JPEG, the rest as PNG to keep transparency.
      const px = g.getImageData(0, 0, cw, ch).data;
      let opaque = true;
      for (let i = 3; i < px.length; i += 4) if (px[i] < 255) { opaque = false; break; }
      return { uri: opaque ? c.toDataURL("image/jpeg", 0.88) : c.toDataURL("image/png"), nw: img.naturalWidth, nh: img.naturalHeight };
    })();
    imgCache.set(key, p);
    return p;
  }

  const ctx = document.createElement("canvas").getContext("2d");
  const metrics = (font) => {
    ctx.font = font;
    const m = ctx.measureText("Hg");
    return m.fontBoundingBoxAscent;
  };

  function nameFor(el) {
    const label = el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("data-testid"));
    if (label) return label;
    const t = el.innerText && el.innerText.trim().split("\n")[0];
    if (t && el.children.length === 0) return t.slice(0, 30);
    return el.tagName.toLowerCase();
  }
  const usedIds = new Set();
  const layerId = (name) => {
    let base = name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "layer";
    if (/^\d/.test(base)) base = "_" + base;
    let id = base, i = 2;
    while (usedIds.has(id)) id = `${base}-${i++}`;
    usedIds.add(id);
    return id;
  };

  function roundedRectPath(x, y, w, h, [tl, tr, br, bl]) {
    const m = Math.min(w, h) / 2;
    [tl, tr, br, bl] = [tl, tr, br, bl].map((r) => Math.min(r, m));
    return `M${r2(x + tl)},${r2(y)}H${r2(x + w - tr)}A${tr},${tr} 0 0 1 ${r2(x + w)},${r2(y + tr)}V${r2(y + h - br)}A${br},${br} 0 0 1 ${r2(x + w - br)},${r2(y + h)}H${r2(x + bl)}A${bl},${bl} 0 0 1 ${r2(x)},${r2(y + h - bl)}V${r2(y + tl)}A${tl},${tl} 0 0 1 ${r2(x + tl)},${r2(y)}Z`;
  }
  function shape(x, y, w, h, radii, attrs) {
    const [a, b, c, d] = radii;
    if (a === b && b === c && c === d)
      return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"${a ? ` rx="${r2(Math.min(a, w / 2, h / 2))}"` : ""} ${attrs}/>`;
    return `<path d="${roundedRectPath(x, y, w, h, radii)}" ${attrs}/>`;
  }
  const isVisibleColor = (c) => c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);

  function shadowFilter(boxShadow) {
    // "rgba(...) 0px 3px 8px 0px" -> drop shadow filter
    const m = boxShadow.match(/(rgba?\([^)]*\)|#\w+)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
    if (!m) return "";
    const id = `shadow${++uid}`;
    defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${m[2]}" dy="${m[3]}" stdDeviation="${r2(m[4] / 2)}" flood-color="${m[1]}"/></filter>`);
    return ` filter="url(#${id})"`;
  }

  async function renderEl(el, parentBox) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return "";
    const box = boxes.get(el);
    const w = box.width, h = box.height;
    const parts = [];
    const tag = el.tagName.toLowerCase();

    if (el instanceof SVGSVGElement) {
      const clone = el.cloneNode(true);
      // Make ids unique in the combined document.
      const prefix = `s${++uid}-`;
      clone.querySelectorAll("[id]").forEach((n) => (n.id = prefix + n.id));
      const originals = [...el.querySelectorAll("image")];
      for (const [k, im] of [...clone.querySelectorAll("image")].entries()) {
        const shown = originals[k] ? originals[k].getBoundingClientRect() : { width: 300, height: 450 };
        const href = im.getAttribute("href") || im.getAttribute("xlink:href");
        if (!href || href.startsWith("data:")) continue;
        try {
          const abs = new URL(href, location.href).href;
          const { uri } = await toDataUri(abs, Math.max(shown.width, 40), Math.max(shown.height, 40));
          im.removeAttribute("xlink:href");
          im.setAttribute("href", uri);
        } catch (e) {}
      }
      let html = clone.outerHTML.replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`).replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`);
      html = html.replace(/<svg([^>]*)>/, (m0, attrs) => {
        attrs = attrs.replace(/\s(width|height|style|class)="[^"]*"/g, "");
        return `<svg${attrs} width="${r2(w)}" height="${r2(h)}" overflow="visible">`;
      });
      parts.push(html);
    } else {
      const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((v) => parseFloat(v) || 0);
      const filter = cs.boxShadow && cs.boxShadow !== "none" ? shadowFilter(cs.boxShadow) : "";
      if (isVisibleColor(cs.backgroundColor) && w > 0 && h > 0)
        parts.push(shape(0, 0, w, h, radii, `fill="${cs.backgroundColor}"${filter}`));
      else if (filter && w > 0 && h > 0 && el.children.length) {
        // Shadow without fill: apply to content group below.
        el.__shadow = filter;
      }
      // Background images (react-native-web Image and painted views).
      const bg = cs.backgroundImage;
      if (bg && bg !== "none") {
        const url = bg.match(/url\("?([^")]+)"?\)/);
        if (url) {
          try {
            const { uri, nw, nh } = await toDataUri(url[1], w, h);
            const size = cs.backgroundSize;
            const par = size === "cover" ? "xMidYMid slice" : size === "contain" ? "xMidYMid meet" : "none";
            parts.push(`<image href="${uri}" x="0" y="0" width="${r2(w)}" height="${r2(h)}" preserveAspectRatio="${par}"/>`);
          } catch (e) {}
        }
      }
      if (tag === "img" && el.currentSrc) {
        try {
          const nw = el.naturalWidth, nh = el.naturalHeight;
          const fit = cs.objectFit;
          let sx = w / nw, sy = h / nh;
          if (fit === "cover") sx = sy = Math.max(w / nw, h / nh);
          else if (fit === "contain" || fit === "scale-down") sx = sy = Math.min(w / nw, h / nh);
          else if (fit === "none") sx = sy = 1;
          const dw = nw * sx, dh = nh * sy;
          const pos = cs.objectPosition.split(" ");
          const off = (v, free) => (v.endsWith("%") ? (free * parseFloat(v)) / 100 : parseFloat(v) || 0);
          const x = off(pos[0], w - dw), y = off(pos[1] ?? "50%", h - dh);
          const { uri } = await toDataUri(el.currentSrc, dw, dh);
          let image = `<image id="${layerId(el.alt || el.currentSrc.split("/").pop().split(".")[0] || "image")}" href="${uri}" x="${r2(x)}" y="${r2(y)}" width="${r2(dw)}" height="${r2(dh)}" preserveAspectRatio="none"/>`;
          if (dw > w + 0.5 || dh > h + 0.5 || x < -0.5 || y < -0.5) {
            const id = `clip${++uid}`;
            defs.push(`<clipPath id="${id}"><rect width="${r2(w)}" height="${r2(h)}"/></clipPath>`);
            image = `<g clip-path="url(#${id})">${image}</g>`;
          }
          parts.push(image);
        } catch (e) {}
      }
      // Border (uniform only, else per side).
      const bw = ["Top", "Right", "Bottom", "Left"].map((s) => parseFloat(cs[`border${s}Width`]) || 0);
      const bc = ["Top", "Right", "Bottom", "Left"].map((s) => cs[`border${s}Color`]);
      const bs = cs.borderTopStyle;
      if (bw.every((v) => v === bw[0]) && bw[0] > 0 && bc.every((c) => c === bc[0]) && isVisibleColor(bc[0])) {
        const half = bw[0] / 2;
        const dash = bs === "dashed" ? ` stroke-dasharray="${bw[0] * 3} ${bw[0] * 2}"` : bs === "dotted" ? ` stroke-dasharray="${bw[0]} ${bw[0]}" stroke-linecap="round"` : "";
        parts.push(shape(half, half, w - bw[0], h - bw[0], radii.map((r) => Math.max(r - half, 0)), `fill="none" stroke="${bc[0]}" stroke-width="${bw[0]}"${dash}`));
      } else {
        const sides = [
          [0, 0, w, bw[0]],
          [w - bw[1], 0, bw[1], h],
          [0, h - bw[2], w, bw[2]],
          [0, 0, bw[3], h],
        ];
        sides.forEach((s, i) => {
          if (bw[i] > 0 && isVisibleColor(bc[i])) parts.push(`<rect x="${r2(s[0])}" y="${r2(s[1])}" width="${r2(s[2])}" height="${r2(s[3])}" fill="${bc[i]}"/>`);
        });
      }

      // Children: elements and text nodes, in z-order.
      const kids = [...el.childNodes].map((node, i) => ({ node, i, z: node.nodeType === 1 ? parseInt(getComputedStyle(node).zIndex) || 0 : 0 }));
      kids.sort((a, b) => a.z - b.z || a.i - b.i);
      for (const { node } of kids) {
        if (node.nodeType === 3) {
          const lines = textLines.get(node);
          if (!lines || !lines.length) continue;
          const [family, weight] = fontMap[cs.fontFamily.split(",")[0].replace(/"/g, "").trim()] || [cs.fontFamily.split(",")[0].replace(/"/g, ""), cs.fontWeight];
          const asc = metrics(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`);
          const ls = parseFloat(cs.letterSpacing) || 0;
          const tspans = lines
            .map((l) => `<tspan x="${r2(l.left - box.left)}" y="${r2(l.top - box.top + asc)}">${esc(cs.textTransform === "uppercase" ? l.text.toUpperCase() : l.text)}</tspan>`)
            .join("");
          const shadow = cs.textShadow && cs.textShadow !== "none" ? shadowFilter(cs.textShadow) : "";
          parts.push(
            `<text id="${layerId(node.textContent.trim().slice(0, 30))}" font-family="${esc(family)}" font-weight="${weight}" font-size="${parseFloat(cs.fontSize)}" fill="${cs.color}"${ls ? ` letter-spacing="${ls}"` : ""}${shadow} xml:space="preserve">${tspans}</text>`
          );
        } else if (node.nodeType === 1) {
          parts.push(await renderEl(node, box));
        }
      }
      // Clip overflow.
      if ((cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.overflow === "clip") && w > 0 && h > 0 && parts.length) {
        const id = `clip${++uid}`;
        defs.push(`<clipPath id="${id}">${shape(0, 0, w, h, radii, "")}</clipPath>`);
        const inner = parts.join("");
        parts.length = 0;
        parts.push(`<g clip-path="url(#${id})">${inner}</g>`);
      }
    }

    const content = parts.filter(Boolean).join("");
    if (!content) return "";

    // Position relative to parent, plus the element's own transform.
    let transform = parentBox ? `translate(${r2(box.left - parentBox.left)},${r2(box.top - parentBox.top)})` : "";
    const st = styles.get(el);
    if (st && st.transform && st.transform !== "none") {
      const [ox, oy] = st.origin.split(" ").map(parseFloat);
      transform += ` translate(${r2(ox)},${r2(oy)}) ${st.transform} translate(${r2(-ox)},${r2(-oy)})`;
    }
    const opacity = parseFloat(cs.opacity) < 1 ? ` opacity="${cs.opacity}"` : "";
    const shadowAttr = el.__shadow || "";
    // Leaf drawing with no transform/opacity: skip the extra group when it holds one node.
    return `<g id="${layerId(nameFor(el))}"${transform.trim() ? ` transform="${transform.trim()}"` : ""}${opacity}${shadowAttr}>${content}</g>`;
  }

  const rootBox = boxes.get(root);
  const body = await renderEl(root, null);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${r2(rootBox.width)}" height="${r2(rootBox.height)}" viewBox="0 0 ${r2(rootBox.width)} ${r2(rootBox.height)}">
<title>${esc(frameName)}</title>
<defs>${defs.join("")}</defs>
${body.replace(/^<g id="[^"]*"/, `<g id="${esc(frameName)}"`)}
</svg>`;
};
