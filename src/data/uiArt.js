// Artwork for the menus and table, from src/assets/ui (smaller copies of the
// originals in src/assets/Illus).

export const sceneBackground = require("../assets/ui/bg-dark.jpg");
export const titleLettering = require("../assets/ui/almsommer-title.png");
export const TITLE_RATIO = 1400 / 327;

// The four shepherds standing on the title screen, with width / height.
export const menuShepherds = {
    blue: { source: require("../assets/ui/shepherd-blue.png"), ratio: 801 / 1300 },
    red: { source: require("../assets/ui/shepherd-red.png"), ratio: 808 / 1300 },
    green: { source: require("../assets/ui/shepherd-green.png"), ratio: 777 / 1300 },
    orange: { source: require("../assets/ui/shepherd-orange.png"), ratio: 583 / 1300 },
};

// Hand-painted disc the trick is played on (portrait) and the round deal
// button. Both are partly translucent, so the painting shows through.
export const tableDisc = require("../assets/ui/circular-table.png");
export const dealButton = require("../assets/ui/deal-button.png");

// Hand-painted title-screen buttons (cropped from src/assets/Illus/buttons),
// with width / height.
export const menuButtons = {
    play: { source: require("../assets/ui/button-play.png"), ratio: 520 / 265 },
    achievements: { source: require("../assets/ui/button-achievements.png"), ratio: 520 / 157 },
    settings: { source: require("../assets/ui/button-settings.png"), ratio: 520 / 182 },
};

export const uiImages = [
    sceneBackground,
    titleLettering,
    tableDisc,
    dealButton,
    ...Object.values(menuButtons).map((b) => b.source),
    ...Object.values(menuShepherds).map((s) => s.source),
];
