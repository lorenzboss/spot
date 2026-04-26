export interface CardData {
  id: number;
  src: string;
  matched: boolean;
}

export type RevealMode = "sequential" | "random";
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_SHOW_MS: Record<Difficulty, number> = {
  easy: 3000,
  medium: 1500,
  hard: 700,
};

export type GamePhase =
  | "select" // choosing sub-mode
  | "ready" // cards generated, waiting for user to press Start
  | "revealing" // one card at a time being shown
  | "playing" // player picks pairs
  | "lost"
  | "won";

export const TOTAL_PAIRS = 8;
export const CARD_GAP_MS = 0;
