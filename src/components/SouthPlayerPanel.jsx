import SouthFanOfCards from "./SouthFanOfCards";
import PlayerName from "./PlayerName";

function SouthPlayerPanel({ name, cards, isCurrentTurn, onPlayCard, playedCards = [] }) {
    return (
        <div className="player-panel">
            <PlayerName name={name} />
            <SouthFanOfCards
                cards={cards}
                onPlayCard={onPlayCard}
                isCurrentTurn={isCurrentTurn}
                playedCards={playedCards}
            />
        </div>
    );
}

export default SouthPlayerPanel;
