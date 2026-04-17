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
    // Calculate score: fewer turns + faster time + higher accuracy = better score
    // Score formula: 10000 - (turns * 100) - time + (accuracy * 10)
    // This prioritizes fewer turns, then time, then accuracy
    const score = 10000 - args.turns * 100 - args.time + args.accuracy * 10;

    const identity = await ctx.auth.getUserIdentity();

    const gameScore = await ctx.db.insert('gameScores', {
      userId: identity?.subject,
      playerName: identity?.name || identity?.email,
      turns: args.turns,
      time: args.time,
      accuracy: args.accuracy,
      score: score,
    });

    return gameScore;
  },
});

// Get top 5 highscores sorted by turns (ascending) and time (ascending)
export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    // Get all scores and sort by turns (ascending), then by time (ascending)
    const allScores = await ctx.db.query('gameScores').order('desc').collect();

    // Sort: first by turns (ascending), then by time (ascending)
    const sortedScores = allScores.sort((a, b) => {
      if (a.turns !== b.turns) {
        return a.turns - b.turns; // Fewer turns is better
      }
      return a.time - b.time; // Faster time is better
    });

    // Return top 5
    return sortedScores.slice(0, 5);
  },
});
