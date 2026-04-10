import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pautas: defineTable({
    pauta: v.string(),
    type: v.string(), // "noticia", "manual"
    status: v.string(), // "pending", "processing", "processed", "approved", "failed"
    carrossel: v.optional(v.string()), // JSON string do roteiro
    error: v.optional(v.string()),
    userEmail: v.optional(v.string()), // Dono da pauta (multi-tenant)
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
  })
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"])
  .index("by_user", ["userEmail", "createdAt"]),
  settings: defineTable({
    key: v.string(), // "SQUAD_CONFIG"
    promptAgente1: v.optional(v.any()),
    promptAgente2: v.optional(v.any()),
    contextoSquad: v.optional(v.any()),
    tomGlobal: v.optional(v.any()),
    value: v.optional(v.any()),
    // Setup do Especialista (SaaS)
    nicho: v.optional(v.string()),
    publicoAlvo: v.optional(v.string()),
    objetivo: v.optional(v.string()),
    cta: v.optional(v.string()),
  }).index("by_key", ["key"]),
});
