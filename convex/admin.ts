import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server';

async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Not authenticated');
  const user = await ctx.db.get(userId);
  if (user?.role !== 'admin') throw new Error('Not authorized');
  return userId;
}

// List all users with their best highscore
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query('users').collect();
    const allScores = await ctx.db.query('gameScores').collect();

    const bestByUser = new Map<string, { score: number; turns: number; time: number; accuracy: number }>();
    for (const score of allScores) {
      if (!score.userId) continue;
      const existing = bestByUser.get(score.userId);
      if (!existing || score.score > existing.score) {
        bestByUser.set(score.userId, {
          score: score.score,
          turns: score.turns,
          time: score.time,
          accuracy: score.accuracy,
        });
      }
    }

    return users.map((user) => ({
      _id: user._id,
      username: user.username ?? null,
      email: user.email ?? null,
      role: user.role ?? 'user',
      isBanned: user.isBanned ?? false,
      highscore: bestByUser.get(user._id)?.score ?? null,
      bestTurns: bestByUser.get(user._id)?.turns ?? null,
      bestTime: bestByUser.get(user._id)?.time ?? null,
      bestAccuracy: bestByUser.get(user._id)?.accuracy ?? null,
    }));
  },
});

// Set a user's role (user or admin)
export const setUserRole = mutation({
  args: { userId: v.id('users'), role: v.union(v.literal('user'), v.literal('admin')) },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    if (adminId === args.userId) throw new Error('Cannot change your own role');
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Ban or unban a user
export const setBanStatus = mutation({
  args: { userId: v.id('users'), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    if (adminId === args.userId) throw new Error('Cannot ban yourself');
    await ctx.db.patch(args.userId, { isBanned: args.isBanned });
  },
});

// Delete a user and all their data
export const deleteUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    if (adminId === args.userId) throw new Error('Cannot delete yourself');

    // Delete game scores
    const scores = await ctx.db
      .query('gameScores')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    // Delete auth accounts
    const accounts = await ctx.db
      .query('authAccounts')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions
    const sessions = await ctx.db
      .query('authSessions')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);
  },
});

// Admin: update a user's username
export const adminUpdateUsername = mutation({
  args: { userId: v.id('users'), username: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const normalized = args.username.trim().toLowerCase();
    if (!normalized) throw new Error('Username cannot be empty');
    if (!/^[a-zA-Z0-9-]+$/.test(normalized)) throw new Error('Username contains invalid characters');
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first();
    if (existing && existing._id !== args.userId) throw new Error('Username already taken');
    await ctx.db.patch(args.userId, { username: normalized });
  },
});

// Admin: update a user's email (updates users table + the password authAccount)
export const adminUpdateEmail = mutation({
  args: { userId: v.id('users'), email: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const normalized = args.email.trim().toLowerCase();
    if (!normalized) throw new Error('Email cannot be empty');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Invalid email address');

    // Check uniqueness
    const existingUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', normalized))
      .first();
    if (existingUser && existingUser._id !== args.userId) throw new Error('Email already in use');

    // Update user record
    await ctx.db.patch(args.userId, { email: normalized });

    // Update the password provider account's providerAccountId (which stores the email)
    const accounts = await ctx.db
      .query('authAccounts')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    for (const account of accounts) {
      if (account.provider === 'password') {
        await ctx.db.patch(account._id, { providerAccountId: normalized });
      }
    }
  },
});
