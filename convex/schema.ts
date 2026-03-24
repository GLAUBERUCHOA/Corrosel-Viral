import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pautas: defineTable({
    pauta: v.string(),
    type: v.string(), // 'noticia' | 'perene'
    status: v.string(), // 'pending' | 'processed' | 'failed'
    carrossel: v.optional(v.string()), // JSON string resulting from Agent 2
    error: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});
