import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";

const MODEL_AGENT_1 = 'gemini-2.0-flash';
const MODEL_AGENT_2 = 'gemini-2.0-flash'; // Flash is fast for batch processing

const rules = {
  contexto_squad: "Lembrete para o Squad: o público-alvo são Donas de Casa e Pequenos Empreendedores. Proibido usar jargões de Marketing Digital como 'Gurus' ou 'Leads'. O foco narrativo principal de todo post é a 'Economia do Cotidiano', 'Dores de Tempo' e 'Soluções Práticas'.",
  tom_de_voz_global: "Você tem um tom direto, irônico, afiado e focadíssimo em pessoas comuns. Seja extremamente humano. Fale a língua do povo de forma inteligente.",
  agente_1: {
    pesquisador: "Você é o Agente 1: PESQUISADOR E DIRETOR DE PAUTA do Squad.",
    prompt_noticias: "OBJETIVO: Criar uma PAUTA DIGITAL disruptiva baseada em Notícias Quentes.\n\nREGRAS:\n1. PESQUISE OBRIGATORIAMENTE uma notícia real, verificada e estritamente atual que de alguma forma possa afetar a vida real das pessoas ou gerar fofoca construtiva.\n2. Formule uma pauta usando o princípio da Curiosidade Extrema.\n3. Responda apenas com a PAUTA: Qual é a notícia + O ângulo provocativo para explorar no carrossel.",
  },
  agente_2: {
    roteirista: "Você é o Agente 2: ROTEIRISTA E COPYWRITER VIRAL do Squad.\nReceba a PAUTA a seguir.",
    regras_escrita: "SUA MISSÃO: Focar 100% na técnica de escrita e transformar a pauta entregue pelo Agente 1 em um roteiro de fluxo narrativo com exatos 5 slides magnéticos.\n\nFORMATO DE SAÍDA (Obrigatório seguir JSON):\n[\n  { \"slide\": 1, \"title\": \"[TÍTULO]\", \"subtitle\": \"[SUBTÍTULO]\", \"imagePrompt\": \"[DIREÇÃO DE ARTE]\" },\n  ... ,\n  { \"slide\": \"legenda\", \"legenda\": \"[LEGENDA completo com emojis]\" }\n]"
  }
};

/**
 * Agente 1: Busca notícias e salva como pauta pendente
 */
export const runAgent1Fetcher = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    
    const genAI = new GoogleGenAI({ apiKey });
    
    const pautaSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_1.pesquisador}\n\n${rules.agente_1.prompt_noticias}\n\nResponda apenas com a pauta.`;
    
    // Using the same pattern as in geradorCarrossel.ts
    const result = await (genAI as any).models.generateContent({
      model: MODEL_AGENT_1,
      contents: pautaSetup,
      config: { 
        temperature: 0.7,
        tools: [{ googleSearch: {} }] 
      }
    });

    const pauta = result.text || result.response?.text || (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';


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
    // 1. Get next pending pauta
    const pendingPauta = await ctx.runQuery(internal.agents.getPendingPauta);
    if (!pendingPauta) return { success: false, message: "No pending pautas" };

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    
    const genAI = new GoogleGenAI({ apiKey });
    
    const roteiroSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_2.roteirista}\n\n[PAUTA]:\n${pendingPauta.pauta}\n\n${rules.agente_2.regras_escrita}`;

    try {
      const result = await (genAI as any).models.generateContent({
        model: MODEL_AGENT_2,
        contents: roteiroSetup,
        config: { temperature: 0.7 }
      });

      const carrossel = result.text || result.response?.text || (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';


      await ctx.runMutation(internal.agents.updatePautaProcessed, {
        id: pendingPauta._id,
        carrossel,
        status: "processed"
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

// Mutations for storage
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



