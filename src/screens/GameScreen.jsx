import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import GameHeader from "../components/GameHeader";
import GamePicker, { ChoicePrompt } from "../components/GamePicker";
import SceneBackground from "../components/SceneBackground";
import AchievementToast from "../components/AchievementToast";
import PausePanel from "../components/PausePanel";
import PlayerPanel from "../components/PlayerPanel";
import TableCenter from "../components/TableCenter";
import useSchafkopfGame from "../hooks/useSchafkopfGame";
import { getSauSpielStatus, parseGame } from "../ai/schafkopfAI";
import { getGameType } from "../data/gameTypes";
import { t } from "../i18n";
import { cardName } from "../i18n/names";
import { getGameRank } from "../ai/players";
import { colors, fillParent, getTableLayout } from "../theme";
import { sounds } from "../audio/sounds";
import useHotkey from "../hooks/useHotkey";

const seats = ["north", "west", "east", "south"];
const opponents = ["north", "west", "east"];

function GameScreen({ onOpenMenu, playerName: yourName = "Maria", sessionScores, onRoundScored }) {
  // The pause menu (Menu button or Esc): the other players wait while it's open.
  const [isPaused, setIsPaused] = useState(false);
  useHotkey("Escape", () => setIsPaused((paused) => !paused));
  const {
    players,
    currentTurn,
    playedCards,
    trickWinner,
    selectedGame,
    calledAce,
    teams,
    revealedAceOwner,
    dealHands,
    playCard,
    collectTrick,
    roundResult,
    marriage,
    marriageOffer,
    humanMarriageOffer,
    humanMarriageAnswer,
    caller,
    bidding,
    lastBid,
    humanBid,
  } = useSchafkopfGame({ paused: isPaused });

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
  // Achievements earned by the last round, shown in a toast.
  const [newAchievements, setNewAchievements] = useState([]);
  useEffect(() => {
    if (roundResult && scoredRoundRef.current !== roundResult.id) {
      scoredRoundRef.current = roundResult.id;
      const fresh = onRoundScored?.(roundResult) ?? [];
      if (fresh.length) setNewAchievements(fresh);
    }
  }, [roundResult, onRoundScored]);

  const [tableSize, setTableSize] = useState(null);
  // Where the table sits in the window, so a card dragged from your hand
  // can be checked against the table circle.
  const tableRef = useRef(null);
  const tableOrigin = useRef({ x: 0, y: 0 });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  // Game hovered in the picker; its trumps are previewed in your hand.
  const [previewGame, setPreviewGame] = useState(null);

  const playerLabels = {
    south: yourName,
    west: "Jonas",
    north: "Bernd",
    east: "Ernie",
  };

  const playerName = (playerKey) => playerLabels[playerKey] || playerKey;

  const gameType = getGameType(selectedGame);
  // Whoever announced the game; in the Cowards Game nobody did.
  const isCaller = (playerKey) => playerKey === caller && gameType && gameType.value !== "Ramsch";
  const getGameStatus = (playerKey) => {
    if (!gameType || gameType.value === "Ramsch" || !caller) return null;
    if (selectedGame === "Sau Spiel") {
      // Maria knows she is the partner when she holds the called sheep.
      if (playerKey === "south" && caller !== "south" && teams.callerTeam.includes("south")) return "Partner";
      return getSauSpielStatus(playerKey, caller, teams, revealedAceOwner);
    }
    if (selectedGame === "Marriage") {
      if (playerKey === caller) return "Caller";
      return teams.callerTeam.includes(playerKey) ? "Partner" : "Opponent";
    }
    return playerKey === caller ? "Player" : "Opponent";
  };

  // Announcing: who has the say, and the best game so far.
  const biddingSeat = bidding?.seat ?? null;
  const bestBid = bidding?.best ?? null;
  // A game value split for the texts: { game: "Solo", suit: "leaf" }.
  const gameParts = (value) => {
    const { base, suit } = parseGame(value);
    return { game: base, suit };
  };
  // "Jonas wants a Sheep Game", with the game's suit for a Solo.
  const wantsText = (seat, value) => {
    const { base, suit } = parseGame(value);
    return t("bid.wants", { name: playerName(seat), game: base, suit });
  };
  const biddingTitle = bidding ? (bestBid ? wantsText(bestBid.seat, bestBid.game) : t("bid.whoPlays")) : null;
  const lastBidText = lastBid
    ? lastBid.marriageDeclined
      ? t("bid.nobodyMarried", { name: playerName(lastBid.seat) })
      : lastBid.game
        ? t("bid.announces", { name: playerName(lastBid.seat), ...gameParts(lastBid.game) })
        : t("bid.passes", { name: playerName(lastBid.seat) })
    : null;

  // Marriage offer, before announcing: who offers and who has to answer.
  const marriageSeat = marriageOffer?.seat ?? null;
  const marriageTitle = marriageOffer
    ? marriageOffer.stage === "offer"
      ? t("marriage.oneTrump")
      : t("marriage.offers", { name: playerName(marriageOffer.offerer) })
    : null;
  const marriageAskNote = marriageOffer
    ? marriageSeat === "south"
      ? t("marriage.yourAnswer")
      : t("bid.deciding", { name: playerName(marriageSeat) })
    : null;
  const biddingNote = bidding
    ? [lastBidText, biddingSeat === "south" ? t("bid.yourSay") : t("bid.deciding", { name: playerName(biddingSeat) })]
        .filter(Boolean)
        .join(" · ")
    : null;

  // Until the first card is played, the banner tells how the marriage went.
  const firstTrickNotStarted = playedCards.length === 0 && players.south.length === 6;
  const marriageNote =
    selectedGame === "Marriage" && marriage && firstTrickNotStarted
      ? t("marriage.swapped", { from: cardName(marriage.trump), to: cardName(marriage.given) })
      : null;

  // Round flow, as in the rulebook: deal, declare a game, then play.
  const hasCards = playedCards.length > 0 || seats.some((seat) => players[seat].length > 0);
  const isTrickComplete = playedCards.length === seats.length;
  const canDeal = !hasCards;
  // Maria's turn to announce a game or pass.
  const needsGame = biddingSeat === "south";

  const handleDeal = () => {
    sounds.shuffle();
    dealHands();
  };

  // The game panel opens when it's Maria's say.
  useEffect(() => {
    if (needsGame) setIsPickerOpen(true);
  }, [needsGame]);

  const handlePickGame = (game, ace) => {
    setPreviewGame(null);
    setIsPickerOpen(false);
    humanBid(game, game === "Sau Spiel" ? ace : null);
  };

  // Passing hands the say on; if everybody passes, the Cowards Game is played.
  const handlePass = () => {
    setPreviewGame(null);
    setIsPickerOpen(false);
    humanBid(null);
  };

  // Games Maria can't announce any more: a marriage nobody accepts, and
  // anything not stronger than what someone already announced.
  const declinedGames = {
    ...(bestBid
      ? Object.fromEntries(
          ["Sau Spiel", "Marriage", "Wenz", "Solo"]
            .filter((value) => getGameRank(value) <= getGameRank(bestBid.game))
            .map((value) => [value, wantsText(bestBid.seat, bestBid.game)])
        )
      : {}),
    // A marriage is offered right after the deal, before announcing.
    Marriage: t("marriage.offeredBefore"),
  };

  // Web shortcuts: D or Enter deals when dealing is possible.
  useHotkey("d", handleDeal, canDeal && !isPaused);
  useHotkey("Enter", handleDeal, canDeal && !isPaused);
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
        message: t("result.loses", {
          names: names(roundResult.losers),
          plural: roundResult.losers.length > 1,
          game: gameType.value,
        }),
        points: t("result.pointsTaken", { points: Math.max(...Object.values(roundResult.points)) }),
        rows,
      };
    }

    // Always name the side that announced: "Maria loses the Solo Game".
    const callers = roundResult.callerTeam;
    const callersWon = callers.every((seat) => roundResult.winners.includes(seat));
    const plural = callers.length > 1;
    const callerPoints = roundResult.callerPoints;
    return {
      message: t(callersWon ? "result.wins" : "result.loses", { names: names(callers), plural, game: gameType.value }),
      points: t("result.score", { ours: callerPoints, theirs: 120 - callerPoints }),
      rows,
    };
  };

  const tableLayout = tableSize ? getTableLayout(tableSize.width, tableSize.height) : null;
  const layout = tableLayout;

  // Whether a point in the window (a dragged card's pointer) is over the
  // table circle, with a little slack around its edge.
  const isOverTable = (x, y) => {
    if (!layout) return false;
    const { blanket } = layout;
    const dx = x - tableOrigin.current.x - blanket.centerX;
    const dy = y - tableOrigin.current.y - blanket.centerY;
    return Math.hypot(dx, dy) <= (blanket.width / 2) * 1.15;
  };
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
          onOpenMenu={() => setIsPaused(true)}
          coins={sessionScores?.south ?? 0}
          marriagePartnerName={marriage?.partner ? playerName(marriage.partner) : null}
          caller={caller}
          title={marriageTitle ?? biddingTitle}
          note={marriageAskNote ?? biddingNote ?? marriageNote}
        />
        {showPicker ? <Pressable style={styles.scrim} onPress={closePicker} accessibilityLabel={t("common.close")} /> : null}
      </View>

      <View
        ref={tableRef}
        style={styles.table}
        onLayout={({ nativeEvent }) => {
          setTableSize(nativeEvent.layout);
          tableRef.current?.measureInWindow((x, y) => {
            tableOrigin.current = { x, y };
          });
        }}
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
                isCurrentTurn={
                  marriageOffer ? marriageSeat === seat : bidding ? biddingSeat === seat : currentTurn === seat && Boolean(gameType)
                }
                onPlayCard={(index) => playCard(seat, index)}
                playedCards={playedCards}
                gameType={isCaller(seat) ? selectedGame : null}
                status={getGameStatus(seat)}
                showFriendBadge={revealedAceOwner === seat || (selectedGame === "Marriage" && marriage?.partner === seat)}
                isTrickWinner={isTrickComplete && trickWinner === seat}
                score={sessionScores?.[seat] ?? 0}
              />
            ))}

            {/* Marriage: Maria offers one, or answers someone else's offer. */}
            {marriageOffer && marriageSeat === "south" ? (
              <>
                <View style={styles.scrim} />
                <View style={[styles.pickerSlot, { top: layout.height * 0.2, paddingHorizontal: 16 }]} pointerEvents="box-none">
                  {marriageOffer.stage === "offer" ? (
                    <ChoicePrompt
                      heading={t("marriage.offerHeading")}
                      text={t("marriage.offerText")}
                      noLabel={t("marriage.no")}
                      yesLabel={t("marriage.offer")}
                      onNo={() => humanMarriageOffer(false)}
                      onYes={() => humanMarriageOffer(true)}
                    />
                  ) : (
                    <ChoicePrompt
                      heading={t("marriage.askHeading")}
                      text={t("marriage.askText", { name: playerName(marriageOffer.offerer) })}
                      noLabel={t("marriage.decline")}
                      yesLabel={t("marriage.accept")}
                      onNo={() => humanMarriageAnswer(false)}
                      onYes={() => humanMarriageAnswer(true)}
                    />
                  )}
                </View>
              </>
            ) : null}

            {/* Declaring a game: the table darkens, your hand stays visible above it. */}
            {showPicker ? (
              <>
                <Pressable style={styles.scrim} onPress={closePicker} accessibilityLabel={t("common.close")} />
                <View style={[styles.pickerSlot, { top: pickerTop }]} pointerEvents="box-none">
                  <GamePicker
                    width={Math.min(layout.width - 24, 900)}
                    maxHeight={layout.southFanTop - pickerTop - (layout.portrait ? 12 : layout.compact ? 12 : layout.labelHeight + 16)}
                    hand={players.south}
                    onPick={handlePickGame}
                    onPass={handlePass}
                    onPreview={setPreviewGame}
                    declined={declinedGames}
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
              isOverTable={isOverTable}
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
                accessibilityLabel={t("table.collectTrick")}
              />
            ) : null}
          </>
        ) : null}
      </View>

      <AchievementToast ids={newAchievements} onDone={() => setNewAchievements([])} />

      {isPaused ? (
        <PausePanel onResume={() => setIsPaused(false)} onLeave={onOpenMenu} isRoundInProgress={hasCards} />
      ) : null}
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
    ...fillParent,
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
