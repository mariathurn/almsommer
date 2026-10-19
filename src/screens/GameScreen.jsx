import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import CoachBubble from "../components/CoachBubble";
import GameHeader from "../components/GameHeader";
import { LastTrickPanel } from "../components/LastTrick";
import MarriageExchange from "../components/MarriageExchange";
import GamePicker, { ChoicePrompt } from "../components/GamePicker";
import SceneBackground from "../components/SceneBackground";
import AchievementToast from "../components/AchievementToast";
import PausePanel from "../components/PausePanel";
import PlayerPanel from "../components/PlayerPanel";
import TableCenter from "../components/TableCenter";
import { TourOverlay, TourProvider } from "../components/Tour";
import useSchafkopfGame from "../hooks/useSchafkopfGame";
import { TOUT_GAMES, getSauSpielStatus, isTrumpForGame, parseGame, withTout } from "../ai/schafkopfAI";
import { dealScenario } from "../data/devScenarios";
import { dealGuided, dealPractice, guidedLesson } from "../data/lessons";
import { getGameType } from "../data/gameTypes";
import { t } from "../i18n";
import { cardName } from "../i18n/names";
import { getGameRank } from "../ai/players";
import { colors, fillParent, fonts, getTableLayout, softShadow } from "../theme";
import { sounds } from "../audio/sounds";
import useHotkey from "../hooks/useHotkey";
import { track } from "../analytics";

const seats = ["north", "west", "east", "south"];
const opponents = ["north", "west", "east"];

// lesson: null for a normal game, { type: "guided" } for the guided first
// game, or { type: "practice", lesson } for a practice round (see
// data/lessons.js). Lessons deal fixed cards, show tips and don't count for
// coins or achievements; at their end onLessonAction("continue" | "practice"
// | "again") picks what comes next.
function GameScreen({
  onOpenMenu,
  playerName: yourName = "",
  sessionScores,
  onRoundScored,
  lesson = null,
  onLessonAction,
}) {
  const guided = lesson?.type === "guided";
  // The pause menu (Menu button or Esc): the other players wait while it's open.
  const [isPaused, setIsPaused] = useState(false);
  // The last trick, shown again from the eye button by the banner; the others
  // wait while it is open.
  const [showLastTrick, setShowLastTrick] = useState(false);
  // Guided game: after the first trick, a short tour of the screen (index of
  // its step, null when not running); the others wait meanwhile.
  const [tourStep, setTourStep] = useState(null);
  const tourShownRef = useRef(false);
  const shellRef = useRef(null);
  useHotkey("Escape", () => (showLastTrick ? setShowLastTrick(false) : setIsPaused((paused) => !paused)), tourStep === null);
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
    lastTrick,
    roundResult,
    marriage,
    marriageOffer,
    humanMarriageOffer,
    humanMarriageAnswer,
    humanMarriageExchange,
    humanMarriageContinue,
    humanMarriagePlace,
    caller,
    bidding,
    lastBid,
    humanBid,
    doubling,
    canSayKontra,
    canSayRetour,
    sayKontra,
    sayRetour,
  } = useSchafkopfGame({ paused: isPaused || showLastTrick || tourStep !== null, allowDoubling: !lesson });

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
      const { gameName, callerTeam, winners } = roundResult;
      track("round-finished", {
        // "Solo:leaf" → "Solo", so all solos count together.
        game: String(gameName).split(":")[0],
        role: callerTeam.includes("south") ? "player" : callerTeam.length ? "opponent" : "everyone",
        won: winners.includes("south"),
        mode: lesson?.type ?? "play",
      });
      // Lessons don't count for coins or achievements.
      if (lesson) return;
      const fresh = onRoundScored?.(roundResult) ?? [];
      if (fresh.length) setNewAchievements(fresh);
    }
  }, [roundResult, onRoundScored, lesson]);

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
    const { base, suit, tout } = parseGame(value);
    return { game: base, suit, tout };
  };
  // "Jonas wants a Sheep Game", with the game's suit for a Solo.
  const wantsText = (seat, value) => t("bid.wants", { name: playerName(seat), ...gameParts(value) });
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
  // You accepted a marriage: pick the card to give back, then confirm.
  const isExchanging = marriageOffer?.stage === "exchange" && marriageSeat === "south";
  // Your offer was accepted: the swap is shown until you tap the new card.
  const isRevealing = marriageOffer?.stage === "reveal";
  // Your own offer was accepted: lay your trump on the swap field.
  const isPlacing = marriageOffer?.stage === "place";
  // Whoever accepted your marriage glows while you swap.
  const marriagePartner = isPlacing ? marriageOffer.partner : isRevealing ? marriage?.partner : null;
  const [exchangeCard, setExchangeCard] = useState(null);
  useEffect(() => {
    if (!isExchanging) setExchangeCard(null);
  }, [isExchanging]);
  const marriageTitle = marriageOffer
    ? marriageOffer.stage === "offer"
      ? t("marriage.oneTrump")
      : isPlacing || isRevealing
        ? t("marriage.revealTitle", { name: playerName(marriagePartner) })
        : isExchanging
        ? t("marriage.exchangeTitle", { name: playerName(marriageOffer.offerer) })
        : t("marriage.offers", { name: playerName(marriageOffer.offerer) })
    : null;
  // The banner says what is going on; the swap field says what to tap.
  const marriageAskNote = marriageOffer
    ? isRevealing || isExchanging || isPlacing
      ? t("marriage.together")
      : marriageSeat === "south"
        ? t("marriage.yourAnswer")
        : t("bid.deciding", { name: playerName(marriageSeat) })
    : null;
  // Kontra and Retour: shown on the name tags, and in the banner during the first trick.
  const doublingCall = (seat) =>
    doubling.kontra === seat ? t("doubling.kontra") : doubling.retour && seat === caller ? t("doubling.retour") : null;
  const doublingNote =
    doubling.kontra && !lastTrick
      ? doubling.retour
        ? t("doubling.retourNote", { name: playerName(caller) })
        : t("doubling.kontraNote", { name: playerName(doubling.kontra) })
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
    dealHands(guided ? dealGuided() : lesson ? dealPractice(lesson.lesson) : null);
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
  // anything not stronger than what someone already announced, even as a
  // Tout. Games only a Tout can still beat go to the picker as toutOnly.
  const bestRank = bestBid ? getGameRank(bestBid.game) : 0;
  const beats = (value) => getGameRank(value) > bestRank;
  const canBeat = (value) => beats(value) || (TOUT_GAMES.includes(value) && beats(withTout(value)));
  const toutOnlyGames = TOUT_GAMES.filter((value) => !beats(value) && beats(withTout(value)));
  const declinedGames = {
    ...(bestBid
      ? Object.fromEntries(
        ["Sau Spiel", "Marriage", "Wenz", "Solo"]
          .filter((value) => !canBeat(value))
          .map((value) => [value, wantsText(bestBid.seat, bestBid.game)])
      )
      : {}),
    // A marriage is offered right after the deal, before announcing.
    Marriage: t("marriage.offeredBefore"),
    // The guided first game teaches the Sheep Game.
    ...(guided ? Object.fromEntries(["Solo", "Wenz", "Marriage"].map((value) => [value, t("tutorial.onlySheep")])) : {}),
  };

  // Web shortcuts: D or Enter deals when dealing is possible.
  useHotkey("d", handleDeal, canDeal && !isPaused);
  useHotkey("Enter", handleDeal, canDeal && !isPaused);
  const closePicker = () => {
    setPreviewGame(null);
    setIsPickerOpen(false);
  };
  // Lessons: before the game panel opens, the coach's tip on what to announce
  // is shown alone over the dimmed table; a tap puts it away and opens the panel.
  const [announceTipRead, setAnnounceTipRead] = useState(false);
  const showAnnounceTip = Boolean(lesson) && needsGame && !announceTipRead;
  const showPicker = isPickerOpen && needsGame && !showAnnounceTip;
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
      // "98 : 22 points · Schneider"; Schwarz includes Schneider, so only one shows.
      points: [
        // The other side's real points: after a lost Tout not all cards were played.
        t("result.score", {
          ours: callerPoints,
          theirs: Object.values(roundResult.points).reduce((sum, p) => sum + p, 0) - callerPoints,
        }),
        roundResult.tout
          ? t("result.tout")
          : roundResult.schwarz
            ? t("result.schwarz")
            : roundResult.schneider
              ? t("result.schneider")
              : null,
        roundResult.retour ? t("doubling.retour") : roundResult.kontra ? t("doubling.kontra") : null,
      ]
        .filter(Boolean)
        .join(" · "),
      rows,
    };
  };

  const tableLayout = tableSize ? getTableLayout(tableSize.width, tableSize.height) : null;
  const layout = tableLayout;

  // Lessons: the coach's tip for what is happening now, and in the guided
  // game the one card you should play (the others are greyed out).
  const roundOver = isGameOver() && Boolean(roundResult);
  const southTurn = currentTurn === "south" && Boolean(gameType) && !isTrickComplete;
  const guidedCard = guided && southTurn ? guidedLesson.turns[6 - players.south.length] : null;
  // The tour starts once the first trick has been collected.
  useEffect(() => {
    if (guided && !tourShownRef.current && lastTrick && playedCards.length === 0) {
      tourShownRef.current = true;
      setTourStep(0);
    }
  }, [guided, lastTrick, playedCards.length]);
  const tourSteps = [
    { target: "banner", text: t("tour.banner"), placement: "bottom" },
    { target: "lastTrick", text: t("tour.lastTrick"), placement: "bottom" },
    { target: "name", text: t("tour.name"), placement: "top" },
    { target: "coins", text: t("tour.coins"), placement: layout?.portrait ? "top" : "bottom" },
    { target: "menu", text: t("tour.menu"), placement: "bottom" },
  ];

  const coach = (() => {
    if (!lesson) return {};
    if (roundOver) {
      return guided
        ? {
            text: t("tutorial.done"),
            actions: [
              { label: t("tutorial.practice"), onPress: () => onLessonAction?.("practice") },
              { label: t("tutorial.continue"), onPress: () => onLessonAction?.("continue"), primary: true },
            ],
          }
        : {
            text: t("practice.done"),
            actions: [
              { label: t("practice.back"), onPress: () => onLessonAction?.("practice") },
              { label: t("practice.again"), onPress: () => onLessonAction?.("again"), primary: true },
            ],
          };
    }
    if (guided) {
      if (!hasCards) return { text: t("tutorial.deal") };
      // While the others announce (and until the first card) there is no tip:
      // it would only flash up for a moment.
      if (!gameType) return needsGame ? { text: t("tutorial.announce") } : {};
      // The trick's winner leads the next one; after the last trick comes the result.
      if (isTrickComplete) {
        if (players.south.length === 0) return { text: t("tutorial.collectLast") };
        return { text: trickWinner === "south" ? t("tutorial.collectYou") : t("tutorial.collect", { name: playerName(trickWinner) }) };
      }
      if (guidedCard) return { text: t(`tutorial.turn${7 - players.south.length}`) };
      return playedCards.length || players.south.length < 6 ? { text: t("tutorial.wait") } : {};
    }
    const id = lesson.lesson.id;
    if (!gameType) return { text: `${t(`lesson.${id}.goal`)} ${t(`lesson.${id}.tip1`)}` };
    return { text: t(`lesson.${id}.${lastTrick ? "tip3" : "tip2"}`) };
  })();

  // Your hand during a marriage swap: the card on the swap field has left it,
  // and the card you get only joins it once you tap it on the field.
  const southHand = players.south.filter(
    (card) =>
      !(isExchanging && card.id === exchangeCard?.id) && !(isRevealing && card.id === marriageOffer?.received?.id)
  );


  // Whether a point in the window (a dragged card's pointer) is over the
  // table circle, with a little slack around its edge.
  const isOverTable = (x, y) => {
    if (!layout) return false;
    const { blanket } = layout;
    const dx = x - tableOrigin.current.x - blanket.centerX;
    const dy = y - tableOrigin.current.y - blanket.centerY;
    return Math.hypot(dx, dy) <= (blanket.width / 2) * 1.15;
  };
  // The panel reaches up over the banner to the top of the screen, for room.
const pickerTop = (layout?.portrait ? 8 : 40) - headerHeight;

  return (
    <TourProvider>
      <View style={styles.shell} ref={shellRef} collapsable={false}>
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
            note={marriageAskNote ?? biddingNote ?? doublingNote ?? marriageNote}
            onShowLastTrick={() => setShowLastTrick(true)}
            hasLastTrick={Boolean(lastTrick)}
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
                  isHighlighted={marriagePartner === seat}
                  score={sessionScores?.[seat] ?? 0}
                  call={doublingCall(seat)}
                />
              ))}

              {/* Marriage: Maria offers one, or answers someone else's offer. */}
              {isExchanging ? (
                <MarriageExchange
                  blanket={layout.blanket}
                  given={exchangeCard}
                  received={marriageOffer.trump}
                  onConfirm={() => exchangeCard && humanMarriageExchange(exchangeCard)}
                />
              ) : null}

              {/* Your offer was accepted: lay your trump down to see what you get. */}
              {isPlacing ? (
                <MarriageExchange blanket={layout.blanket} given={null} received={null} waitingHint={t("marriage.placeHint")} />
              ) : null}

              {isRevealing ? (
                <MarriageExchange
                  blanket={layout.blanket}
                  given={marriageOffer.trump}
                  received={marriageOffer.received}
                  onConfirm={humanMarriageContinue}
                  hint={t("marriage.revealHint")}
                />
              ) : null}

              {marriageOffer && marriageSeat === "south" && !isExchanging && !isRevealing && !isPlacing ? (
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
                      toutOnly={toutOnlyGames}
                      onClose={closePicker}
                      allowedSheep={guided ? [guidedLesson.calledAce] : null}
                      canPass={!guided}
                    />
                  </View>
                </>
              ) : null}

              <PlayerPanel
                seat="south"
                layout={layout}
                name={playerName("south")}
                cards={southHand}
                isCurrentTurn={isExchanging || isPlacing || (!isRevealing && currentTurn === "south" && Boolean(gameType))}
                onPlayCard={(index) =>
                  isPlacing
                    ? humanMarriagePlace(southHand[index])
                    : isExchanging
                      ? setExchangeCard(southHand[index])
                      : playCard("south", index)
                }
                selectMode={isExchanging || isPlacing}
                selectableIds={
                  guidedCard
                    ? [guidedCard]
                    : isPlacing && marriageOffer.offered
                    ? [marriageOffer.offered.id]
                    : isExchanging
                      ? southHand.filter((card) => !isTrumpForGame(card, "Marriage")).map((card) => card.id)
                      : null
                }
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
                call={doublingCall("south")}
              />

              {/* Kontra or Retour, only while you can still say it. */}
              {canSayKontra || canSayRetour ? (
                <Pressable
                  onPress={canSayKontra ? sayKontra : sayRetour}
                  accessibilityRole="button"
                  accessibilityLabel={t(canSayKontra ? "doubling.kontraButton" : "doubling.retourButton")}
                  style={({ pressed, hovered }) => [
                    styles.doublingButton,
                    layout.portrait ? styles.doublingButtonPhone : styles.doublingButtonWide,
                    (pressed || hovered) && styles.doublingButtonActive,
                  ]}
                >
                  <Text style={styles.doublingLabel}>{t(canSayKontra ? "doubling.kontraButton" : "doubling.retourButton")}</Text>
                  <Text style={styles.doublingHint}>{t("doubling.hint")}</Text>
                </Pressable>
              ) : null}

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

        {showAnnounceTip && coach.text && !isPaused ? (
          <>
            <Pressable
              style={[styles.scrim, styles.tipScrim]}
              onPress={() => setAnnounceTipRead(true)}
              accessibilityLabel={t("tour.next")}
            />
            <CoachBubble
              text={coach.text}
              actions={[{ label: t("tour.next"), onPress: () => setAnnounceTipRead(true), primary: true }]}
            />
          </>
        ) : lesson && coach.text && !showPicker && !isPaused && !showLastTrick && tourStep === null ? (
          <CoachBubble text={coach.text} actions={coach.actions} />
        ) : null}

        {/* Hidden while the last trick (tried out from the tour) or the menu is open. */}
        {tourStep !== null && !isPaused && !showLastTrick ? (
          <TourOverlay
            rootRef={shellRef}
            steps={tourSteps}
            step={tourStep}
            nextLabel={t("tour.next")}
            doneLabel={t("tour.done")}
            onNext={() => setTourStep(tourStep + 1 < tourSteps.length ? tourStep + 1 : null)}
          />
        ) : null}

        {showLastTrick && lastTrick ? (
          <LastTrickPanel
            trick={lastTrick}
            playerName={playerName}
            trumpGame={trumpGame}
            onClose={() => setShowLastTrick(false)}
          />
        ) : null}

        {isPaused ? (
          <PausePanel
            onResume={() => setIsPaused(false)}
            onLeave={onOpenMenu}
            onDevDeal={(scenario) => {
              setIsPaused(false);
              sounds.shuffle();
              dealHands(dealScenario(scenario));
            }}
          />
        ) : null}
      </View>
    </TourProvider>
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
  doublingButton: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.ink,
    backgroundColor: colors.hay,
    ...softShadow,
  },
  doublingButtonWide: {
    right: 24,
    bottom: 24,
  },
  doublingButtonPhone: {
    right: 10,
    bottom: 64,
  },
  doublingButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  doublingLabel: {
    fontFamily: fonts.hand,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
  },
  doublingHint: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  tipScrim: {
    zIndex: 11,
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
