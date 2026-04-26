"use client";

import React from "react";
import { Gamepad } from "lucide-react";
import { CardData, PLAYER_CONFIGS } from "./types";

interface CardProps {
  card: CardData;
  handleChoice: (card: CardData) => void;
  flipped: boolean;
  disabled: boolean;
  isMultiplayer: boolean;
  currentPlayer: number;
}

export const Card: React.FC<CardProps> = ({ card, handleChoice, flipped, disabled, isMultiplayer, currentPlayer }) => {
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
