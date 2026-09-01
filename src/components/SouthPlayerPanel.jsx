import SouthFanOfCards from "./SouthFanOfCards";
import PlayerName from "./PlayerName";

function SouthPlayerPanel({
    name,
    cards,
    isCurrentTurn,
    onPlayCard,
    playedCards = [],
    gameType = null,
    status = "Non-Player",
    hiddenName = null,
    revealHiddenName = false,
    showFriendBadge = false,
}) {
    return (
        <div className="player-panel">
            <PlayerName
                name={name}
                gameType={gameType}
                status={status}
                hiddenName={hiddenName}
                revealHiddenName={revealHiddenName}
                showFriendBadge={showFriendBadge}
            />
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
