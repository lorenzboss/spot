'use client';

import { Gamepad, RefreshCw, Trophy } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface CardData {
  id: number;
  src: string;
  matched: boolean;
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
const Card: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      handleChoice(card);
    }
  };

  return (
    <div className="group relative aspect-square cursor-pointer perspective-[1000px]" onClick={handleClick}>
      <div
        className={`h-full w-full transform rounded-xl border-2 shadow-sm transition-all duration-500 transform-3d ${
          flipped
            ? card.matched
              ? 'transform-[rotateY(180deg)] border-green-400/90 dark:border-green-600/90'
              : 'transform-[rotateY(180deg)] border-indigo-400/90'
            : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500'
        }`}
      >
        {/* Front (Image) - Visible when flipped */}
        <div
          className={`absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center overflow-hidden rounded-[10px] bg-white backface-hidden dark:bg-slate-800 ${
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
          className={`absolute inset-0 flex items-center justify-center rounded-[10px] bg-slate-100 transition-colors duration-300 backface-hidden dark:bg-slate-800 ${
            !flipped ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Gamepad className="h-10 w-10 text-slate-300 opacity-50 dark:text-slate-500" />
        </div>
      </div>
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
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

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

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    setIsWon(false);
    setDisabled(false);
    setMatches(0);
    setAttempts(0);
    setTime(0);
    setIsGameActive(false);
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
      setChoiceOne(card);
    }
  };

  // Comparison logic
  useEffect(() => {
    if (choiceOne && choiceTwo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisabled(true);
      setAttempts((prev) => prev + 1);

      if (choiceOne.src === choiceTwo.src) {
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
      <div className="mb-4 flex w-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:mb-6 sm:p-4 dark:border-slate-700 dark:bg-slate-800">
        {/* Title and New Game Button */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-violet-400">
              {title}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>

          <button
            onClick={shuffleCards}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-indigo-400"
            title="New Game"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3 dark:bg-slate-700/50">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs dark:text-slate-500">
              Time
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3 dark:bg-slate-700/50">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs dark:text-slate-500">
              Turns
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{turns}</span>
          </div>

          <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3 dark:bg-slate-700/50">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs dark:text-slate-500">
              Matches
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{matches}/8</span>
          </div>

          <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3 dark:bg-slate-700/50">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs dark:text-slate-500">
              Accuracy
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {attempts === 0 ? '-%' : `${Math.round((matches / attempts) * 100)}%`}
            </span>
          </div>
        </div>
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
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-sm opacity-60 sm:mt-6 dark:text-slate-400">
        <p>
          Made by <a href="https://lorenzboss.com">Lorenz Boss</a> | &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Win Modal Overlay */}
      {isWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="animate-bounce-in w-full max-w-sm scale-100 transform rounded-3xl bg-white p-8 text-center shadow-xl transition-all dark:bg-slate-800">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500 dark:bg-yellow-900/30">
              <Trophy className="h-10 w-10" />
            </div>

            <h2 className="mb-2 text-3xl font-bold text-slate-800 dark:text-white">You Won!</h2>
            <p className="mb-4 text-slate-500 dark:text-slate-300">
              Completed in <span className="font-bold text-indigo-600 dark:text-indigo-400">{turns}</span> turns
            </p>

            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
                <div className="mt-1 font-bold text-slate-700 dark:text-slate-200">
                  {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Accuracy</div>
                <div className="mt-1 font-bold text-slate-700 dark:text-slate-200">
                  {Math.round((matches / attempts) * 100)}%
                </div>
              </div>
            </div>

            <button
              onClick={shuffleCards}
              className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-600"
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
      `}</style>
    </div>
  );
}
