import "./styles/table.css";
import GameHeader from "./components/GameHeader";
import PlayerPanel from "./components/PlayerPanel";
import TableCenter from "./components/TableCenter";
import useSchafkopfGame from "./hooks/useSchafkopfGame";

function App() {
  const { players, currentTurn, playedCards, trickWinner, dealHands, playCard } =
    useSchafkopfGame();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d7a8b] p-4">
      <div className="table-shell">
        <GameHeader currentTurn={currentTurn} trickWinner={trickWinner} onDeal={dealHands} />

        <TableCenter playedCards={playedCards} />

        <div className="player-slot north">
          <PlayerPanel
            name="north"
            cards={players.north}
            isCurrentTurn={currentTurn === "north"}
            onPlayCard={(index) => playCard("north", index)}
            orientation="horizontal"
            playedCards={playedCards}
          />
        </div>

        <div className="player-slot east">
          <PlayerPanel
            name="east"
            cards={players.east}
            isCurrentTurn={currentTurn === "east"}
            onPlayCard={(index) => playCard("east", index)}
            orientation="vertical"
            playedCards={playedCards}
          />
        </div>

        <div className="player-slot south">
          <PlayerPanel
            name="south"
            cards={players.south}
            isCurrentTurn={currentTurn === "south"}
            onPlayCard={(index) => playCard("south", index)}
            orientation="horizontal"
            playedCards={playedCards}
          />
        </div>

        <div className="player-slot west">
          <PlayerPanel
            name="west"
            cards={players.west}
            isCurrentTurn={currentTurn === "west"}
            onPlayCard={(index) => playCard("west", index)}
            orientation="vertical"
            playedCards={playedCards}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
