import { useState } from "react";
import { StyleSheet, View } from "react-native";
import GameHeader from "../components/GameHeader";
import PlayerPanel from "../components/PlayerPanel";
import TableCenter from "../components/TableCenter";
import useSchafkopfGame from "../hooks/useSchafkopfGame";
import { getSauSpielStatus } from "../ai/schafkopfAI";
import { colors, getTableLayout } from "../theme";

const seats = ["north", "west", "east", "south"];

function GameScreen({ onOpenMenu }) {
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

  const [tableSize, setTableSize] = useState(null);

  const playerLabels = {
    south: "Maria",
    west: "Jonas",
    north: "Bernd",
    east: "Ernie",
  };

  const playerName = (playerKey) => playerLabels[playerKey] || playerKey;

  const isCaller = (playerKey) => selectedGame === "Sau Spiel" && playerKey === "south";
  const getGameStatus = (playerKey) => {
    if (selectedGame === "Sau Spiel") {
      return getSauSpielStatus(playerKey, "south", teams, revealedAceOwner);
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

  const layout = tableSize ? getTableLayout(tableSize.width, tableSize.height) : null;

  return (
    <View style={styles.shell}>
      <GameHeader
        currentTurn={currentTurn}
        trickWinner={trickWinner}
        onDeal={dealHands}
        selectedGame={selectedGame}
        onSelectGame={setSelectedGame}
        calledAce={calledAce}
        onSelectCalledAce={setCalledAce}
        playerHand={players.south}
        onOpenMenu={onOpenMenu}
      />

      <View
        style={styles.table}
        onLayout={({ nativeEvent }) => setTableSize(nativeEvent.layout)}
      >
        {layout ? (
          <>
            <TableCenter
              board={layout.board}
              playedCards={playedCards}
              trickWinner={trickWinner}
              gameResult={getGameResult()}
            />

            {seats.map((seat) => (
              <PlayerPanel
                key={seat}
                seat={seat}
                layout={layout}
                name={playerName(seat)}
                cards={players[seat]}
                isCurrentTurn={currentTurn === seat}
                onPlayCard={(index) => playCard(seat, index)}
                playedCards={playedCards}
                gameType={isCaller(seat) ? selectedGame : null}
                status={getGameStatus(seat)}
                showFriendBadge={revealedAceOwner === seat}
              />
            ))}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    borderWidth: 3,
    borderColor: colors.goldSoft,
    backgroundColor: colors.table,
    overflow: "hidden",
  },
  table: {
    flex: 1,
  },
});

export default GameScreen;
