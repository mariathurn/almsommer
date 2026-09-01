import Card from "./Card";
import { canPlayCard } from "../ai/schafkopfAI";

function SouthFanOfCards({ cards, onPlayCard, isCurrentTurn = false, playedCards = [] }) {
    if (!cards.length) return null;

    return (
        <div className="hand-fan-south">
            {cards.map((card, index) => {
                const rotation = (index - (cards.length - 1) / 2) * 8;
                const isLegal = canPlayCard(card, cards, playedCards);
                const isDisabled = !isCurrentTurn || !isLegal;

                return (
                    <button
                        key={`${card.suit}-${card.rank}-${index}`}
                        type="button"
                        onClick={() => onPlayCard && onPlayCard(index)}
                        disabled={isDisabled}
                        className="hand-card-south"
                        style={{
                            transform: `translateX(${index * 70}px) rotate(${rotation}deg)`,
                        }}
                        title={!isLegal ? "Must follow suit" : ""}
                    >
                        <Card card={card} faceUp={true} />
                    </button>
                );
            })}
        </div>
    );
}

export default SouthFanOfCards;
