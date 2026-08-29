import { cardArt } from "../assets/cardArt";

/* A single card visual
Easy to reuse for:
face-up cards
face-down cards
played cards
hand cards
 */

function Card({ card, faceUp = true, className = "" }) {
    const imagePath = faceUp ? cardArt[`${card.suit}-${card.rank}`] : cardArt.back;

    return (
        <img
            src={imagePath}
            alt={faceUp ? `${card.rank} of ${card.suit}` : "Card back"}
            className={className}
            draggable={false}
        />
    );
}

export default Card;

