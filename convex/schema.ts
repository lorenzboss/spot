import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  gameScores: defineTable({
    userId: v.optional(v.string()),
    playerName: v.optional(v.string()),
    turns: v.number(),
    time: v.number(), // in seconds
    accuracy: v.number(), // percentage (0-100)
    score: v.number(), // calculated score (higher is better)
  })
    .index('by_score', ['score'])
    .index('by_turns_and_time', ['turns', 'time']),
});
