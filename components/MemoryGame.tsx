"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Gamepad, RefreshCw, Trophy } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
    <div className="group relative aspect-square cursor-pointer perspective-[1000px]" onClick={handleClick}>
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
  playersCount = 1,
}: {
  title?: string;
  description?: string;
  playersCount?: number;
}) {
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
    setCurrentPlayer(0);
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
        // Skip saving to Convex for multiplayer
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

          <button
            onClick={shuffleCards}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
            title="New Game"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

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
                  className={`rounded-lg p-2 pb-1 text-center transition-all duration-300 sm:p-3 ${
                    isActive ? `${theme.bg} ring-2 ${theme.ring} shadow-md` : `bg-slate-50`
                  }`}
                >
                  <span className={`block text-[10px] font-semibold tracking-wider uppercase sm:text-xs ${theme.text}`}>
                    Player {index + 1}
                  </span>
                  <span className={`text-lg font-bold ${theme.text}`}>{score}</span>
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
                    return `Player ${winners[0] + 1} Wins!`;
                  })()}
                </h2>
                <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
                  {playerMatches.map((score, index) => {
                    const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                    return (
                      <div key={index} className={`rounded-xl border border-slate-100 p-3 text-center ${theme.bg}`}>
                        <div className={`text-[10px] font-bold tracking-wider uppercase ${theme.text}`}>
                          Player {index + 1}
                        </div>
                        <div className="text-xl font-bold text-slate-800">{score} Pairs</div>
                      </div>
                    );
                  })}
                </div>
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
              onClick={shuffleCards}
              className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
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
      `}</style>
    </div>
  );
}
