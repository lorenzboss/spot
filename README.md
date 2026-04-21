# Spot — Select Pairs Online Together

**Spot** is a browser-based memory card game built as a full-stack web application.

> **Spot** stands for **S**elect **P**airs **O**nline **T**ogether

## What is Spot?

Spot is a classic memory matching game: 16 cards are laid face-down in a 4×4 grid. Each card has a hidden Pokémon sprite. There are 8 unique Pokémon, each appearing twice. The goal is to find all 8 matching pairs by flipping two cards per turn.

**Key features:**

- **Offline solo mode** — play alone and train your memory
- **User accounts** — sign up with a username and password, scores are saved to your profile
- **Leaderboard** — top 5 scores across all players, ranked by score
- **Smart accuracy tracking** — not just "how many matches", but how well you used your memory (see [Scoring](#scoring))
- **Turn feedback** — after each turn, a short message tells you whether your move was smart, lucky, or a mistake
- **Random Pokémon** — every game picks 8 random Generation I Pokémon, so each game is different

**Tech stack:**

- [Next.js](https://nextjs.org/) — frontend and page routing
- [Convex](https://docs.convex.dev/) — backend, database, and real-time queries
- [Convex Auth](https://labs.convex.dev/auth) — email/password authentication with username support
- [Tailwind CSS](https://tailwindcss.com/) — styling

## Get started

1. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

2. Start the Convex development backend:

   ```bash
   npx convex dev
   ```

   This sets up your Convex deployment and adds the `CONVEX_URL` to `.env.local`.

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

---

## Scoring

### Overview

After completing a game, a score is calculated from three factors: the number of turns taken, the time elapsed, and the accuracy of memory usage. The score is designed so that all three factors matter — a fast game with many mistakes scores lower than a slower but precise game.

---

### Score Formula

$$\text{score} = \frac{10{,}000{,}000}{\text{turns}^{1.5} \cdot \sqrt{\text{time}}} \cdot \left(\frac{\text{accuracy}}{100}\right)^{1.5}$$

| Parameter  | Description                                         |
| ---------- | --------------------------------------------------- |
| `turns`    | Total number of card pairs flipped during the game  |
| `time`     | Time in seconds from first card flip to last match  |
| `accuracy` | Percentage of smart turns that were correct (0-100) |

---

### Why this formula?

**Turns** are the most direct measure of memory skill and are weighted with exponent `1.5`. This means going from 20 to 10 turns matters a lot more than going from 12 to 8 — punishing inefficient play proportionally.

**Time** is weighted with exponent `0.5` (square root). Time matters, but less so than turns — a player who thinks carefully and takes a few extra seconds should not be punished too harshly. The `sqrt` keeps time relevant without dominating the score.

**Accuracy** uses exponent `1.5`. A linear multiplier (`k=1`) would make every percentage point of accuracy equally impactful. With `k=1.5`, the difference between 90% and 100% is larger than the difference between 50% and 60% — rewarding near-perfect play. A single mistake at 89% accuracy reduces the score by ~16%, which is noticeable but not devastating.

The base constant `10,000,000` is chosen so that a solid but not exceptional game (around 14 turns, 90 seconds, 85% accuracy) produces a score roughly in the range of 5,000-15,000, which feels meaningful as a leaderboard number.

---

### Accuracy

Accuracy is not simply "matches divided by total turns." That would reward lucky guesses and punish necessary exploration equally. Instead, accuracy only counts turns where the player **had enough information to make a better decision**.

#### A turn counts toward accuracy if:

- It is a **match** — always counts, because every match demonstrates correct recall or lucky discovery
- The player **knew where the partner** of the first card was (seen in a prior turn) but didn't choose it → missed opportunity
- The player chose a **second card they had already seen** and it didn't match → avoidable mistake
- A **fully-known unmatched pair** was available at the start of the turn but was ignored → wasted knowledge

#### A turn does NOT count if:

- Both cards were completely new and no match was made — this is pure exploration and carries no information advantage

#### Accuracy categories per turn:

| Reason                                          | Counts? | Correct? | Feedback                                             |
| ----------------------------------------------- | ------- | -------- | ---------------------------------------------------- |
| Match — cards were known to the player          | ✅      | ✅       | 🟢 "Match, you knew where it was."                   |
| Match — neither card was known (lucky)          | ✅      | ✅       | 🟢 "Lucky match!"                                    |
| Knew partner of first card, picked wrong second | ✅      | ❌       | 🔴 "You knew the partner but picked something else." |
| Second card was already seen, no match          | ✅      | ❌       | 🔴 "You'd seen that card, it didn't match."          |
| A complete known pair was available, ignored    | ✅      | ❌       | 🔴 "A known pair was available."                     |
| Both cards new, no match (exploration)          | ❌      | —        | ⚪ "Both cards new."                                 |

$$\text{accuracy} = \frac{\text{correct counted turns}}{\text{total counted turns}} \times 100$$

After every turn, a short feedback message appears below the grid in green, red, or grey, so the player always knows how their move was evaluated.
