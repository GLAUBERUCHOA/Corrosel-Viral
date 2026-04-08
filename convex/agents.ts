import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPT_AGENTE_01, PROMPT_AGENTE_02 } from "./instructions";

// gemini-2.5-flash: O ápice da inteligência e velocidade em Março/2026
const MODEL_AGENT_1 = 'gemini-2.5-flash';
const MODEL_AGENT_2 = 'gemini-2.5-flash';

// Bypass para erro de tipagem circular do Convex em build local
const internalAgents = internal.agents;

// Pilares de Curadoria (A Roleta)
const CURATION_PILLARS = [
  '🔥 Notícias Quentes (Hot News Pop/Business das últimas 48h)',
  '📱 Cases de Influenciadores e Creators (Bastidores de sucesso ou cancelamento atual)',
  '♟️ Movimentos de Gigantes (Estratégia, brigas de mercado, fusões, falências)',
  '🧠 Comportamento e Sociedade (Geração Z, cansaço digital, lógica de consumo)',
  '🛒 Economia Invisível ATUAL (Novas taxas de apps, inflação disfarçada de HOJE, mudanças de preços recentes)'
];

import { api } from "./_generated/api";

/**
 * Agente 1 (Ponte): Redireciona para ai_actions.ts para rodar em Node.js
 * NOTA: args deve espelhar exatamente o schema de ai_actions.runAgent1Fetcher
 */
export const runAgent1Fetcher: any = action({
  args: { 
    automatic: v.optional(v.boolean()),
    setup: v.optional(v.object({
      nicho: v.string(),
      publicoAlvo: v.string(),
      objetivo: v.string(),
      cta: v.string()
    }))
  },
  handler: async (ctx, args) => {
    console.log("[BRIDGE] Redirecionando Agente 1 para ai_actions.ts...");
    return await ctx.runAction(api.ai_actions.runAgent1Fetcher, args);
  },
});

/**
 * Agente 2 (Ponte): Redireciona para ai_actions.ts para rodar em Node.js
 */
export const runAgent2Processor: any = action({
  args: {},
  handler: async (ctx, args) => {
    console.log("[BRIDGE] Redirecionando Agente 2 para ai_actions.ts...");
    return await ctx.runAction(api.ai_actions.runAgent2Processor, args);
  },
});

// Mutations (Expostas internamente via internalAgents)
export const savePauta = internalMutation({
  args: { pauta: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("pautas", {
      pauta: args.pauta,
      type: args.type,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updatePautaProcessed = internalMutation({
  args: {
    id: v.id("pautas"),
    carrossel: v.optional(v.string()),
    status: v.string(),
    error: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      carrossel: args.carrossel,
      error: args.error,
      processedAt: Date.now(),
    });
  },
});

export const getPendingPauta = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pautas")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .first();
  },
});

export const getAllPautas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pautas")
      .order("desc")
      .take(50);
  },
});

export const clearAllPautas = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("pautas").collect();
    for (const pauta of all) {
      await ctx.db.delete(pauta._id);
    }
  },
});

export const deletePauta = mutation({
  args: { id: v.id("pautas") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const countTodaysPautas = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    const pautas = await ctx.db
      .query("pautas")
      .withIndex("by_created", (q) => q.gt("createdAt", args.since))
      .collect();
    return pautas.length;
  },
});

export const approvePauta = mutation({
  args: { id: v.id("pautas") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: Date.now()
    });
  },
});

// -- Configurações e Memória --

export const getSquadConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "SQUAD_CONFIG"))
      .unique();
  },
});

export const getSquadConfigInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "SQUAD_CONFIG"))
      .unique();
  },
});

export const saveSquadConfig = mutation({
  args: {
    promptAgente1: v.optional(v.any()),
    promptAgente2: v.optional(v.any()),
    contextoSquad: v.optional(v.any()),
    tomGlobal: v.optional(v.any()),
    value: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "SQUAD_CONFIG"))
      .unique();

    const dataToSave = {
      key: "SQUAD_CONFIG",
      promptAgente1: args.promptAgente1,
      promptAgente2: args.promptAgente2,
      contextoSquad: args.contextoSquad,
      tomGlobal: args.tomGlobal,
      value: args.value,
    };

    if (existing) {
      await ctx.db.patch(existing._id, dataToSave);
    } else {
      await ctx.db.insert("settings", dataToSave);
    }
  },
});

export const getRecentPautasTitles = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pautas")
      .withIndex("by_created")
      .order("desc")
      .take(5);
  },
});
export const getPautaById = query({
  args: { id: v.id("pautas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
