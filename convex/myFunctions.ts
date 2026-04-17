import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get the currently logged-in user document
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Check if an email is already registered
export const checkEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query('authAccounts')
      .withIndex('providerAndAccountId', (q) => q.eq('provider', 'password').eq('providerAccountId', normalized))
      .first();
    return { exists: existing !== null };
  },
});

// Check if a username is available (case-insensitive, stored lowercase)
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.trim().toLowerCase();
    if (!normalized) return { available: false };
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first();
    return { available: existing === null };
  },
});

// Save game score after completing a game
export const saveGameScore = mutation({
  args: {
    turns: v.number(),
    time: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const score = Math.round(10_000_000 / (Math.pow(args.turns, 1.5) * Math.sqrt(Math.max(1, args.time))));
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

// Get top 5 highscores, joined with username from users table
export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query('gameScores').collect();

    const sorted = allScores.sort((a, b) => b.score - a.score).slice(0, 5);

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

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});
