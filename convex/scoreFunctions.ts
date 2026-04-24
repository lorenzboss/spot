import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ─── Save score ───────────────────────────────────────────────────────────────

export const saveGameScore = mutation({
  args: {
    // Classic mode args
    turns: v.optional(v.number()),
    accuracy: v.optional(v.number()),
    // Shared
    time: v.number(),
    // Speed mode args
    gameMode: v.optional(v.union(v.literal('classic'), v.literal('speed'))),
    difficulty: v.optional(v.string()),
    revealMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let score: number;

    if (args.gameMode === 'speed') {
      // Speed score: 1,000,000 / time, multiplied by difficulty factor
      const difficultyMultiplier =
        args.difficulty === 'hard' ? 3 : args.difficulty === 'medium' ? 2 : 1;
      score = Math.round((1_000_000 / Math.max(1, args.time)) * difficultyMultiplier);
    } else {
      // Classic score formula (unchanged)
      const turns = args.turns ?? 8;
      const accuracy = args.accuracy ?? 100;
      const accuracyMultiplier = Math.pow(accuracy / 100, 1.5);
      score = Math.round(
        (10_000_000 / (Math.pow(turns, 1.5) * Math.sqrt(Math.max(1, args.time)))) *
          accuracyMultiplier,
      );
    }

    await ctx.db.insert('gameScores', {
      userId: userId ?? undefined,
      turns: args.turns,
      time: args.time,
      accuracy: args.accuracy,
      score,
      gameMode: args.gameMode ?? 'classic',
      difficulty: args.difficulty,
      revealMode: args.revealMode,
    });

    return score;
  },
});

// ─── Classic leaderboard ──────────────────────────────────────────────────────

export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query('gameScores').collect();

    // Classic = gameMode 'classic' OR no gameMode (legacy rows)
    const classic = allScores.filter(
      (s) => s.gameMode === 'classic' || s.gameMode === undefined,
    );

    // Best score per user
    const bestByUser = new Map<string, (typeof classic)[number]>();
    for (const score of classic) {
      const key = score.userId ?? score._id;
      const existing = bestByUser.get(key);
      if (!existing || score.score > existing.score) bestByUser.set(key, score);
    }

    const sorted = [...bestByUser.values()].sort((a, b) => b.score - a.score).slice(0, 5);

    return await Promise.all(
      sorted.map(async (score) => {
        const user = score.userId ? await ctx.db.get(score.userId) : null;
        return { ...score, username: user?.username ?? null };
      }),
    );
  },
});

// ─── Speed leaderboard ────────────────────────────────────────────────────────

export const getSpeedTopScores = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query('gameScores').collect();

    const speed = allScores.filter((s) => s.gameMode === 'speed');

    // Best (lowest) time per user × difficulty × revealMode combo
    // We keep one entry per user (overall best time across any combo)
    const bestByUser = new Map<string, (typeof speed)[number]>();
    for (const score of speed) {
      const key = score.userId ?? score._id;
      const existing = bestByUser.get(key);
      // Lower time = better; if tied, prefer higher score
      if (!existing || score.time < existing.time || (score.time === existing.time && score.score > existing.score)) {
        bestByUser.set(key, score);
      }
    }

    const sorted = [...bestByUser.values()].sort((a, b) => a.time - b.time).slice(0, 5);

    return await Promise.all(
      sorted.map(async (score) => {
        const user = score.userId ? await ctx.db.get(score.userId) : null;
        return { ...score, username: user?.username ?? null };
      }),
    );
  },
});
