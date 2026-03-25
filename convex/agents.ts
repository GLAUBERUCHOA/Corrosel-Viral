import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
import { PROMPT_AGENTE_01, PROMPT_AGENTE_02 } from "./instructions";

const MODEL_AGENT_1 = 'gemini-2.5-flash';
const MODEL_AGENT_2 = 'gemini-2.5-flash';

/**
 * Agente 1: Busca notícias e salva como pauta pendente
 */
export const runAgent1Fetcher = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    
    const PRODUCTION_MODE = false;
    
    if (PRODUCTION_MODE) {
      const now = new Date();
      const hour = now.getUTCHours() - 3;
      const localHour = hour < 0 ? hour + 24 : hour;
      if (localHour < 0 || localHour > 5) return { success: false, message: "Outside production hours" };

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todaysPautas = await ctx.runQuery(internal.agents.countTodaysPautas, { since: startOfDay.getTime() });
      if (todaysPautas >= 10) return { success: false, message: "Daily limit reached" };
    }

    const genAI = new GoogleGenAI({ apiKey });
    
    // Injeção de Instrução de Sistema (Lei do Arquiteto)
    const model = genAI.getGenerativeModel({ 
      model: MODEL_AGENT_1,
      systemInstruction: PROMPT_AGENTE_01 
    });
    
    const result = await (model as any).generateContent({
      contents: [{ role: 'user', parts: [{ text: "Gere a pauta de HOJE sobre Shopee ou Varejo com dados reais." }] }],
      generationConfig: { 
        temperature: 0.7,
      },
      tools: [{ googleSearch: {} }] 
    });

    const pauta = result.response?.text() || (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';

    await ctx.runMutation(internal.agents.savePauta, {
      pauta,
      type: "noticia"
    });

    return { success: true, pauta };
  },
});

/**
 * Agente 2: Pega uma pauta pendente e gera o carrossel
 */
export const runAgent2Processor = action({
  args: {},
  handler: async (ctx) => {
    const pendingPauta = await ctx.runQuery(internal.agents.getPendingPauta);
    if (!pendingPauta) return { success: false, message: "No pending pautas" };

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    
    const genAI = new GoogleGenAI({ apiKey });
    
    // Injeção de Instrução de Sistema (Lei do Arquiteto)
    const model = genAI.getGenerativeModel({ 
      model: MODEL_AGENT_2,
      systemInstruction: PROMPT_AGENTE_02 
    });

    try {
      const result = await (model as any).generateContent({
        contents: [{ role: 'user', parts: [{ text: `PAUTA:\n${pendingPauta.pauta}` }] }],
        generationConfig: { temperature: 0.7 }
      });

      const carrossel = result.response?.text() || (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';

      const status = carrossel.includes("SLIDE 01:") ? "processed" : "failed";
      
      await ctx.runMutation(internal.agents.updatePautaProcessed, {
        id: pendingPauta._id,
        carrossel,
        status
      });

      return { success: true, carrossel };
    } catch (err: any) {
      await ctx.runMutation(internal.agents.updatePautaProcessed, {
        id: pendingPauta._id,
        status: "failed",
        error: err.message
      });
      return { success: false, error: err.message };
    }
  },
});

// Mutations (No changes needed below)
export const savePauta = mutation({
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

export const updatePautaProcessed = mutation({
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

export const getPendingPauta = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pautas")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
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

export const countTodaysPautas = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    const pautas = await ctx.db
      .query("pautas")
      .filter((q) => q.gt(q.field("createdAt"), args.since))
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
    console.log(`Webhook Instagram: ${args.id}`);
  },
});
