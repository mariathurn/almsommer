# Figma export

Renders the web build in headless Chrome and converts the menu, game choice
and game screens (portrait and landscape) into layered SVGs for Figma.

```sh
npx expo start --web --port 8081        # in one terminal
npm i --no-save puppeteer-core@23.11.1  # once
node design/figma/export-tool/capture.js design/figma
```

Drag the SVGs into Figma: each becomes a frame with editable shapes, text
(Alegreya Sans, Caveat Brush, Alfa Slab One) and image layers.
