'use client';

import { api } from '@/convex/_generated/api';
import { Button, Card, Chip } from '@heroui/react';
import { useMutation } from 'convex/react';
import { Gamepad, RefreshCw, Trophy } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dialog from './Dialog';

interface CardData {
  id: number;
  src: string;
  matched: boolean;
}

interface TurnLogEntry {
  turn: number;
  pairId: string;
  isMatch: boolean;
  wasKnowable: boolean;
  countsInAccuracy: boolean;
  isCorrect: boolean;
  reason:
    | 'known match'
    | 'lucky match'
    | 'missed known partner'
    | 'chose known non-matching card'
    | 'ignored known pair'
    | 'exploration';
}

interface CardProps {
  card: CardData;
  handleChoice: (card: CardData) => void;
  flipped: boolean;
  disabled: boolean;
}

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
const MemoryCard: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      handleChoice(card);
    }
  };

  return (
    <div className="group relative aspect-square cursor-pointer perspective-[1000px]" onClick={handleClick}>
      <Card
        className={`h-full w-full transform border-2 shadow-sm transition-all duration-500 transform-3d ${
          flipped
            ? card.matched
              ? 'transform-[rotateY(180deg)] border-green-400/90'
              : 'transform-[rotateY(180deg)] border-blue-400/90'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        {/* Front (Image) - Visible when flipped */}
        <div
          className={`absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center overflow-hidden rounded-[10px] bg-white backface-hidden ${
            flipped ? 'opacity-100' : 'opacity-0'
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
          className={`absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 backface-hidden ${
            !flipped ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Gamepad className="h-10 w-10 text-slate-300 opacity-50" />
        </div>
      </Card>
    </div>
  );
};

export default function MemoryGame({ title, description }: { title?: string; description?: string }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState<CardData | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<CardData | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [turnsLog, setTurnsLog] = useState<TurnLogEntry[]>([]);
  const [turnFeedback, setTurnFeedback] = useState<{ message: string; type: 'correct' | 'neutral' | 'wrong' } | null>(
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
        .join(' '),
    );
    if (process.env.NODE_ENV === 'development') console.log('🃏 Solution:\n' + rows.join('\n'));

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const reason: TurnLogEntry['reason'] = isMatch
        ? knewPartnerOfOne
          ? 'known match'
          : 'lucky match'
        : knewPartnerOfOne
          ? 'missed known partner'
          : knewChoiceTwo
            ? 'chose known non-matching card'
            : ignoredKnownPair
              ? 'ignored known pair'
              : 'exploration';

      const feedbackMap: Record<TurnLogEntry['reason'], { message: string; type: 'correct' | 'neutral' | 'wrong' }> = {
        'known match': { message: 'Match, you knew where it was.', type: 'correct' },
        'lucky match': { message: 'Lucky match!', type: 'correct' },
        'missed known partner': { message: 'You knew the partner but picked something else.', type: 'wrong' },
        'chose known non-matching card': { message: "You'd seen that card, it didn't match.", type: 'wrong' },
        'ignored known pair': { message: 'A known pair was available.', type: 'wrong' },
        'exploration': { message: 'Both cards new.', type: 'neutral' },
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
              return { ...card, matched: true };
            }
            return card;
          });
        });
        setMatches((prev) => prev + 1);
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo, resetTurn]);

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
      const counted = turnsLog.filter((t) => t.countsInAccuracy);
      const correct = counted.filter((t) => t.isCorrect).length;
      const accuracy = counted.length === 0 ? 100 : Math.round((correct / counted.length) * 100);
      saveGameScore({ turns, time, accuracy })
        .then(() => {
          setScoreSaved(true);
        })
        .catch(() => {
          // score save failed silently
        });
    }
  }, [isWon, scoreSaved, turns, time, attempts, turnsLog, saveGameScore]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    shuffleCards();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      {/* Header */}
      <Card className="mb-4 w-full border border-slate-100 shadow-sm sm:mb-6">
        {/* Title and New Game Button */}
        <Card.Header className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex-1">
            <Card.Title className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
              {title}
            </Card.Title>
            <Card.Description className="mt-1 text-sm text-slate-500">{description}</Card.Description>
          </div>

          <Button
            isIconOnly
            variant="flat"
            onPress={shuffleCards}
            className="bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            aria-label="New Game"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </Card.Header>

        {/* Stats Grid */}
        <Card.Content className="grid grid-cols-4 gap-2 px-2 pb-2 sm:gap-4 sm:px-4 sm:pb-4">
          <Card className="bg-slate-50 shadow-none">
            <Card.Content className="p-2 pb-1 text-center sm:p-3">
              <Chip
                size="sm"
                variant="flat"
                className="mb-1 bg-transparent px-0 text-[10px] text-slate-400 uppercase sm:text-xs"
              >
                Time
              </Chip>
              <span className="text-lg font-bold text-slate-700">
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
              </span>
            </Card.Content>
          </Card>
          <Card className="bg-slate-50 shadow-none">
            <Card.Content className="p-2 pb-1 text-center sm:p-3">
              <Chip
                size="sm"
                variant="flat"
                className="mb-1 bg-transparent px-0 text-[10px] text-slate-400 uppercase sm:text-xs"
              >
                Turns
              </Chip>
              <span className="text-lg font-bold text-slate-700">{turns}</span>
            </Card.Content>
          </Card>
          <Card className="bg-slate-50 shadow-none">
            <Card.Content className="p-2 pb-1 text-center sm:p-3">
              <Chip
                size="sm"
                variant="flat"
                className="mb-1 bg-transparent px-0 text-[10px] text-slate-400 uppercase sm:text-xs"
              >
                Matches
              </Chip>
              <span className="text-lg font-bold text-slate-700">{matches}/8</span>
            </Card.Content>
          </Card>
          <Card className="bg-slate-50 shadow-none">
            <Card.Content className="p-2 pb-1 text-center sm:p-3">
              <Chip
                size="sm"
                variant="flat"
                className="mb-1 bg-transparent px-0 text-[10px] text-slate-400 uppercase sm:text-xs"
              >
                Accuracy
              </Chip>
              <span className="text-lg font-bold text-slate-700">
                {(() => {
                  const c = turnsLog.filter((t) => t.countsInAccuracy);
                  const ok = c.filter((t) => t.isCorrect).length;
                  return c.length === 0 ? '-%' : `${Math.round((ok / c.length) * 100)}%`;
                })()}
              </span>
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>

      {/* Game Grid */}
      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-4 gap-3 p-2 sm:gap-4">
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={card === choiceOne || card === choiceTwo || card.matched}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Turn Feedback */}
      <div className="flex h-6 w-full items-center justify-center">
        {turnFeedback && (
          <Chip
            key={feedbackKeyRef.current}
            size="sm"
            variant="flat"
            className={`animate-fade-in text-sm font-medium ${
              turnFeedback.type === 'correct'
                ? 'bg-green-100 text-green-600'
                : turnFeedback.type === 'wrong'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {turnFeedback.message}
          </Chip>
        )}
      </div>

      {isWon && (
        <Dialog title="You Won!" onClose={shuffleCards}>
          <div className="animate-bounce-in text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
              <Trophy className="h-10 w-10" />
            </div>
            <p className="mb-4 text-slate-500">
              Completed in <span className="font-bold text-blue-600">{turns}</span> turns
            </p>
            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              <Card className="bg-slate-50 shadow-none">
                <Card.Content className="p-3">
                  <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
                  <div className="mt-1 font-bold text-slate-700">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </div>
                </Card.Content>
              </Card>
              <Card className="bg-slate-50 shadow-none">
                <Card.Content className="p-3">
                  <div className="text-xs tracking-wider text-slate-400 uppercase">Accuracy</div>
                  <div className="mt-1 font-bold text-slate-700">
                    {(() => {
                      const c = turnsLog.filter((t) => t.countsInAccuracy);
                      const ok = c.filter((t) => t.isCorrect).length;
                      return c.length === 0 ? '-%' : `${Math.round((ok / c.length) * 100)}%`;
                    })()}
                  </div>
                </Card.Content>
              </Card>
            </div>
            <Button color="primary" className="w-full font-semibold" onPress={shuffleCards}>
              Play Again
            </Button>
          </div>
        </Dialog>
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
