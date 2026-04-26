"use client";

import React from "react";

export const SpeedMemoryGameStyles: React.FC = () => {
  return (
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
  );
};
