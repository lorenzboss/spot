"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MultiplayerConfig from "./MultiplayerConfig";

// Sub-components
import { Card } from "./memory-game/Card";
import { FinalStandingsOverlay } from "./memory-game/FinalStandingsOverlay";
import { GameHeader } from "./memory-game/GameHeader";
import { MemoryGameStyles } from "./memory-game/MemoryGameStyles";
import { StatsGrid } from "./memory-game/StatsGrid";
import { TurnFeedback } from "./memory-game/TurnFeedback";
import { WinModal } from "./memory-game/WinModal";

// Types & Utils
import { CardData, feedbackMap, TurnLogEntry } from "./memory-game/types";
import { shuffleArray } from "./memory-game/utils";

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

  // Game State
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

  // Refs
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackKeyRef = useRef(0);
  const seenCardsRef = useRef<Map<number, string>>(new Map());
  const knownPairsAvailableRef = useRef(false);

  // Timer & Scoring
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Multiplayer State
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
  }, [players, isTournament, targetGames, tournamentScores, tournamentHistory, currentGameIndex, router, playersCount]);

  // Convex hooks
  const saveGameScore = useMutation(api.scoreFunctions.saveGameScore);

  // Initialize game
  const shuffleCards = useCallback(() => {
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

    // Log solution as 4x4 grid in development
    if (process.env.NODE_ENV === "development") {
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
      console.log("🃏 Solution:\n" + rows.join("\n"));
    }

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
  }, [playersCount]);

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

      const knewPartnerOfOne = [...seen.entries()].some(([id, src]) => src === choiceOne.src && id !== choiceOne.id);
      const knewChoiceTwo = seen.has(choiceTwo.id);
      const ignoredKnownPair = knownPairsAvailableRef.current;

      const countsInAccuracy = isMatch || knewPartnerOfOne || knewChoiceTwo || ignoredKnownPair;
      const isCorrect = isMatch;

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
              winners.forEach((w) => (next[w] += 1)); // Draw: 1 point each
            } else {
              next[winners[0]] += 2; // Win: 2 points
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
          setScoreSaved(true);
        });
    }
  }, [isWon, scoreSaved, turns, time, attempts, turnsLog, saveGameScore, playersCount, isTournament, playerMatches]);

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
  }, [shuffleCards]);

  const handleWinModalAction = () => {
    if (isTournament && targetGames !== "unlimited" && currentGameIndex >= targetGames) {
      setShowFinalStandings(true);
    } else {
      if (isTournament) {
        setCurrentGameIndex((prev) => prev + 1);
      }
      shuffleCards();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      <GameHeader
        title={title}
        description={description}
        playersCount={playersCount}
        isTournament={isTournament}
        currentGameIndex={currentGameIndex}
        targetGames={targetGames}
        tournamentHistoryLength={tournamentHistory.length}
        onShuffle={shuffleCards}
        onShowFinalStandings={() => setShowFinalStandings(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      <StatsGrid
        playersCount={playersCount}
        playerMatches={playerMatches}
        currentPlayer={currentPlayer}
        players={players}
        isTournament={isTournament}
        tournamentScores={tournamentScores}
        time={time}
        turns={turns}
        matches={matches}
        turnsLog={turnsLog}
      />

      {/* Game Grid */}
      <div className="mx-auto mt-6 grid aspect-square w-full max-w-md grid-cols-4 gap-3 p-2 sm:gap-4">
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

      <TurnFeedback feedback={turnFeedback} feedbackKey={feedbackKeyRef.current} />

      {isWon && scoreSaved && (
        <WinModal
          playersCount={playersCount}
          playerMatches={playerMatches}
          players={players}
          isTournament={isTournament}
          tournamentScores={tournamentScores}
          turns={turns}
          time={time}
          turnsLog={turnsLog}
          currentScore={currentScore}
          currentGameIndex={currentGameIndex}
          targetGames={targetGames}
          onAction={handleWinModalAction}
        />
      )}

      {isConfigOpen && (
        <MultiplayerConfig
          isDialog
          initialPlayers={players}
          initialIsTournament={isTournament}
          initialGameCount={targetGames}
          minGameCount={currentGameIndex}
          onCancel={() => setIsConfigOpen(false)}
          onStart={(newPlayers, newIsTournament, newGameCount) => {
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

            setPlayerMatches((prev) => {
              const next = Array(newPlayers.length).fill(0);
              prev.forEach((m, i) => {
                if (i < next.length) next[i] = m || 0;
              });
              return next;
            });

            setCurrentPlayer((prev) => (prev >= newPlayers.length ? 0 : prev));
            setIsConfigOpen(false);
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
          onClose={() => setShowFinalStandings(false)}
        />
      )}

      <MemoryGameStyles />
    </div>
  );
}
