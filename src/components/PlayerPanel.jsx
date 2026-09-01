/* PlayerPanel

Already a good standalone component
Owns one player’s summary, counts, and list of cards
Keeps the main App from being a giant render block */

import FanOfCards from "./FanOfCards";
import PlayerName from "./PlayerName";

function PlayerPanel({
    name,
    cards,
    isCurrentTurn,
    onPlayCard,
    orientation = "horizontal",
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
            <FanOfCards
                cards={cards}
                onPlayCard={onPlayCard}
                isCurrentTurn={isCurrentTurn}
                orientation={orientation}
                playedCards={playedCards}
            />
        </div>
    );
}

export default PlayerPanel;