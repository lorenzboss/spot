"use client";

import React from "react";

interface TurnFeedbackProps {
  feedback: { message: string; type: "correct" | "neutral" | "wrong" } | null;
  feedbackKey: number;
}

export const TurnFeedback: React.FC<TurnFeedbackProps> = ({ feedback, feedbackKey }) => {
  return (
    <div className="flex h-6 w-full items-center justify-center">
      {feedback && (
        <p
          key={feedbackKey}
          className={`animate-fade-in text-sm font-medium ${
            feedback.type === "correct"
              ? "text-green-600"
              : feedback.type === "wrong"
                ? "text-red-600"
                : "text-slate-500"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
};
