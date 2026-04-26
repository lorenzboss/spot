export interface CardData {
  id: number;
  src: string;
  matched: boolean;
  matchedBy?: number;
}

export interface TurnLogEntry {
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

export const PLAYER_CONFIGS = [
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

export const feedbackMap: Record<TurnLogEntry["reason"], { message: string; type: "correct" | "neutral" | "wrong" }> = {
  "known match": { message: "Match, you knew where it was.", type: "correct" },
  "lucky match": { message: "Lucky match!", type: "correct" },
  "missed known partner": { message: "You knew the partner but picked something else.", type: "wrong" },
  "chose known non-matching card": { message: "You'd seen that card, it didn't match.", type: "wrong" },
  "ignored known pair": { message: "A known pair was available.", type: "wrong" },
  "exploration": { message: "Both cards new.", type: "neutral" },
};
