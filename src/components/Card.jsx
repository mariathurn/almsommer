import { Image } from "expo-image";
import { cardArt } from "../assets/cardArt";
import { useCardDeck } from "../data/cardDecks";
import { hasIllustratedDesign } from "../data/cardDesign";
import { CARD_RATIO } from "../theme";
import IllustratedCard from "./IllustratedCard";

/* A single card visual
Easy to reuse for:
face-up cards
face-down cards
played cards
hand cards
In the Almsommer deck, ranks with new artwork use the illustrated design; the
classic deck (and ranks without artwork) use the classic SVGs.
 */

// Shape of the classic SVGs: 349 x 610, corner radius 51.
const CLASSIC_RATIO = 349 / 610;
const CLASSIC_CORNER = 51 / 349;

// gameName: the game being played; card numbers depend on it (Dog Game).
// deck: show this deck instead of the chosen one (deck previews).
function Card({ card, faceUp = true, isTrump = false, gameName = null, height, deck, style }) {
    const width = height * CARD_RATIO;
    const chosenDeck = useCardDeck();

    if (faceUp && (deck ?? chosenDeck) === "almsommer" && hasIllustratedDesign(card)) {
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
