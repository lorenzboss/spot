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
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_username', ['username']),
  gameScores: defineTable({
    userId: v.optional(v.id('users')),
    turns: v.number(),
    time: v.number(),
    accuracy: v.number(),
    score: v.number(),
  })
    .index('by_score', ['score'])
    .index('by_turns_and_time', ['turns', 'time']),
});
