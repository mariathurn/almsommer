import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import GameHeader from "../components/GameHeader";
import GamePicker from "../components/GamePicker";
import SceneBackground from "../components/SceneBackground";
import PlayerPanel from "../components/PlayerPanel";
import TableCenter from "../components/TableCenter";
import useSchafkopfGame from "../hooks/useSchafkopfGame";
import { getSauSpielStatus } from "../ai/schafkopfAI";
import { getCardName, getGameType } from "../data/gameTypes";
import { colors, getTableLayout } from "../theme";
import { sounds } from "../audio/sounds";
import useHotkey from "../hooks/useHotkey";

const seats = ["north", "west", "east", "south"];
const opponents = ["north", "west", "east"];

function GameScreen({ onOpenMenu, sessionScores, onRoundScored }) {
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
    roundResult,
    marriage,
    announceMarriage,
  } = useSchafkopfGame();

  // A card landing on the table, and a finished trick being collected.
  const previousTrickSizeRef = useRef(0);
  useEffect(() => {
    const previous = previousTrickSizeRef.current;
    previousTrickSizeRef.current = playedCards.length;
    if (playedCards.length > previous) sounds.placeCard();
    else if (previous === 4 && playedCards.length === 0) sounds.collectTrick();
  }, [playedCards.length]);

  // Add each finished round to the session balance exactly once.
  const scoredRoundRef = useRef(null);
  useEffect(() => {
    if (roundResult && scoredRoundRef.current !== roundResult.id) {
      scoredRoundRef.current = roundResult.id;
      onRoundScored?.(roundResult.deltas);
    }
  }, [roundResult, onRoundScored]);

  const [tableSize, setTableSize] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // Nobody accepted Maria's marriage this round.
  const [marriageDeclined, setMarriageDeclined] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
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
    if (selectedGame === "Marriage") {
      if (playerKey === "south") return "Caller";
      return playerKey === marriage?.partner ? "Partner" : "Opponent";
    }
    if (!gameType || gameType.value === "Ramsch") return null;
    return playerKey === "south" ? "Player" : "Opponent";
  };

  // Until the first card is played, the banner tells how the marriage went.
  const firstTrickNotStarted = playedCards.length === 0 && players.south.length === 6;
  const marriageNote =
    selectedGame === "Marriage" && marriage && firstTrickNotStarted
      ? `Swapped: ${getCardName(marriage.trump)} → ${getCardName(marriage.given)}`
      : null;

  // Round flow, as in the rulebook: deal, declare a game, then play.
  const hasCards = playedCards.length > 0 || seats.some((seat) => players[seat].length > 0);
  const isTrickComplete = playedCards.length === seats.length;
  const canDeal = !hasCards;
  const needsGame = hasCards && !gameType && playedCards.length === 0;

  const handleDeal = () => {
    setMarriageDeclined(false);
    sounds.shuffle();
    dealHands();
    setIsPickerOpen(true);
  };

  const handlePickGame = (game, ace) => {
    setPreviewGame(null);
    setIsPickerOpen(false);
    if (game === "Marriage") {
      // Nobody accepted: no marriage. The panel stays open with the Marriage
      // tile greyed out, so Maria picks another game or passes.
      if (!announceMarriage().partner) {
        setMarriageDeclined(true);
        setIsPickerOpen(true);
      }
      return;
    }
    setSelectedGame(game);
    setCalledAce(game === "Sau Spiel" ? ace : null);
  };

  // The computer players never announce, so passing means everybody passed:
  // the Cowards Game is played.
  const handlePass = () => handlePickGame("Ramsch", null);

  // Web shortcuts: D or Enter deals when dealing is possible.
  useHotkey("d", handleDeal, canDeal);
  useHotkey("Enter", handleDeal, canDeal);
  const closePicker = () => {
    setPreviewGame(null);
    setIsPickerOpen(false);
  };
  const showPicker = isPickerOpen && needsGame;
  // Trumps shown on the cards: the hovered game while choosing, then the
  // chosen one; before a game is chosen, the Sheep Game trumps.
  const trumpGame = (showPicker && previewGame) || (gameType ? selectedGame : hasCards ? "Sau Spiel" : null);

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

  // Result panel after the last trick: who won with how many points, and
  // each player's coins for this round and for the session.
  const getGameResult = () => {
    if (!isGameOver() || !roundResult) return null;
    const names = (keys) => keys.map(playerName).join(" & ");
    const rows = ["south", "west", "north", "east"].map((seat) => ({
        seat,
        name: playerName(seat),
        delta: roundResult.deltas[seat],
        total: sessionScores?.[seat] ?? 0,
        isWinner: roundResult.winners.includes(seat),
      }));

    if (roundResult.gameName === "Ramsch") {
      return {
        message: `${names(roundResult.losers)} ${roundResult.losers.length > 1 ? "lose" : "loses"} the ${gameType.label}`,
        points: `${Math.max(...Object.values(roundResult.points))} points taken`,
        rows,
      };
    }

    // Always name the side that announced: "Maria loses the Solo Game".
    const callers = roundResult.callerTeam;
    const callersWon = callers.every((seat) => roundResult.winners.includes(seat));
    const plural = callers.length > 1;
    const verb = callersWon ? (plural ? "win" : "wins") : plural ? "lose" : "loses";
    const callerPoints = roundResult.callerPoints;
    return {
      message: `${names(callers)} ${verb} the ${gameType.label}`,
      points: `${callerPoints} : ${120 - callerPoints} points`,
      rows,
    };
  };

  const tableLayout = tableSize ? getTableLayout(tableSize.width, tableSize.height) : null;
  const layout = tableLayout;
  // Phones: the panel reaches up over the banner to the top of the screen.
  const pickerTop = layout?.portrait ? 8 - headerHeight : 8;

  return (
    <View style={styles.shell}>
      <SceneBackground />
      <View onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
        <GameHeader
          hasCards={hasCards}
          currentTurn={currentTurn}
          trickWinner={trickWinner}
          selectedGame={selectedGame}
          calledAce={calledAce}
          playerName={playerName}
          onOpenMenu={onOpenMenu}
          coins={sessionScores?.south ?? 0}
          marriagePartnerName={marriage?.partner ? playerName(marriage.partner) : null}
          note={marriageNote}
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
              portrait={Boolean(layout.portrait)}
              playedCards={playedCards}
              trickWinner={trickWinner}
              trickWinnerName={trickWinner ? playerName(trickWinner) : null}
              isTrickComplete={isTrickComplete}
              gameResult={getGameResult()}
              canDeal={canDeal}
              needsGame={needsGame && !showPicker}
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
                showFriendBadge={revealedAceOwner === seat || (selectedGame === "Marriage" && marriage?.partner === seat)}
                isTrickWinner={isTrickComplete && trickWinner === seat}
                score={sessionScores?.[seat] ?? 0}
              />
            ))}

            {/* Declaring a game: the table darkens, your hand stays visible above it. */}
            {showPicker ? (
              <>
                <Pressable style={styles.scrim} onPress={closePicker} accessibilityLabel="Close" />
                <View style={[styles.pickerSlot, { top: pickerTop }]} pointerEvents="box-none">
                  <GamePicker
                    width={Math.min(layout.width - 24, 900)}
                    maxHeight={layout.southFanTop - pickerTop - (layout.portrait ? 12 : layout.compact ? 12 : layout.labelHeight + 16)}
                    hand={players.south}
                    onPick={handlePickGame}
                    onPass={handlePass}
                    onPreview={setPreviewGame}
                    declined={marriageDeclined ? { Marriage: "Nobody accepted your marriage" } : null}
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
              isTrickWinner={isTrickComplete && trickWinner === "south"}
              score={sessionScores?.south ?? 0}
              trumpGame={trumpGame}
              highlightTrumps={Boolean(showPicker && previewGame)}
              calledAce={selectedGame === "Sau Spiel" ? calledAce : null}
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
    zIndex: 10,
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

export default GameScreen;
