/* The middle area that shows the current trick / played cards
Easy to style and isolate from the rest of the table */
import "../styles/table.css";
import "../styles/cards.css";

import Card from "./Card";

function TableCenter({ playedCards, trickWinner, gameResult }) {
    return (
        <div className="table-center">
            <div className="board">
                <div className="played-cards">
                    {playedCards.length > 0 ? (
                        playedCards.map(({ player, card }, index) => (
                            <div
                                key={`${player}-${index}`}
                                className="played-card"
                                style={{
                                    transform: `translate(${index * 12}px, ${index * 12}px) rotate(${index * 15}deg)`,
                                }}
                            >
                                <Card card={card} faceUp={true} className="trick-card" />
                            </div>
                        ))
                    ) : (
                        <span className="announcements">
                            {gameResult ? (
                                <div className="game-result">
                                    <div>{gameResult.message}</div>
                                    <div>{gameResult.points}</div>
                                </div>
                            ) : trickWinner ? (
                                `${trickWinner} wins the trick!`
                            ) : (
                                "Play!"
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TableCenter;