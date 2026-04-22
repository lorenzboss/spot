import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Save game score after completing a game
export const saveGameScore = mutation({
  args: {
    turns: v.number(),
    time: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const accuracyMultiplier = Math.pow(args.accuracy / 100, 1.5);
    const score = Math.round(
      (10_000_000 / (Math.pow(args.turns, 1.5) * Math.sqrt(Math.max(1, args.time)))) * accuracyMultiplier,
    );
    const userId = await getAuthUserId(ctx);

    await ctx.db.insert('gameScores', {
      userId: userId ?? undefined,
      turns: args.turns,
      time: args.time,
      accuracy: args.accuracy,
      score,
    });
  },
});

// Get top 5 highscores — one entry per user (their personal best), joined with username
export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query('gameScores').collect();

    // Keep only the best score per userId (anonymous scores kept individually)
    const bestByUser = new Map<string, (typeof allScores)[number]>();
    for (const score of allScores) {
      const key = score.userId ?? score._id; // anonymous = unique per game
      const existing = bestByUser.get(key);
      if (!existing || score.score > existing.score) {
        bestByUser.set(key, score);
      }
    }

    const sorted = [...bestByUser.values()].sort((a, b) => b.score - a.score).slice(0, 5);

    return await Promise.all(
      sorted.map(async (score) => {
        const user = score.userId ? await ctx.db.get(score.userId) : null;
        return {
          ...score,
          username: user?.username ?? null,
        };
      }),
    );
  },
});
