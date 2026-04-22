import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Override users table to add username field, keeping all auth fields & indexes
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    role: v.optional(v.union(v.literal('user'), v.literal('admin'))),
    isBanned: v.optional(v.boolean()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_username', ['username'])
    .index('by_role', ['role']),
  gameScores: defineTable({
    userId: v.optional(v.id('users')),
    turns: v.optional(v.number()),       // classic mode only
    time: v.number(),
    accuracy: v.optional(v.number()),    // classic mode only
    score: v.number(),
    gameMode: v.optional(v.union(v.literal('classic'), v.literal('speed'))),
    difficulty: v.optional(v.string()),  // speed mode: 'easy' | 'medium' | 'hard'
    revealMode: v.optional(v.string()), // speed mode: 'sequential' | 'random'
  })
    .index('by_score', ['score'])
    .index('by_turns_and_time', ['turns', 'time'])
    .index('by_gameMode', ['gameMode']),
});
