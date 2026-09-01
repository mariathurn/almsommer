import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/gameheader.css";

const gameOptions = ["Sau Spiel", "Solo", "Wenz", "Pass"];
const aceOptions = [
    { label: "Ace of Hearts", value: "heart" },
    { label: "Ace of Bells", value: "bell" },
    { label: "Ace of Acorns", value: "acorn" },
    { label: "Ace of Grass", value: "leaf" },
];

function GameHeader({
    currentTurn,
    trickWinner,
    onDeal,
    selectedGame,
    onSelectGame,
    calledAce,
    onSelectCalledAce,
    playerHand = [],
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCalledAceOpen, setIsCalledAceOpen] = useState(false);
    const menuRef = useRef(null);
    const calledAceRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }

            if (calledAceRef.current && !calledAceRef.current.contains(event.target)) {
                setIsCalledAceOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const availableAceOptions = useMemo(
        () =>
            aceOptions.filter(
                ({ value }) =>
                    !playerHand.some(
                        (card) => card.rank === "A" && card.suit === value
                    )
            ),
        [playerHand]
    );

    useEffect(() => {
        if (selectedGame === "Sau Spiel" && !calledAce && availableAceOptions.length > 0) {
            onSelectCalledAce?.(availableAceOptions[0].value);
        }

        if (selectedGame !== "Sau Spiel") {
            setIsCalledAceOpen(false);
        }
    }, [selectedGame, calledAce, availableAceOptions, onSelectCalledAce]);

    const handleSelectGame = (game) => {
        onSelectGame?.(game);
        setIsMenuOpen(false);

        if (game !== "Sau Spiel") {
            onSelectCalledAce?.(null);
        }
    };

    return (
        <header className="game-header">
            <div className="game-header-title-section">
                <p className="game-header-subtitle">
                    Bavarian Card Game
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

                <div className="game-menu" ref={menuRef}>
                    <button
                        type="button"
                        className="table-button game-menu-trigger"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                    >
                        Game: {selectedGame || "Pass"}
                    </button>

                    {isMenuOpen ? (
                        <div className="game-menu-popup" role="menu" aria-label="Choose game">
                            {gameOptions.map((game) => (
                                <button
                                    key={game}
                                    type="button"
                                    className={`game-menu-option ${selectedGame === game ? "is-active" : ""}`}
                                    onClick={() => handleSelectGame(game)}
                                >
                                    {game}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                {selectedGame === "Sau Spiel" ? (
                    <div className="game-menu" ref={calledAceRef}>
                        <button
                            type="button"
                            className="table-button game-menu-trigger"
                            onClick={() => setIsCalledAceOpen((prev) => !prev)}
                        >
                            Call: {calledAce ? aceOptions.find((opt) => opt.value === calledAce)?.label : "Select Ace"}
                        </button>

                        {isCalledAceOpen ? (
                            <div className="game-menu-popup" role="menu" aria-label="Choose called ace">
                                {availableAceOptions.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`game-menu-option ${calledAce === value ? "is-active" : ""}`}
                                        onClick={() => {
                                            onSelectCalledAce?.(value);
                                            setIsCalledAceOpen(false);
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

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