/* A layout component for the player’s cards fanned out in a fan
Handles rotation and spacing for each player’s hand */

import Card from "./Card";
import { canPlayCard } from "../ai/schafkopfAI";

function FanOfCards({ cards, onPlayCard, isCurrentTurn = false, orientation = "horizontal", playedCards = [] }) {
    if (!cards.length) return null;

    return (
        <div className="hand-fan">
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
                        className={`hand-card ${orientation}`}
                        style={{
                            transform: `translateX(${index * 55}px) rotate(${rotation}deg)`,
                            top: orientation === "vertical" ? `${index * 18}px` : "0",
                        }}
                        title={!isLegal ? "Must follow suit" : ""}
                    >
                        <Card card={card} faceUp={false} />
                    </button>
                );
            })}
        </div>
    );
}

export default FanOfCards;