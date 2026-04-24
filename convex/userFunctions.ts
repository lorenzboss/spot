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

// Get the current user's own game stats across all game modes
export const getMyGameStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const games = await ctx.db
      .query('gameScores')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();

    const sortedGames = games.sort((a, b) => b._creationTime - a._creationTime);

    // ── Classic ──────────────────────────────────────────────────────────────
    const classicGames = sortedGames.filter(
      (g) => g.gameMode === 'classic' || g.gameMode === undefined,
    );
    const classicTotals = classicGames.reduce(
      (acc, g) => {
        acc.score += g.score;
        acc.turns += g.turns ?? 0;
        acc.time += g.time;
        acc.accuracy += g.accuracy ?? 0;
        return acc;
      },
      { score: 0, turns: 0, time: 0, accuracy: 0 },
    );
    const classicBest = classicGames.reduce<typeof classicGames[number] | null>((best, g) => {
      if (!best || g.score > best.score) return g;
      return best;
    }, null);

    // ── Speed ────────────────────────────────────────────────────────────────
    const speedGames = sortedGames.filter((g) => g.gameMode === 'speed');
    const speedTotals = speedGames.reduce(
      (acc, g) => {
        acc.score += g.score;
        acc.time += g.time;
        return acc;
      },
      { score: 0, time: 0 },
    );
    const speedBest = speedGames.reduce<typeof speedGames[number] | null>((best, g) => {
      // Best speed = highest score (score already reflects difficulty)
      if (!best || g.score > best.score) return g;
      return best;
    }, null);

    const n = classicGames.length;
    const ns = speedGames.length;

    return {
      totalGames: sortedGames.length,
      classic: {
        totalGames: n,
        highscore: classicBest?.score ?? null,
        bestTurns: classicBest?.turns ?? null,
        bestTime: classicBest?.time ?? null,
        bestAccuracy: classicBest?.accuracy ?? null,
        averages:
          n === 0
            ? null
            : {
                score: classicTotals.score / n,
                turns: classicTotals.turns / n,
                time: classicTotals.time / n,
                accuracy: classicTotals.accuracy / n,
              },
        games: classicGames.map((g) => ({
          _id: g._id,
          score: g.score,
          turns: g.turns ?? 0,
          time: g.time,
          accuracy: g.accuracy ?? 0,
          playedAt: g._creationTime,
        })),
      },
      speed: {
        totalGames: ns,
        highscore: speedBest?.score ?? null,
        bestTime: speedBest?.time ?? null,
        bestDifficulty: speedBest?.difficulty ?? null,
        bestRevealMode: speedBest?.revealMode ?? null,
        averages:
          ns === 0
            ? null
            : {
                score: speedTotals.score / ns,
                time: speedTotals.time / ns,
              },
        games: speedGames.map((g) => ({
          _id: g._id,
          score: g.score,
          time: g.time,
          difficulty: g.difficulty ?? 'easy',
          revealMode: g.revealMode ?? 'sequential',
          playedAt: g._creationTime,
        })),
      },
    };
  },
});
