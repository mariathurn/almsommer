import "../styles/gameheader.css";

function GameHeader({ currentTurn, trickWinner, onDeal }) {
    return (
        <header className="game-header">
            <div className="game-header-title-section">
                <p className="game-header-subtitle">
                    Card table
                </p>
                <h1 className="game-header-title">Schafkopf</h1>
            </div>

            <div className="game-header-controls">
                {trickWinner ? (
                    <span className="turn-pill">
                        Trick: {trickWinner}
                    </span>
                ) : null}

                <span className="turn-pill">
                    Turn: {currentTurn}
                </span>

                <button
                    type="button"
                    onClick={onDeal}
                    className="table-button"
                >
                    Deal
                </button>
            </div>
        </header>
    );
}

export default GameHeader;