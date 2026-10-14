import { Image } from "expo-image";
import { cardArt } from "../assets/cardArt";
import { hasIllustratedDesign } from "../data/cardDesign";
import { CARD_RATIO } from "../theme";
import IllustratedCard from "./IllustratedCard";

/* A single card visual
Easy to reuse for:
face-up cards
face-down cards
played cards
hand cards
Ranks with new artwork use the illustrated design; the rest keep the classic SVGs.
 */

// gameName: the game being played; card numbers depend on it (Dog Game).
function Card({ card, faceUp = true, isTrump = false, gameName = null, height, style }) {
    const width = height * CARD_RATIO;

    if (faceUp && hasIllustratedDesign(card)) {
        return <IllustratedCard card={card} width={width} height={height} isTrump={isTrump} gameName={gameName} />;
    }

    const source = faceUp ? cardArt[`${card.suit}-${card.rank}`] : cardArt.back;

    return (
        <Image
            source={source}
            style={[{ width, height }, style]}
            contentFit="contain"
            accessibilityLabel={faceUp ? `${card.rank} of ${card.suit}` : "Card back"}
        />
    );
}

export default Card;
