import "./styles/table.css";
import "./styles/cards.css"
import GameHeader from "./components/GameHeader";
import PlayerPanel from "./components/PlayerPanel";
import SouthPlayerPanel from "./components/SouthPlayerPanel";
import TableCenter from "./components/TableCenter";
import useSchafkopfGame from "./hooks/useSchafkopfGame";

function App() {
  const {
    players,
    currentTurn,
    playedCards,
    trickWinner,
    selectedGame,
    setSelectedGame,
    calledAce,
    setCalledAce,
    teams,
    revealedAceOwner,
    dealHands,
    playCard,
  } = useSchafkopfGame();

  const playerLabels = {
    south: "Maria",
    west: "Jonas",
    north: "Bernd",
    east: "Ernie",
  };

  const playerName = (playerKey) => playerLabels[playerKey] || playerKey;

  const isCaller = (playerKey) => selectedGame === "Sau Spiel" && playerKey === "south";
  const isHiddenFriend = (playerKey) => {
    if (selectedGame !== "Sau Spiel") return false;
    if (!teams.callerTeam.length || revealedAceOwner === playerKey) return false;
    return teams.callerTeam.includes(playerKey) && playerKey !== "south";
  };

  const getGameStatus = (playerKey) => {
    if (selectedGame === "Sau Spiel") {
      if (isCaller(playerKey)) return "Caller";
      if (teams.callerTeam.includes(playerKey)) return "Partner";
      return "Opponent";
    }
    return "Non-Player";
  };

  const isGameOver = () => {
    // Game is over when all players have played all their cards
    return (
      selectedGame !== "Pass" &&
      selectedGame &&
      players.south.length === 0 &&
      players.west.length === 0 &&
      players.north.length === 0 &&
      players.east.length === 0
    );
  };

  const getGameResult = () => {
    if (!isGameOver()) return null;

    // For Sau Spiel: show caller and revealed partner as winners
    if (selectedGame === "Sau Spiel") {
      const winnerKeys = [
        "south", // caller is always Maria (south)
        ...(revealedAceOwner && revealedAceOwner !== "south" ? [revealedAceOwner] : []),
      ];

      if (winnerKeys.length > 0) {
        const winnerNames = winnerKeys.map(key => playerName(key)).join(" and ");
        const points = 5;

        return {
          message: `${winnerNames} won ${selectedGame}`,
          points: `+${points} points`,
        };
      }
    }

    return null;
  };

  return (
    <div className="table-wrapper">
      <div className="table-shell">
        <GameHeader
          currentTurn={currentTurn}
          trickWinner={trickWinner}
          onDeal={dealHands}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
          calledAce={calledAce}
          onSelectCalledAce={setCalledAce}
          playerHand={players.south}
        />

        <TableCenter
          playedCards={playedCards}
          trickWinner={trickWinner}
          gameResult={getGameResult()}
        />

        <div className="player-slot north">
          <PlayerPanel
            name={playerName("north")}
            cards={players.north}
            isCurrentTurn={currentTurn === "north"}
            onPlayCard={(index) => playCard("north", index)}
            orientation="horizontal"
            playedCards={playedCards}
            gameType={isCaller("north") ? selectedGame : null}
            status={getGameStatus("north")}
            hiddenName={isHiddenFriend("north") ? "Friend" : null}
            revealHiddenName={revealedAceOwner === "north"}
            showFriendBadge={revealedAceOwner === "north"}
          />
        </div>

        <div className="player-slot east">
          <PlayerPanel
            name={playerName("east")}
            cards={players.east}
            isCurrentTurn={currentTurn === "east"}
            onPlayCard={(index) => playCard("east", index)}
            orientation="vertical"
            playedCards={playedCards}
            gameType={isCaller("east") ? selectedGame : null}
            status={getGameStatus("east")}
            hiddenName={isHiddenFriend("east") ? "Friend" : null}
            revealHiddenName={revealedAceOwner === "east"}
            showFriendBadge={revealedAceOwner === "east"}
          />
        </div>

        <div className="player-slot south">
          <SouthPlayerPanel
            name={playerName("south")}
            cards={players.south}
            isCurrentTurn={currentTurn === "south"}
            onPlayCard={(index) => playCard("south", index)}
            playedCards={playedCards}
            gameType={isCaller("south") ? selectedGame : null}
            status={getGameStatus("south")}
            hiddenName={isHiddenFriend("south") ? "Friend" : null}
            revealHiddenName={revealedAceOwner === "south"}
            showFriendBadge={revealedAceOwner === "south"}
          />
        </div>

        <div className="player-slot west">
          <PlayerPanel
            name={playerName("west")}
            cards={players.west}
            isCurrentTurn={currentTurn === "west"}
            onPlayCard={(index) => playCard("west", index)}
            orientation="vertical"
            playedCards={playedCards}
            gameType={isCaller("west") ? selectedGame : null}
            status={getGameStatus("west")}
            hiddenName={isHiddenFriend("west") ? "Friend" : null}
            revealHiddenName={revealedAceOwner === "west"}
            showFriendBadge={revealedAceOwner === "west"}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
