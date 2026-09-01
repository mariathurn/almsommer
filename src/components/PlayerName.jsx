function PlayerName({
    name,
    gameType = null,
    status = "Non-Player",
    hiddenName = null,
    revealHiddenName = false,
    showFriendBadge = false,
}) {
    const displayName = hiddenName && !revealHiddenName ? hiddenName : name;
    const showGameTypeOrFriend = gameType || showFriendBadge;
    const badgeLabel = showFriendBadge ? "Friend" : gameType;

    return (
        <div className="player-name-wrap">
            <div className="player-name-row">
                <span className="player-name">{displayName}</span>
                <span className="player-divider">|</span>
                <span className="player-status">{status}</span>
                {showGameTypeOrFriend ? (
                    <>
                        <span className="player-divider">|</span>
                        <span className="player-game-type">{badgeLabel}</span>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default PlayerName;