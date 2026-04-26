"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Sub-components
import { Card } from "./speed-memory-game/Card";
import { GameHeader } from "./speed-memory-game/GameHeader";
import { ModeSelect } from "./speed-memory-game/ModeSelect";
import { SpeedMemoryGameStyles } from "./speed-memory-game/SpeedMemoryGameStyles";
import { StatsGrid } from "./speed-memory-game/StatsGrid";
import { WinModal } from "./speed-memory-game/WinModal";

// Types & Utils
import {
  CARD_GAP_MS,
  CardData,
  DIFFICULTY_SHOW_MS,
  Difficulty,
  GamePhase,
  RevealMode,
  TOTAL_PAIRS,
} from "./speed-memory-game/types";

const shuffleArray = <T,>(array: T[]): T[] => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export default function SpeedMemoryGame({
  title,
  description,
  initialMode,
  initialDifficulty,
}: {
  title?: string;
  description?: string;
  initialMode?: RevealMode;
  initialDifficulty?: Difficulty;
}) {
  const router = useRouter();

  // Game State
  const [cards, setCards] = useState<CardData[]>([]);
  const [phase, setPhase] = useState<GamePhase>(initialMode ? "ready" : "select");
  const [revealMode, setRevealMode] = useState<RevealMode | null>(initialMode ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty ?? "easy");

  // Reveal State
  const [activeRevealCardId, setActiveRevealCardId] = useState<number>(-1);
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [revealProgress, setRevealProgress] = useState<[number, number]>([0, 0]);

  // Play State
  const [choiceOne, setChoiceOne] = useState<CardData | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<CardData | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [wrongCards, setWrongCards] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  const revealGeneration = useRef(0);
  const saveGameScore = useMutation(api.scoreFunctions.saveGameScore);

  // Build cards
  const buildCards = useCallback((): CardData[] => {
    const ids = new Set<number>();
    while (ids.size < TOTAL_PAIRS) ids.add(Math.floor(Math.random() * 150) + 1);
    const imgs = Array.from(ids).map((id) => ({
      src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      matched: false,
    }));
    const shuffled = shuffleArray([...imgs, ...imgs]).map((c) => ({ ...c, id: Math.random() }));

    if (process.env.NODE_ENV === "development") {
      const pairIndex: Record<string, number> = {};
      let pairCounter = 1;
      const labels = shuffled.map((card) => {
        if (!(card.src in pairIndex)) pairIndex[card.src] = pairCounter++;
        return pairIndex[card.src];
      });
      const rows = [0, 1, 2, 3].map((row) =>
        labels
          .slice(row * 4, row * 4 + 4)
          .map((n) => String(n).padStart(2))
          .join(" "),
      );
      console.log("🃏 Solution:\n" + rows.join("\n"));
    }

    return shuffled;
  }, []);

  // Start game
  const startGame = useCallback(
    (mode: RevealMode, diff: Difficulty) => {
      if (!initialMode) {
        router.push(`/play/speed/game?mode=${mode}&difficulty=${diff}`);
        return;
      }

      revealGeneration.current += 1;
      const newCards = buildCards();
      const order = mode === "sequential" ? newCards.map((c) => c.id) : shuffleArray(newCards.map((c) => c.id));

      router.replace(`?mode=${mode}&difficulty=${diff}`, { scroll: false });

      setRevealMode(mode);
      setDifficulty(diff);
      setCards(newCards);
      setRevealOrder(order);
      setPhase("ready");
      setActiveRevealCardId(-1);
      setRevealProgress([0, newCards.length]);
      setChoiceOne(null);
      setChoiceTwo(null);
      setDisabled(true);
      setMatches(0);
      setTime(0);
      setWrongCards([]);
      setShowAll(false);
      setScoreSaved(false);
      setIsGameActive(false);
      setCurrentScore(null);
    },
    [buildCards, router, initialMode],
  );

  // Reset to select
  const resetToSelect = useCallback(() => {
    revealGeneration.current += 1;
    router.back();
  }, [router]);

  // Begin reveal
  const beginReveal = useCallback(() => {
    setPhase("revealing");
  }, []);

  // Auto-start
  useEffect(() => {
    if (initialMode) {
      startGame(initialMode, initialDifficulty ?? "easy");
    }
  }, [initialMode, initialDifficulty, startGame]);

  // Reveal sequence loop
  useEffect(() => {
    if (phase !== "revealing" || revealOrder.length === 0) return;
    const myGeneration = revealGeneration.current;

    const run = async () => {
      for (let i = 0; i < revealOrder.length; i++) {
        if (revealGeneration.current !== myGeneration) return;
        setRevealProgress([i + 1, revealOrder.length]);
        setActiveRevealCardId(revealOrder[i]);
        await delay(DIFFICULTY_SHOW_MS[difficulty]);
        if (revealGeneration.current !== myGeneration) return;
        setActiveRevealCardId(-1);
        if (i < revealOrder.length - 1) await delay(CARD_GAP_MS);
      }
      if (revealGeneration.current !== myGeneration) return;
      setPhase("playing");
      setDisabled(false);
      setIsGameActive(true);
    };

    run();
  }, [phase, revealOrder, difficulty]);

  // Timer
  useEffect(() => {
    if (!isGameActive || phase !== "playing") return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isGameActive, phase]);

  // Player choice
  const handleChoice = (card: CardData) => {
    if (disabled || card.matched || phase !== "playing") return;
    if (choiceOne && card.id === choiceOne.id) return;
    if (!choiceOne) setChoiceOne(card);
    else setChoiceTwo(card);
  };

  // Evaluate pair
  const resetTurn = useCallback(() => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setDisabled(false);
  }, []);

  useEffect(() => {
    if (!choiceOne || !choiceTwo) return;
    setDisabled(true);

    if (choiceOne.src === choiceTwo.src) {
      setCards((prev) => prev.map((c) => (c.src === choiceOne.src ? { ...c, matched: true } : c)));
      setMatches((m) => m + 1);
      resetTurn();
    } else {
      setWrongCards([choiceOne.id, choiceTwo.id]);
      setIsGameActive(false);
      setTimeout(() => setShowAll(true), 600);
      setTimeout(() => setPhase("lost"), 2000);
    }
  }, [choiceOne, choiceTwo, resetTurn]);

  // Win check
  useEffect(() => {
    if (phase === "playing" && cards.length > 0 && cards.every((c) => c.matched)) {
      setTimeout(() => {
        setPhase("won");
        setIsGameActive(false);
      }, 400);
    }
  }, [cards, phase]);

  // Save score
  useEffect(() => {
    if (phase !== "won" || scoreSaved) return;
    saveGameScore({
      time,
      gameMode: "speed",
      difficulty,
      revealMode: revealMode ?? "sequential",
    })
      .then((score) => {
        setScoreSaved(true);
        setCurrentScore(score);
      })
      .catch(() => {
        setScoreSaved(true);
      });
  }, [phase, scoreSaved, time, difficulty, revealMode, saveGameScore]);

  // Derived flipped state
  const isFlipped = (card: CardData): boolean => {
    if (phase === "revealing") return card.id === activeRevealCardId;
    if (showAll) return true;
    if (phase === "playing" || phase === "lost" || phase === "won")
      return card.matched || card === choiceOne || card === choiceTwo;
    return false;
  };

  if (phase === "select") {
    return (
      <ModeSelect
        title={title}
        description={description}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onStart={startGame}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      <GameHeader
        title={title}
        revealMode={revealMode}
        difficulty={difficulty}
        onResetToSelect={resetToSelect}
        onStartGame={startGame}
      />

      <StatsGrid time={time} matches={matches} phase={phase} revealProgress={revealProgress} />

      {/* Game Grid */}
      <div className="mx-auto mt-6 grid aspect-square w-full max-w-md grid-cols-4 gap-3 p-2 sm:gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={isFlipped(card)}
            disabled={disabled || phase !== "playing"}
            isWrong={wrongCards.includes(card.id)}
            isActiveReveal={phase === "revealing" && card.id === activeRevealCardId}
          />
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={phase === "ready" ? beginReveal : undefined}
        className={`mt-4 w-full max-w-md rounded-xl py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 ${
          phase !== "ready" ? "invisible" : ""
        } bg-violet-600 shadow-lg shadow-violet-100`}
      >
        Start
      </button>

      {phase === "won" && scoreSaved && (
        <WinModal
          time={time}
          revealMode={revealMode}
          difficulty={difficulty}
          currentScore={currentScore}
          onRestart={startGame}
          onResetToSelect={resetToSelect}
        />
      )}

      <SpeedMemoryGameStyles />
    </div>
  );
}
