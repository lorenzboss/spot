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

// Update the current user's own username
export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const normalized = args.username.trim().toLowerCase();
    if (!normalized) throw new Error('Username cannot be empty');
    if (!/^[a-zA-Z0-9-]+$/.test(normalized)) throw new Error('Username contains invalid characters');
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first();
    if (existing && existing._id !== userId) throw new Error('Username already taken');
    await ctx.db.patch(userId, { username: normalized });
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});
