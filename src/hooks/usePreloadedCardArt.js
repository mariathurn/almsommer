import { useEffect, useState } from "react";
import { Image, Platform } from "react-native";
import { Asset } from "expo-asset";
import { cardTexture, rankDesign } from "../data/cardDesign";
import { uiImages } from "../data/uiArt";

// Every image the card faces use (artwork for each rank and colour, the
// texture), plus the background, title and menu figures.
const cardImages = [
    ...uiImages,
    cardTexture,
    ...Object.values(rankDesign).flatMap((design) => Object.values(design.art)),
];

// Fetches and decodes all card artwork up front, so cards show their
// illustrations immediately instead of popping in after they appear.
// Resolves to true when done (or if loading fails, so the app still starts).
function usePreloadedCardArt() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function preload() {
            const assets = await Asset.loadAsync(cardImages);
            // Warm the image cache the SVG <Image> elements read from.
            await Promise.all(
                assets.map((asset) => {
                    const uri = asset.localUri ?? asset.uri;
                    if (Platform.OS === "web") {
                        const img = new window.Image();
                        img.src = uri;
                        return img.decode().catch(() => {});
                    }
                    return Image.prefetch(uri).catch(() => {});
                })
            );
        }

        preload()
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return ready;
}

export default usePreloadedCardArt;
