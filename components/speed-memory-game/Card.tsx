"use client";

import React from "react";
import { Brain } from "lucide-react";
import { CardData } from "./types";

interface CardProps {
  card: CardData;
  handleChoice: (card: CardData) => void;
  flipped: boolean;
  disabled: boolean;
  isWrong?: boolean;
  isActiveReveal?: boolean; // the single card currently shown in reveal phase
}

export const Card: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled, isWrong, isActiveReveal }) => (
  <div
    className={`group relative aspect-square cursor-pointer perspective-[1000px] ${isWrong ? "animate-shake" : ""}`}
    onClick={() => !disabled && handleChoice(card)}
  >
    <div
      className={`h-full w-full transform rounded-xl border-2 shadow-sm transition-all duration-[350ms] transform-3d ${
        flipped
          ? card.matched
            ? "transform-[rotateY(180deg)] border-green-400/90 shadow-green-100"
            : isWrong
              ? "transform-[rotateY(180deg)] border-red-500 shadow-red-200"
              : isActiveReveal
                ? "transform-[rotateY(180deg)] border-violet-400 shadow-violet-100"
                : "transform-[rotateY(180deg)] border-blue-400/90"
          : "border-slate-200 hover:border-purple-300"
      }`}
    >
      {/* Front */}
      <div
        className={`absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center overflow-hidden rounded-[10px] bg-white backface-hidden ${
          flipped ? "opacity-100" : "opacity-0"
        }`}
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
        className={`absolute inset-0 flex items-center justify-center rounded-[10px] bg-slate-100 transition-colors duration-300 backface-hidden ${
          !flipped ? "opacity-100" : "opacity-0"
        }`}
      >
        <Brain className="h-8 w-8 text-slate-300 opacity-50" />
      </div>
    </div>
  </div>
);
