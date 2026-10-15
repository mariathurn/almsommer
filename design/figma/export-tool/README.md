# Figma export

Renders the web build in headless Chrome and converts the menu, game choice
and game screens (portrait and landscape) into layered SVGs for Figma, plus
single cards (shepherd, dog, sheep) at their own 500 x 784 size.

```sh
npx expo start --web --port 8081        # in one terminal
npm i --no-save puppeteer-core@23.11.1  # once
node design/figma/export-tool/capture.js design/figma
node design/figma/export-tool/cards.js design/figma
perl -0pi design/figma/export-tool/fix-fonts.pl design/figma/*.svg
```

Drag the SVGs into Figma: each becomes a frame with editable shapes, text
(Alegreya Sans, Caveat Brush, Alfa Slab One, Barlow Condensed) and image
layers. Change the cards exported in the `cards` list in cards.js.
