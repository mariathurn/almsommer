import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import GameHeader from "../components/GameHeader";
import GamePicker from "../components/GamePicker";
import MeadowBackground from "../components/MeadowBackground";
import PlayerPanel from "../components/PlayerPanel";
import TableCenter from "../components/TableCenter";
import useSchafkopfGame from "../hooks/useSchafkopfGame";
import { canCallAce, getSauSpielStatus } from "../ai/schafkopfAI";
import { getGameType } from "../data/gameTypes";
import { colors, getTableLayout } from "../theme";

const seats = ["north", "west", "east", "south"];
const opponents = ["north", "west", "east"];
const callableSuits = ["bell", "acorn", "leaf"];

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
    collectTrick,
  } = useSchafkopfGame();

  const [tableSize, setTableSize] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // Game hovered in the picker; its trumps are previewed in your hand.
  const [previewGame, setPreviewGame] = useState(null);

  const playerLabels = {
    south: "Maria",
    west: "Jonas",
    north: "Bernd",
    east: "Ernie",
  };

  const playerName = (playerKey) => playerLabels[playerKey] || playerKey;

  const gameType = getGameType(selectedGame);
  // Maria (south) always announces the game; in Ramsch nobody does.
  const isCaller = (playerKey) => playerKey === "south" && gameType && gameType.value !== "Ramsch";
  const getGameStatus = (playerKey) => {
    if (selectedGame === "Sau Spiel") {
      return getSauSpielStatus(playerKey, "south", teams, revealedAceOwner);
    }
    if (!gameType || gameType.value === "Ramsch") return null;
    return playerKey === "south" ? "Player" : "Opponent";
  };

  // Round flow, as in the rulebook: deal, declare a game, then play.
  const hasCards = playedCards.length > 0 || seats.some((seat) => players[seat].length > 0);
  const isTrickComplete = playedCards.length === seats.length;
  const canDeal = !hasCards;
  const needsGame = hasCards && !gameType && playedCards.length === 0;
  const availableAces = callableSuits.filter((suit) => canCallAce(suit, players.south));

  const handleDeal = () => {
    dealHands();
    setIsPickerOpen(true);
  };

  const handlePickGame = (game, ace) => {
    setPreviewGame(null);
    setSelectedGame(game);
    setCalledAce(game === "Sau Spiel" ? ace : null);
    setIsPickerOpen(false);
  };

  // The computer players never announce, so passing means everybody passed:
  // the Cowards Game is played.
  const handlePass = () => handlePickGame("Ramsch", null);
  const closePicker = () => {
    setPreviewGame(null);
    setIsPickerOpen(false);
  };
  const showPicker = isPickerOpen && needsGame;
  // Trumps shown on the cards: the hovered game while choosing, then the chosen one.
  const trumpGame = (showPicker && previewGame) || (gameType ? selectedGame : null);

  const isGameOver = () => {
    // Game is over when all players have played all their cards
    return (
      gameType &&
      playedCards.length === 0 &&
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

        return {
          message: `${winnerNames} win the ${gameType.label}`,
          points: `+${gameType.coins} coins`,
        };
      }
    }

    return { message: `The ${gameType.label} is over`, points: "" };
  };

  const layout = tableSize ? getTableLayout(tableSize.width, tableSize.height) : null;

  return (
    <View style={styles.shell}>
      <MeadowBackground />
      <View>
        <GameHeader
          hasCards={hasCards}
          currentTurn={currentTurn}
          trickWinner={trickWinner}
          selectedGame={selectedGame}
          calledAce={calledAce}
          playerName={playerName}
          onOpenMenu={onOpenMenu}
        />
        {showPicker ? <Pressable style={styles.scrim} onPress={closePicker} accessibilityLabel="Close" /> : null}
      </View>

      <View
        style={styles.table}
        onLayout={({ nativeEvent }) => setTableSize(nativeEvent.layout)}
      >
        {layout ? (
          <>
            <TableCenter
              blanket={layout.blanket}
              playedCards={playedCards}
              trickWinnerName={trickWinner ? playerName(trickWinner) : null}
              isTrickComplete={isTrickComplete}
              gameResult={getGameResult()}
              canDeal={canDeal}
              needsGame={needsGame}
              onDeal={handleDeal}
              onChooseGame={() => setIsPickerOpen(true)}
              trumpGame={trumpGame}
            />

            {opponents.map((seat) => (
              <PlayerPanel
                key={seat}
                seat={seat}
                layout={layout}
                name={playerName(seat)}
                cards={players[seat]}
                isCurrentTurn={currentTurn === seat && Boolean(gameType)}
                onPlayCard={(index) => playCard(seat, index)}
                playedCards={playedCards}
                gameType={isCaller(seat) ? selectedGame : null}
                status={getGameStatus(seat)}
                showFriendBadge={revealedAceOwner === seat}
              />
            ))}

            {/* Declaring a game: the table darkens, your hand stays visible above it. */}
            {showPicker ? (
              <>
                <Pressable style={styles.scrim} onPress={closePicker} accessibilityLabel="Close" />
                <View style={styles.pickerSlot} pointerEvents="box-none">
                  <GamePicker
                    width={Math.min(layout.width - 24, 900)}
                    maxHeight={layout.southFanTop - (layout.compact ? 12 : layout.labelHeight) - 16}
                    hand={players.south}
                    selectedGame={selectedGame}
                    calledAce={calledAce}
                    availableAces={availableAces}
                    onPick={handlePickGame}
                    onPass={handlePass}
                    onPreview={setPreviewGame}
                  />
                </View>
              </>
            ) : null}

            <PlayerPanel
              seat="south"
              layout={layout}
              name={playerName("south")}
              cards={players.south}
              isCurrentTurn={currentTurn === "south" && Boolean(gameType)}
              onPlayCard={(index) => playCard("south", index)}
              playedCards={playedCards}
              gameType={isCaller("south") ? selectedGame : null}
              status={getGameStatus("south")}
              showFriendBadge={revealedAceOwner === "south"}
              trumpGame={trumpGame}
            />

            {/* A finished trick stays until you tap anywhere on the table. */}
            {isTrickComplete ? (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={collectTrick}
                accessibilityRole="button"
                accessibilityLabel="Collect the trick"
              />
            ) : null}
          </>
        ) : null}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    overflow: "hidden",
  },
  table: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  pickerSlot: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

export default GameScreen;
