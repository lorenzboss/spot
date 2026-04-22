'use client';

import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ArrowRight, Brain, RefreshCw, Shuffle, Trophy, Undo2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardData {
  id: number;
  src: string;
  matched: boolean;
}

type RevealMode = 'sequential' | 'random';

type GamePhase =
  | 'select'    // choosing sub-mode
  | 'ready'     // cards generated, waiting for user to press Start
  | 'revealing' // one card at a time being shown
  | 'playing'   // player picks pairs
  | 'lost'
  | 'won';

interface CardProps {
  card: CardData;
  handleChoice: (card: CardData) => void;
  flipped: boolean;
  disabled: boolean;
  isWrong?: boolean;
  isActiveReveal?: boolean; // the single card currently shown in reveal phase
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const shuffleArray = <T,>(array: T[]): T[] => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// ─── Card ────────────────────────────────────────────────────────────────────

const Card: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled, isWrong, isActiveReveal }) => (
  <div
    className={`group relative aspect-square cursor-pointer perspective-[1000px] ${isWrong ? 'animate-shake' : ''}`}
    onClick={() => !disabled && handleChoice(card)}
  >
    <div
      className={`h-full w-full transform rounded-xl border-2 shadow-sm transition-all duration-[350ms] transform-3d ${
        flipped
          ? card.matched
            ? 'transform-[rotateY(180deg)] border-green-400/90 shadow-green-100'
            : isWrong
              ? 'transform-[rotateY(180deg)] border-red-500 shadow-red-200'
              : isActiveReveal
                ? 'transform-[rotateY(180deg)] border-violet-400 shadow-violet-100'
                : 'transform-[rotateY(180deg)] border-blue-400/90'
          : 'border-slate-200 hover:border-purple-300'
      }`}
    >
      {/* Front */}
      <div
        className={`absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center overflow-hidden rounded-[10px] bg-white backface-hidden ${flipped ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.src}
          alt="Pokémon"
          className="h-full w-full scale-110 object-contain [image-rendering:pixelated]"
        />
      </div>

      {/* Back */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-[10px] bg-slate-100 transition-colors duration-300 backface-hidden ${!flipped ? 'opacity-100' : 'opacity-0'}`}
      >
        <Brain className="h-8 w-8 text-slate-300 opacity-50" />
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TOTAL_PAIRS = 8;
const CARD_SHOW_MS = 2000;  // how long one card stays visible
const CARD_GAP_MS = 0;   // dark gap between cards

export default function SpeedMemoryGame({ title, description }: { title?: string; description?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<CardData[]>([]);
  const [phase, setPhase] = useState<GamePhase>('select');
  const [revealMode, setRevealMode] = useState<RevealMode | null>(null);

  // Index into `revealOrder` currently being shown (-1 = none)
  const [activeRevealCardId, setActiveRevealCardId] = useState<number>(-1);
  // The reveal sequence (array of card.id values in the order to show them)
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  // Progress label during reveal e.g. "5 / 16"
  const [revealProgress, setRevealProgress] = useState<[number, number]>([0, 0]);

  const [choiceOne, setChoiceOne] = useState<CardData | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<CardData | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [wrongCards, setWrongCards] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  const revealGeneration = useRef(0); // incremented on every restart to cancel stale reveal loops
  const saveGameScore = useMutation(api.scoreFunctions.saveGameScore);

  // ── Build cards (called when a mode is selected) ─────────────────────────
  const buildCards = useCallback((): CardData[] => {
    const ids = new Set<number>();
    while (ids.size < TOTAL_PAIRS) ids.add(Math.floor(Math.random() * 150) + 1);
    const imgs = Array.from(ids).map((id) => ({
      src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      matched: false,
    }));
    const shuffled = shuffleArray([...imgs, ...imgs]).map((c) => ({ ...c, id: Math.random() }));

    // Log solution as 4×4 grid (dev only)
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
        .join(' '),
    );
    if (process.env.NODE_ENV === 'development') console.log('🃏 Solution:\n' + rows.join('\n'));

    return shuffled;
  }, []);

  // ── Start game with chosen mode ──────────────────────────────────────────
  const startGame = useCallback(
    (mode: RevealMode) => {
      revealGeneration.current += 1; // cancel any running reveal loop
      const newCards = buildCards();
      const order = mode === 'sequential'
        ? newCards.map((c) => c.id)
        : shuffleArray(newCards.map((c) => c.id));

      // Reflect mode in URL
      router.replace(`?mode=${mode}`, { scroll: false });

      setRevealMode(mode);
      setCards(newCards);
      setRevealOrder(order);
      setPhase('ready'); // wait for user to press Start before revealing
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
    },
    [buildCards, router],
  );

  // ── Reset to mode-select screen ──────────────────────────────────────────
  const resetToSelect = useCallback(() => {
    revealGeneration.current += 1; // cancel any running reveal loop
    router.replace('?', { scroll: false }); // clear mode from URL
    setPhase('select');
    setRevealMode(null);
    setCards([]);
    setRevealOrder([]);
    setActiveRevealCardId(-1);
    setChoiceOne(null);
    setChoiceTwo(null);
    setDisabled(true);
    setMatches(0);
    setTime(0);
    setWrongCards([]);
    setShowAll(false);
    setScoreSaved(false);
    setIsGameActive(false);
  }, [router]);

  // ── Begin reveal (called when user presses Start) ─────────────────────
  const beginReveal = useCallback(() => {
    setPhase('revealing');
  }, []);

  // ── Auto-start from URL on first load ───────────────────────────────────
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'sequential' || modeParam === 'random') {
      startGame(modeParam);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reveal sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'revealing' || revealOrder.length === 0) return;
    const myGeneration = revealGeneration.current;

    const run = async () => {
      for (let i = 0; i < revealOrder.length; i++) {
        if (revealGeneration.current !== myGeneration) return; // stale – abort
        setRevealProgress([i + 1, revealOrder.length]);
        setActiveRevealCardId(revealOrder[i]);
        await delay(CARD_SHOW_MS);
        if (revealGeneration.current !== myGeneration) return; // stale – abort
        setActiveRevealCardId(-1);
        if (i < revealOrder.length - 1) await delay(CARD_GAP_MS);
      }
      if (revealGeneration.current !== myGeneration) return; // stale – abort
      // Done – start playing
      setPhase('playing');
      setDisabled(false);
      setIsGameActive(true);
    };

    run();
  }, [phase, revealOrder]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isGameActive || phase !== 'playing') return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isGameActive, phase]);

  // ── Player choice ────────────────────────────────────────────────────────
  const handleChoice = (card: CardData) => {
    if (disabled || card.matched || phase !== 'playing') return;
    if (choiceOne && card.id === choiceOne.id) return;
    if (!choiceOne) setChoiceOne(card);
    else setChoiceTwo(card);
  };

  // ── Evaluate pair ────────────────────────────────────────────────────────
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
      // 1) Shake the wrong cards
      setWrongCards([choiceOne.id, choiceTwo.id]);
      setIsGameActive(false);
      // 2) After shake (~600ms), reveal all remaining unmatched cards
      setTimeout(() => {
        setShowAll(true);
      }, 600);
      // 3) After showing them for a moment, show the Game Over modal
      setTimeout(() => {
        setPhase('lost');
      }, 600 + 1400);
    }
  }, [choiceOne, choiceTwo, resetTurn]);

  // ── Win ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'playing' && cards.length > 0 && cards.every((c) => c.matched)) {
      setTimeout(() => {
        setPhase('won');
        setIsGameActive(false);
      }, 400);
    }
  }, [cards, phase]);

  // ── Save score ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'won' || scoreSaved) return;
    saveGameScore({ turns: TOTAL_PAIRS, time, accuracy: 100 })
      .then(() => setScoreSaved(true))
      .catch(() => {});
  }, [phase, scoreSaved, time, saveGameScore]);

  // ── Derived flipped state ────────────────────────────────────────────────
  const isFlipped = (card: CardData): boolean => {
    if (phase === 'revealing') return card.id === activeRevealCardId;
    // When showAll is active (after wrong pick), reveal every unmatched card
    if (showAll) return true;
    if (phase === 'playing' || phase === 'lost' || phase === 'won')
      return card.matched || card === choiceOne || card === choiceTwo;
    return false;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // ── Mode-select screen ───────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-6">
        <div className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-1 bg-linear-to-r from-purple-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
            {title}
          </h1>
          <p className="mb-6 text-sm text-slate-500">{description}</p>

          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Choose reveal mode</p>

          <div className="flex flex-col gap-3">
            {/* Sequential */}
            <button
              onClick={() => startGame('sequential')}
              className="group flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-violet-400 hover:bg-violet-50 hover:shadow-sm active:scale-[.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">Sequential</div>
                <div className="text-xs text-slate-500">Cards revealed left → right, one at a time</div>
              </div>
              <span className="text-slate-300 transition-transform group-hover:translate-x-1">→</span>
            </button>

            {/* Random */}
            <button
              onClick={() => startGame('random')}
              className="group flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm active:scale-[.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
                <Shuffle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">Random</div>
                <div className="text-xs text-slate-500">Cards revealed in random order, one at a time</div>
              </div>
              <span className="text-slate-300 transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Rules: </span>
            Watch every card carefully. After all cards have been shown, find all pairs from memory.
            One wrong click and you lose immediately!
          </div>
        </div>
      </div>
    );
  }

  // ── Game UI ──────────────────────────────────────────────────────────────
  const modeLabel = revealMode === 'sequential' ? 'Sequential' : 'Random';

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-4 flex w-full flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:mb-5 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="bg-linear-to-r from-purple-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
              {title}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              {revealMode === 'sequential' ? (
                <ArrowRight className="h-3.5 w-3.5 text-violet-500" />
              ) : (
                <Shuffle className="h-3.5 w-3.5 text-violet-500" />
              )}
              <span className="text-xs font-medium text-slate-400">{modeLabel} mode</span>
            </div>
          </div>
          {/* Change mode + Restart buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetToSelect}
              className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
              title="Change mode"
            >
              <Undo2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => revealMode && startGame(revealMode)}
              className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
              title="Restart (same mode)"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg bg-slate-50 p-2 text-center">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Time</span>
            <span className="text-lg font-bold text-slate-700">{fmt(time)}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Matches</span>
            <span className="text-lg font-bold text-slate-700">{matches}/{TOTAL_PAIRS}</span>
          </div>
          <div
            className={`rounded-lg p-2 text-center transition-colors ${
              phase === 'revealing' ? 'bg-violet-50' : 'bg-slate-50'
            }`}
          >
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {phase === 'revealing' ? 'Shown' : 'Matched'}
            </span>
            <span
              className={`text-lg font-bold ${
                phase === 'revealing'
                  ? 'text-violet-600'
                  : phase === 'lost'
                    ? 'text-red-500'
                    : 'text-slate-700'
              }`}
            >
              {phase === 'revealing'
                ? `${revealProgress[0]}/${revealProgress[1]}`
                : `${matches}/${TOTAL_PAIRS}`}
            </span>
          </div>
        </div>

        {/* Progress bar — always rendered to avoid layout shift */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              phase === 'lost'
                ? 'bg-linear-to-r from-red-400 to-rose-400'
                : 'bg-linear-to-r from-violet-500 to-purple-500'
            }`}
            style={{
              width:
                phase === 'revealing'
                  ? `${revealProgress[1] > 0 ? (revealProgress[0] / revealProgress[1]) * 100 : 0}%`
                  : `${(matches / TOTAL_PAIRS) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Game Grid */}
      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-4 gap-3 p-2 sm:gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={isFlipped(card)}
            disabled={disabled || phase !== 'playing'}
            isWrong={wrongCards.includes(card.id)}
            isActiveReveal={phase === 'revealing' && card.id === activeRevealCardId}
          />
        ))}
      </div>

      {/* Start button — always rendered to reserve space, invisible when not needed */}
      <button
        onClick={phase === 'ready' ? beginReveal : undefined}
        className={`mt-2 w-full max-w-md rounded-xl py-4 font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 ${
          phase !== 'ready' ? 'invisible' : ''
        } bg-violet-600 shadow-lg shadow-violet-100`}
      >
        Start
      </button>

      {/* Won Modal */}
      {phase === 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="animate-bounce-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
              <Trophy className="h-10 w-10" />
            </div>
            <h2 className="mb-1 text-3xl font-bold text-slate-800">Perfect!</h2>
            <p className="mb-4 text-slate-500">Flawless memory — no mistakes!</p>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
                <div className="mt-1 text-xl font-bold text-slate-700">{fmt(time)}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Mode</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-green-600">
                  {revealMode === 'sequential' ? <ArrowRight className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
                  {modeLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => revealMode && startGame(revealMode)}
                className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-95"
              >
                Play Again (same mode)
              </button>
              <button
                onClick={resetToSelect}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
              >
                Change mode
              </button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.9); }
          50%  { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes shake {
          0%,  100% { transform: translateX(0); }
          12%        { transform: translateX(-7px) rotate(-2deg); }
          24%        { transform: translateX(7px)  rotate(2deg); }
          36%        { transform: translateX(-6px) rotate(-1.5deg); }
          48%        { transform: translateX(6px)  rotate(1.5deg); }
          60%        { transform: translateX(-4px) rotate(-1deg); }
          72%        { transform: translateX(4px)  rotate(1deg); }
          84%        { transform: translateX(-2px); }
        }
        .animate-shake {
          animation: shake 0.55s ease-in-out;
        }
      `}</style>
    </div>
  );
}
