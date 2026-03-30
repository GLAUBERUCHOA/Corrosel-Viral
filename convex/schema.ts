import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pautas: defineTable({
    pauta: v.string(),
    type: v.string(), // "noticia", "manual"
    status: v.string(), // "pending", "processing", "processed", "approved", "failed"
    carrossel: v.optional(v.string()), // JSON string do roteiro
    error: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
  })
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]),
  settings: defineTable({
    key: v.string(), // "SQUAD_CONFIG"
    promptAgente1: v.optional(v.any()),
    promptAgente2: v.optional(v.any()),
    contextoSquad: v.optional(v.any()),
    tomGlobal: v.optional(v.any()),
    value: v.optional(v.any()),
  }).index("by_key", ["key"]),
});
