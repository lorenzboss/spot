"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Gamepad, RefreshCw, Settings, Trophy, Undo2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MultiplayerConfig from "./MultiplayerConfig";

interface CardData {
  id: number;
  src: string;
  matched: boolean;
  matchedBy?: number;
}

interface TurnLogEntry {
  turn: number;
  pairId: string;
  isMatch: boolean;
  wasKnowable: boolean;
  countsInAccuracy: boolean;
  isCorrect: boolean;
  reason:
    | "known match"
    | "lucky match"
    | "missed known partner"
    | "chose known non-matching card"
    | "ignored known pair"
    | "exploration";
}

interface CardProps {
  card: CardData;
  handleChoice: (card: CardData) => void;
  flipped: boolean;
  disabled: boolean;
  isMultiplayer: boolean;
  currentPlayer: number;
}

const PLAYER_CONFIGS = [
  {
    border: "border-indigo-400/90",
    bg: "bg-indigo-50",
    ring: "ring-indigo-400",
    text: "text-indigo-600",
  },
  {
    border: "border-sky-400/90",
    bg: "bg-sky-50",
    ring: "ring-sky-400",
    text: "text-sky-600",
  },
  {
    border: "border-teal-400/90",
    bg: "bg-teal-50",
    ring: "ring-teal-400",
    text: "text-teal-600",
  },
  {
    border: "border-lime-400/90",
    bg: "bg-lime-50",
    ring: "ring-lime-400",
    text: "text-lime-600",
  },
];

/**
 * Helper function to shuffle an array (Fisher-Yates Shuffle)
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Single Card Component
 */
const Card: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled, isMultiplayer, currentPlayer }) => {
  const handleClick = () => {
    if (!disabled) {
      handleChoice(card);
    }
  };

  const borderColor = isMultiplayer
    ? card.matched
      ? PLAYER_CONFIGS[(card.matchedBy ?? 0) % PLAYER_CONFIGS.length].border
      : PLAYER_CONFIGS[currentPlayer % PLAYER_CONFIGS.length].border
    : card.matched
      ? "border-green-400/90"
      : "border-blue-400/90";

  return (
    <div
      className={`group relative aspect-square perspective-[1000px] ${
        card.matched || disabled ? "cursor-default" : "cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <div
        className={`h-full w-full transform rounded-xl border-2 shadow-sm transition-all duration-500 transform-3d ${
          flipped ? "transform-[rotateY(180deg)] " + borderColor : "border-slate-200 hover:border-blue-300"
        }`}
      >
        {/* Front (Image) - Visible when flipped */}
        <div
          className={`absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center overflow-hidden rounded-[10px] bg-white backface-hidden ${
            flipped ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.src}
            alt="Pixel Art"
            className="h-full w-full scale-110 object-contain [image-rendering:pixelated]"
          />
        </div>

        {/* Back (Cover) - Visible when not flipped */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-[10px] bg-slate-100 transition-colors duration-300 backface-hidden ${
            !flipped ? "opacity-100" : "opacity-0"
          }`}
        >
          <Gamepad className="h-10 w-10 text-slate-300 opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default function MemoryGame({
  title,
  description,
  playersCount: initialPlayersCount = 1,
  isTournament: initialIsTournament = false,
  initialPlayers,
  targetGames: initialTargetGames = 3,
  initialTournamentScores,
  initialTournamentHistory,
  initialGameIndex = 1,
}: {
  title?: string;
  description?: string;
  playersCount?: number;
  isTournament?: boolean;
  initialPlayers?: { name: string }[];
  targetGames?: number | "unlimited";
  initialTournamentScores?: number[];
  initialTournamentHistory?: { winners: number[] }[];
  initialGameIndex?: number;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState<CardData | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<CardData | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [turnsLog, setTurnsLog] = useState<TurnLogEntry[]>([]);
  const [turnFeedback, setTurnFeedback] = useState<{ message: string; type: "correct" | "neutral" | "wrong" } | null>(
    null,
  );
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackKeyRef = useRef(0);
  // Maps card id → src for all cards physically seen in previous turns
  const seenCardsRef = useRef<Map<number, string>>(new Map());
  // Whether a fully-known unmatched pair was available at the start of the current turn
  const knownPairsAvailableRef = useRef(false);
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [playerMatches, setPlayerMatches] = useState<number[]>([]);

  // Tournament state
  const [isTournament, setIsTournament] = useState(initialIsTournament);
  const [targetGames, setTargetGames] = useState<number | "unlimited">(initialTargetGames);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>(
    initialPlayers?.map((p, i) => ({ id: i.toString(), name: p.name })) ||
      Array(initialPlayersCount)
        .fill(0)
        .map((_, i) => ({ id: i.toString(), name: `Player ${i + 1}` })),
  );
  const [tournamentScores, setTournamentScores] = useState<number[]>(
    initialTournamentScores || Array(players.length).fill(0),
  );
  const [tournamentHistory, setTournamentHistory] = useState<{ winners: number[] }[]>(initialTournamentHistory || []);
  const [currentGameIndex, setCurrentGameIndex] = useState(initialGameIndex);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showFinalStandings, setShowFinalStandings] = useState(false);
  const [playersCount, setPlayersCount] = useState(players.length);

  // Update persistence
  useEffect(() => {
    if (playersCount <= 1) return;

    // URL only keeps the tournament flag
    const params = new URLSearchParams();
    params.set("tournament", isTournament.toString());
    router.replace(`/play/local-multiplayer/game?${params.toString()}`, { scroll: false });

    // Everything else goes to LocalStorage
    const gameState = {
      players,
      isTournament,
      targetGames,
      tournamentScores,
      tournamentHistory,
      currentGameIndex,
    };
    localStorage.setItem("memory-game-local-multiplayer", JSON.stringify(gameState));
  }, [players, isTournament, targetGames, tournamentScores, tournamentHistory, currentGameIndex, router]);

  // Convex hooks
  const saveGameScore = useMutation(api.scoreFunctions.saveGameScore);

  // Initialize game
  const shuffleCards = () => {
    // Generate 8 random Pokemon IDs between 1 and 150 (Gen 1)
    const randomIds = new Set<number>();
    while (randomIds.size < 8) {
      randomIds.add(Math.floor(Math.random() * 150) + 1);
    }

    const cardImages = Array.from(randomIds).map((id) => ({
      src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      matched: false,
    }));

    // Create pairs and shuffle
    const shuffledCards = shuffleArray([...cardImages, ...cardImages]).map((card) => ({ ...card, id: Math.random() }));

    // Log solution as 4x4 grid
    const pairIndex: Record<string, number> = {};
    let pairCounter = 1;
    const labels = shuffledCards.map((card) => {
      if (!(card.src in pairIndex)) pairIndex[card.src] = pairCounter++;
      return pairIndex[card.src];
    });
    const rows = [0, 1, 2, 3].map((row) =>
      labels
        .slice(row * 4, row * 4 + 4)
        .map((n) => String(n).padStart(2))
        .join(" "),
    );
    if (process.env.NODE_ENV === "development") console.log("🃏 Solution:\n" + rows.join("\n"));

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    setIsWon(false);
    setDisabled(false);
    setMatches(0);
    setAttempts(0);
    setTurnsLog([]);
    seenCardsRef.current = new Map();
    knownPairsAvailableRef.current = false;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setTurnFeedback(null);
    setTime(0);
    setIsGameActive(false);
    setScoreSaved(false);
    setCurrentScore(null);
    // Random starting player for tournament or multiplayer
    const startingPlayer = Math.floor(Math.random() * playersCount);
    setCurrentPlayer(startingPlayer);
    setPlayerMatches(Array(playersCount).fill(0));
  };

  // Reset turn
  const resetTurn = useCallback(() => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns((prevTurns) => prevTurns + 1);
    setDisabled(false);
  }, []);

  // Handle choice
  const handleChoice = (card: CardData) => {
    // Prevent clicking if card is already matched or if two cards are already chosen
    if (card.matched || choiceTwo) return;

    // Prevent clicking the same card twice
    if (choiceOne && card.id === choiceOne.id) return;

    if (choiceOne) {
      setChoiceTwo(card);
    } else {
      // Start timer on first card flip
      if (!isGameActive) {
        setIsGameActive(true);
      }
      // Before flipping the first card, check if any fully-known unmatched pair exists.
      // Group seen card ids by src, ignoring already-matched cards.
      const srcToSeenIds = new Map<string, number[]>();
      for (const [id, src] of seenCardsRef.current.entries()) {
        const cardState = cards.find((c) => c.id === id);
        if (cardState?.matched) continue;
        if (!srcToSeenIds.has(src)) srcToSeenIds.set(src, []);
        srcToSeenIds.get(src)!.push(id);
      }
      knownPairsAvailableRef.current = [...srcToSeenIds.values()].some((ids) => ids.length >= 2);
      setChoiceOne(card);
    }
  };

  // Comparison logic
  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      setAttempts((prev) => prev + 1);

      const isMatch = choiceOne.src === choiceTwo.src;

      const seen = seenCardsRef.current;
      // Do we know where the partner of choiceOne is?
      // (a card with same src seen in a previous turn, different position)
      const knewPartnerOfOne = [...seen.entries()].some(([id, src]) => src === choiceOne.src && id !== choiceOne.id);
      // Did the player already know what choiceTwo was (seen it in a previous turn)?
      const knewChoiceTwo = seen.has(choiceTwo.id);
      // Was a fully-known unmatched pair available at the start of this turn
      // (captured when choiceOne was picked) but the player didn't use it?
      const ignoredKnownPair = knownPairsAvailableRef.current;

      // A turn counts toward accuracy if the player had information that could have
      // led to a better move. Pure exploration is excluded.
      const countsInAccuracy = isMatch || knewPartnerOfOne || knewChoiceTwo || ignoredKnownPair;
      const isCorrect = isMatch;

      // Describe reason for log readability
      const reason: TurnLogEntry["reason"] = isMatch
        ? knewPartnerOfOne
          ? "known match"
          : "lucky match"
        : knewPartnerOfOne
          ? "missed known partner"
          : knewChoiceTwo
            ? "chose known non-matching card"
            : ignoredKnownPair
              ? "ignored known pair"
              : "exploration";

      const feedbackMap: Record<TurnLogEntry["reason"], { message: string; type: "correct" | "neutral" | "wrong" }> = {
        "known match": { message: "Match, you knew where it was.", type: "correct" },
        "lucky match": { message: "Lucky match!", type: "correct" },
        "missed known partner": { message: "You knew the partner but picked something else.", type: "wrong" },
        "chose known non-matching card": { message: "You'd seen that card, it didn't match.", type: "wrong" },
        "ignored known pair": { message: "A known pair was available.", type: "wrong" },
        "exploration": { message: "Both cards new.", type: "neutral" },
      };
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackKeyRef.current += 1;
      setTurnFeedback(feedbackMap[reason]);
      feedbackTimerRef.current = setTimeout(() => setTurnFeedback(null), 5000);

      seenCardsRef.current.set(choiceOne.id, choiceOne.src);
      seenCardsRef.current.set(choiceTwo.id, choiceTwo.src);
      setTurnsLog((prev) => [
        ...prev,
        {
          turn: prev.length + 1,
          pairId: `${choiceOne.src.match(/\/([^/]+)\.png/)?.[1]} + ${choiceTwo.src.match(/\/([^/]+)\.png/)?.[1]}`,
          isMatch,
          wasKnowable: countsInAccuracy,
          countsInAccuracy,
          isCorrect,
          reason,
        },
      ]);

      if (isMatch) {
        setCards((prevCards) => {
          return prevCards.map((card) => {
            if (card.src === choiceOne.src) {
              return { ...card, matched: true, matchedBy: currentPlayer };
            }
            return card;
          });
        });
        setMatches((prev) => prev + 1);
        if (playersCount > 1) {
          setPlayerMatches((prev) => {
            const newMatches = [...prev];
            newMatches[currentPlayer]++;
            return newMatches;
          });
        }
        resetTurn();
      } else {
        setTimeout(() => {
          if (playersCount > 1) {
            setCurrentPlayer((prev) => (prev + 1) % playersCount);
          }
          resetTurn();
        }, 1000);
      }
    }
  }, [choiceOne, choiceTwo, resetTurn, currentPlayer, playersCount]);

  // Win check
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.matched)) {
      setTimeout(() => {
        setIsWon(true);
        setIsGameActive(false);
      }, 500);
    }
  }, [cards]);

  // Save score when game is won
  useEffect(() => {
    if (isWon && !scoreSaved && attempts > 0) {
      if (playersCount > 1) {
        // Tournament scoring
        if (isTournament) {
          const maxMatches = Math.max(...playerMatches);
          const winners = playerMatches
            .map((matches, index) => (matches === maxMatches ? index : -1))
            .filter((i) => i !== -1);

          setTournamentScores((prev) => {
            const next = [...prev];
            if (winners.length > 1) {
              // Draw: 1 point each
              winners.forEach((w) => (next[w] += 1));
            } else {
              // Win: 2 points
              next[winners[0]] += 2;
            }
            return next;
          });
          setTournamentHistory((prev) => [...prev, { winners }]);
        }

        setScoreSaved(true);
        setCurrentScore(null);
        return;
      }
      const counted = turnsLog.filter((t) => t.countsInAccuracy);
      const correct = counted.filter((t) => t.isCorrect).length;
      const accuracy = counted.length === 0 ? 100 : Math.round((correct / counted.length) * 100);
      saveGameScore({ turns, time, accuracy })
        .then((score) => {
          setScoreSaved(true);
          setCurrentScore(score);
        })
        .catch(() => {
          // score save failed silently
          setScoreSaved(true);
        });
    }
  }, [isWon, scoreSaved, turns, time, attempts, turnsLog, saveGameScore, playersCount]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isGameActive && !isWon) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive, isWon]);

  // Start on first load
  useEffect(() => {
    shuffleCards();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-4 flex w-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:mb-6 sm:p-4">
        {/* Title and New Game Button */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="bg-linear-to-r from-blue-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/play/local-multiplayer")}
              className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
              title="Leave Game"
            >
              <Undo2 className="h-5 w-5" />
            </button>
            <button
              onClick={shuffleCards}
              className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
              title="New Game"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            {playersCount > 1 && (
              <>
                {isTournament && targetGames === "unlimited" && tournamentHistory.length > 0 && (
                  <button
                    onClick={() => setShowFinalStandings(true)}
                    className="rounded-xl bg-blue-50 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-100 hover:text-blue-700"
                    title="Finish & View Results"
                  >
                    <Trophy className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
                  title="Manage Players"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tournament Info */}
        {isTournament && (
          <div className="flex items-center justify-between px-1 text-sm font-medium text-slate-500">
            <span>
              Game {currentGameIndex}
              {targetGames !== "unlimited" ? ` of ${targetGames}` : ""}
            </span>
          </div>
        )}

        {/* Stats Grid */}
        {playersCount > 1 ? (
          <div
            className={`grid gap-2 sm:gap-4 ${
              playersCount === 2 ? "grid-cols-2" : playersCount === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {playerMatches.map((score, index) => {
              const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
              const isActive = currentPlayer === index;
              return (
                <div
                  key={index}
                  className={`relative rounded-lg p-2 pb-1 text-center transition-all duration-300 sm:p-3 ${
                    isActive ? `${theme.bg} ring-2 ${theme.ring} shadow-md` : `bg-slate-50`
                  }`}
                >
                  {isTournament && (
                    <div
                      className={`absolute -top-1.5 -right-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-bold shadow-sm ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}
                      title="Tournament Points"
                    >
                      {tournamentScores[index]}
                    </div>
                  )}
                  <span
                    className={`block truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs ${theme.text}`}
                  >
                    {players[index]?.name || `Player ${index + 1}`}
                  </span>
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-bold ${theme.text}`}>{score || 0}</span>
                    <span className="text-[9px] leading-none font-medium text-slate-400 uppercase">Pairs</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                Time
              </span>
              <span className="text-lg font-bold text-slate-700">
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                Turns
              </span>
              <span className="text-lg font-bold text-slate-700">{turns}</span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                Matches
              </span>
              <span className="text-lg font-bold text-slate-700">{matches}/8</span>
            </div>

            <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                Accuracy
              </span>
              <span className="text-lg font-bold text-slate-700">
                {(() => {
                  const c = turnsLog.filter((t) => t.countsInAccuracy);
                  const ok = c.filter((t) => t.isCorrect).length;
                  return c.length === 0 ? "-%" : `${Math.round((ok / c.length) * 100)}%`;
                })()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-4 gap-3 p-2 sm:gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={card === choiceOne || card === choiceTwo || card.matched}
            disabled={disabled}
            isMultiplayer={playersCount > 1}
            currentPlayer={currentPlayer}
          />
        ))}
      </div>

      {/* Turn Feedback */}
      <div className="flex h-6 w-full items-center justify-center">
        {turnFeedback && (
          <p
            key={feedbackKeyRef.current}
            className={`animate-fade-in text-sm font-medium ${
              turnFeedback.type === "correct"
                ? "text-green-600"
                : turnFeedback.type === "wrong"
                  ? "text-red-600"
                  : "text-slate-500"
            }`}
          >
            {turnFeedback.message}
          </p>
        )}
      </div>

      {/* Win Modal Overlay */}
      {isWon && scoreSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="animate-bounce-in w-full max-w-sm scale-100 transform rounded-3xl bg-white p-8 text-center shadow-xl transition-all">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
              <Trophy className="h-10 w-10" />
            </div>

            {playersCount > 1 ? (
              <>
                <h2 className="mb-2 text-3xl font-bold text-slate-800">
                  {(() => {
                    const maxScore = Math.max(...playerMatches);
                    const winners = playerMatches
                      .map((score, index) => (score === maxScore ? index : -1))
                      .filter((i) => i !== -1);
                    if (winners.length > 1) return "It's a Tie!";
                    return `${players[winners[0]]?.name || `Player ${winners[0] + 1}`} Wins!`;
                  })()}
                </h2>
                <div className="mb-4 text-sm font-medium text-slate-500">
                  {isTournament ? "Current Game Results" : "Game Over"}
                </div>
                <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
                  {playerMatches.map((score, index) => {
                    const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                    return (
                      <div key={index} className={`rounded-xl border border-slate-100 p-3 text-center ${theme.bg}`}>
                        <div className={`text-[10px] font-bold tracking-wider uppercase ${theme.text}`}>
                          {players[index]?.name || `Player ${index + 1}`}
                        </div>
                        <div className="text-xl font-bold text-slate-800">{score} Pairs</div>
                      </div>
                    );
                  })}
                </div>

                {isTournament && (
                  <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                    <h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                      Tournament Standings
                    </h3>
                    <div className="space-y-2">
                      {tournamentScores.map((score, index) => {
                        const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className={`font-semibold ${theme.text}`}>{players[index]?.name}</span>
                            <span className="font-bold text-slate-700">{score} Points</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-2 text-3xl font-bold text-slate-800">You Won!</h2>
                <p className="mb-4 text-slate-500">
                  Completed in <span className="font-bold text-blue-600">{turns}</span> turns
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
                    <div className="mt-1 font-bold text-slate-700">
                      {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs tracking-wider text-slate-400 uppercase">Accuracy</div>
                    <div className="mt-1 font-bold text-slate-700">
                      {(() => {
                        const c = turnsLog.filter((t) => t.countsInAccuracy);
                        const ok = c.filter((t) => t.isCorrect).length;
                        return c.length === 0 ? "-%" : `${Math.round((ok / c.length) * 100)}%`;
                      })()}
                    </div>
                  </div>
                  {currentScore !== null && (
                    <div className="col-span-2 rounded-lg bg-slate-50 p-3">
                      <div className="text-xs tracking-wider text-slate-400 uppercase">Score</div>
                      <div className="mt-1 text-xl font-bold text-slate-700">{currentScore.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => {
                if (isTournament && targetGames !== "unlimited" && currentGameIndex >= targetGames) {
                  setShowFinalStandings(true);
                } else {
                  if (isTournament) {
                    setCurrentGameIndex((prev) => prev + 1);
                  }
                  shuffleCards();
                }
              }}
              className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
            >
              {isTournament
                ? targetGames !== "unlimited" && currentGameIndex >= targetGames
                  ? "View Final Standings"
                  : "Next Game"
                : "Play Again"}
            </button>
          </div>
        </div>
      )}

      {/* Manage Players Dialog */}
      {isConfigOpen && (
        <MultiplayerConfig
          isDialog
          initialPlayers={players}
          initialIsTournament={isTournament}
          initialGameCount={targetGames}
          minGameCount={currentGameIndex}
          onCancel={() => setIsConfigOpen(false)}
          onStart={(newPlayers, newIsTournament, newGameCount) => {
            // Update players and scores
            setPlayers(newPlayers);
            setPlayersCount(newPlayers.length);
            setIsTournament(newIsTournament);
            setTargetGames(newGameCount);

            setTournamentScores((prev) => {
              const next = Array(newPlayers.length).fill(0);
              prev.forEach((score, i) => {
                if (i < next.length) next[i] = score;
              });
              return next;
            });

            // Update current game matches to avoid NaN and ensure new players are shown
            setPlayerMatches((prev) => {
              const next = Array(newPlayers.length).fill(0);
              prev.forEach((m, i) => {
                if (i < next.length) next[i] = m || 0;
              });
              return next;
            });

            // Clamp current player to the new range
            setCurrentPlayer((prev) => (prev >= newPlayers.length ? 0 : prev));

            setIsConfigOpen(false);
            // Optional: Restart game if players changed significantly?
            // User said "Mann kann auch während des turniers noch einen neuen spielder hinzufügen, löschen oder bearbeiten"
            // If they change configuration, they probably want to continue.
            // But if they added a player mid-game, it might be weird.
            // For now, let's just update the state.
          }}
        />
      )}

      {showFinalStandings && (
        <FinalStandingsOverlay
          history={tournamentHistory}
          players={players}
          onRestart={() => {
            setTournamentScores(Array(players.length).fill(0));
            setTournamentHistory([]);
            setCurrentGameIndex(1);
            shuffleCards();
            setShowFinalStandings(false);
          }}
          onClose={() => {
            setShowFinalStandings(false);
          }}
        />
      )}

      {/* CSS Utility for 3D Flip */}
      <style>{`
        @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.9); }
            50% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-bounce-in {
            animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-4px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease forwards;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        .animate-float {
            animation: float 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Final Standings Overlay with game-by-game animation
 */
const FinalStandingsOverlay = ({
  history,
  players,
  onClose,
  onRestart,
}: {
  history: { winners: number[] }[];
  players: { name: string }[];
  onClose: () => void;
  onRestart: () => void;
}) => {
  const [phase, setPhase] = useState<"recap" | "podium">("recap");
  const [currentGameIndex, setCurrentGameIndex] = useState(-1);
  const [visualScores, setVisualScores] = useState<number[]>(Array(players.length).fill(0));
  const [visualScoresForIcons, setVisualScoresForIcons] = useState<number[]>(Array(players.length).fill(0));

  // Sequence controller
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (phase === "recap") {
      // Start the process
      if (currentGameIndex === -1) {
        timer = setTimeout(() => setCurrentGameIndex(0), 500);
      } 
      // Handle score update for current game
      else if (currentGameIndex < history.length) {
        // First, update the visual scores after a short delay to match animation
        const scoreTimer = setTimeout(() => {
          const winners = history[currentGameIndex].winners;
          
          if (winners.length > 1) {
            // Draw: everyone gets 1 point
            const update = (prev: number[]) => {
              const next = [...prev];
              winners.forEach((w) => (next[w] += 1));
              return next;
            };
            setVisualScores(update);
            setVisualScoresForIcons(update);
          } else if (winners.length === 1) {
            // Solo win: icon scales immediately by 2, number counts up 1 -> 2
            const winnerIdx = winners[0];
            setVisualScoresForIcons((prev) => {
              const next = [...prev];
              next[winnerIdx] += 2;
              return next;
            });
            
            setVisualScores((prev) => {
              const next = [...prev];
              next[winnerIdx] += 1;
              return next;
            });
            
            setTimeout(() => {
              setVisualScores((prev) => {
                const next = [...prev];
                next[winnerIdx] += 1;
                return next;
              });
            }, 200);
          }
          
          // Then, after showing the result for a bit, move to next game or podium
          timer = setTimeout(() => {
            if (currentGameIndex < history.length - 1) {
              setCurrentGameIndex(prev => prev + 1);
            } else {
              // Wait 1 second after the final game before showing podium
              timer = setTimeout(() => setPhase("podium"), 1000);
            }
          }, 600);
        }, 200);

        return () => {
          clearTimeout(scoreTimer);
          clearTimeout(timer);
        };
      }
    }
    
    return () => clearTimeout(timer);
  }, [phase, currentGameIndex, history]);

  const finalScores = Array(players.length).fill(0);
  history.forEach((game) => {
    if (game.winners.length > 1) {
      game.winners.forEach((w) => (finalScores[w] += 1));
    } else if (game.winners.length === 1) {
      finalScores[game.winners[0]] += 2;
    }
  });

  const maxTournamentScore = Math.max(...finalScores, 1);
  const displayScores = phase === "podium" ? finalScores : visualScores;
  const currentWinners = currentGameIndex >= 0 && currentGameIndex < history.length 
    ? history[currentGameIndex].winners 
    : [];

  const sortedUniqueScores = Array.from(new Set(displayScores)).sort((a, b) => b - a);
  const rankGroups = sortedUniqueScores.slice(0, 3).map((score, i) => ({
    rank: i + 1,
    score,
    playerIndices: players.map((_, idx) => idx).filter(idx => displayScores[idx] === score)
  }));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-500">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:max-w-xl">
        <div className="bg-linear-to-b from-white to-slate-50/50 p-8 sm:p-12 relative min-h-[400px] flex flex-col">
          
          {/* Skip button (only in recap) */}
          {phase === "recap" && (
            <button
              onClick={() => setPhase("podium")}
              className="absolute top-8 right-8 rounded-full bg-slate-200/50 p-2 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-90 z-10"
              title="Skip"
            >
              <span className="text-xs font-bold px-2 uppercase">Skip</span>
            </button>
          )}

          {/* Recap Phase */}
          {phase === "recap" && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wider mb-2">
                  Game {Math.max(currentGameIndex + 1, 1)} <span className="text-slate-400 text-lg">/ {history.length}</span>
                </h3>
              </div>

              <div className="flex-1 flex items-end justify-center gap-6 sm:gap-10 h-64">
                {players.map((player, index) => {
                  const score = visualScores[index];
                  const iconScore = visualScoresForIcons[index];
                  const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                  const isWinner = currentWinners.includes(index);
                  const pointsEarned = currentWinners.length > 1 ? "+1" : "+2";
                  
                  // Calculate dynamic scale based on immediate iconScore
                  const iconScale = 1 + (iconScore / maxTournamentScore) * 0.5;

                  return (
                    <div key={index} className="flex flex-col items-center justify-end relative">
                      {/* Icon Container */}
                      <div 
                        className={`relative flex items-center justify-center rounded-full shadow-lg transition-all duration-500 border ${theme.bg} ${theme.text}`}
                        style={{ 
                          borderColor: theme.ring,  
                          width: '4rem', height: '4rem', // base size 64px
                          transform: `scale(${iconScale})`,
                          transformOrigin: 'bottom center',
                          zIndex: isWinner ? 10 : 1
                        }}
                      >
                        <User className="h-1/2 w-1/2" />
                        
                        {/* Floating points animation */}
                        {isWinner && (
                          <div key={currentGameIndex} className="absolute -right-4 -top-4 animate-float-up z-20" style={{ transform: `scale(${1 / iconScale})` }}>
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${theme.bg} ring-2 ${theme.ring} shadow-lg font-black ${theme.text} text-xs`}>
                              {pointsEarned}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <span className="mt-8 font-bold text-slate-700 truncate max-w-[80px] text-center">{player.name}</span>
                      <span className="text-sm font-black text-slate-500">{score} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Podium Phase */}
          {phase === "podium" && (
            <div className="flex-1 flex flex-col animate-bounce-in">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">
                  Final Standings
                </h2>
              </div>

              <div className="flex-1 flex items-end justify-center gap-2 sm:gap-4 mb-2 h-48">
                {/* 2nd Place Group */}
                {rankGroups.length > 1 && (
                  <div className="flex flex-col items-center justify-end animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                    <div className="flex flex-col items-center mb-2">
                      {rankGroups[1].playerIndices.map(idx => (
                        <span key={idx} className="font-bold text-slate-600 truncate max-w-[80px] leading-tight">{players[idx].name}</span>
                      ))}
                    </div>
                    <div className={`w-20 sm:w-24 bg-slate-200 rounded-t-2xl flex flex-col items-center justify-start pt-4 h-32 border-x-2 border-t-2 border-slate-300`}>
                      <span className="text-2xl font-black text-slate-500">2</span>
                      <span className="font-bold text-slate-500 text-sm">{rankGroups[1].score} pts</span>
                    </div>
                  </div>
                )}
                
                {/* 1st Place Group */}
                {rankGroups.length > 0 && (
                  <div className="flex flex-col items-center justify-end z-10 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                    <div className="mb-2 flex flex-col items-center">
                      {rankGroups[0].playerIndices.map(idx => (
                        <span key={idx} className="font-black text-slate-900 truncate max-w-[100px] text-lg leading-tight">{players[idx].name}</span>
                      ))}
                    </div>
                    <div className={`w-24 sm:w-28 bg-yellow-300 rounded-t-2xl flex flex-col items-center justify-start pt-4 h-40 shadow-[0_0_30px_rgba(253,224,71,0.5)] border-x-2 border-t-2 border-yellow-400`}>
                      <span className="text-4xl font-black text-yellow-700">1</span>
                      <span className="font-bold text-yellow-700">{rankGroups[0].score} pts</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place Group */}
                {rankGroups.length > 2 && (
                  <div className="flex flex-col items-center justify-end animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                    <div className="flex flex-col items-center mb-2">
                      {rankGroups[2].playerIndices.map(idx => (
                        <span key={idx} className="font-bold text-slate-600 truncate max-w-[80px] leading-tight">{players[idx].name}</span>
                      ))}
                    </div>
                    <div className={`w-20 sm:w-24 bg-orange-200 rounded-t-2xl flex flex-col items-center justify-start pt-4 h-24 border-x-2 border-t-2 border-orange-300`}>
                      <span className="text-2xl font-black text-orange-700">3</span>
                      <span className="font-bold text-orange-700 text-sm">{rankGroups[2].score} pts</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3 animate-fade-in" style={{ animationDelay: '1000ms', animationFillMode: 'both' }}>
                <button
                  onClick={onRestart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  <RefreshCw className="h-5 w-5" /> Play Again
                </button>
                <button
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white py-4 text-base font-bold text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.5); }
          20% { opacity: 1; transform: translateY(0px) scale(1.2); }
          30% { transform: translateY(0px) scale(1); }
          70% { opacity: 1; transform: translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.8); }
        }
        .animate-float-up {
          animation: floatUp 1.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

