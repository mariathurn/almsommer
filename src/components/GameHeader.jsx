/* The title, “Deal” button, and current turn indicator
Keeps the board logic separate from the UI chrome */

function GameHeader({ currentTurn, trickWinner, onDeal }) {
    return (
        <header className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                    Card table
                </p>
                <h1 className="text-3xl font-bold text-white">Schafkopf</h1>
            </div>

            <div className="flex items-center gap-3">
                {trickWinner ? (
                    <span className="turn-pill rounded-full px-3 py-1 text-sm font-semibold">
                        Trick: {trickWinner}
                    </span>
                ) : null}

                <span className="turn-pill rounded-full px-3 py-1 text-sm font-semibold">
                    Turn: {currentTurn}
                </span>

                <button
                    type="button"
                    onClick={onDeal}
                    className="table-button rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wide"
                >
                    Deal
                </button>
            </div>
        </header>
    );
}

export default GameHeader;