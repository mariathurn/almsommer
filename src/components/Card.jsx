import { Image } from "expo-image";
import { cardArt } from "../assets/cardArt";
import { CARD_RATIO } from "../theme";

/* A single card visual
Easy to reuse for:
face-up cards
face-down cards
played cards
hand cards
 */

function Card({ card, faceUp = true, height, style }) {
    const source = faceUp ? cardArt[`${card.suit}-${card.rank}`] : cardArt.back;

    return (
        <Image
            source={source}
            style={[{ width: height * CARD_RATIO, height }, style]}
            contentFit="contain"
            accessibilityLabel={faceUp ? `${card.rank} of ${card.suit}` : "Card back"}
        />
    );
}

export default Card;
