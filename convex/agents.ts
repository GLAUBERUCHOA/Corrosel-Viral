import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";

const MODEL_AGENT_1 = 'gemini-2.5-flash';
const MODEL_AGENT_2 = 'gemini-2.5-flash'; // Flash is fast for batch processing

const rules = {
  contexto_squad: "Lembrete para o Squad: o público-alvo são Donas de Casa e Pequenos Empreendedores. Proibido usar jargões de Marketing Digital como 'Gurus' ou 'Leads'. O foco narrativo principal de todo post é a 'Economia do Cotidiano', 'Dores de Tempo' e 'Soluções Práticas'.",
  tom_de_voz_global: "Você tem um tom direto, irônico, afiado e focadíssimo em pessoas comuns. Seja extremamente humano. Fale a língua do povo de forma inteligente.",
  agente_1: {
    pesquisador: "Você é o Agente 1: PESQUISADOR DE TENDÊNCIAS VIRIAS E MARCAS DE CONSUMO.",
    prompt_noticias: "OBJETIVO: Criar uma PAUTA DIGITAL baseada em Notícias Quentes de HOJE sobre Comportamento de Consumo, Varejo, ou Marcas Populares (Shopee, iFood, Marcas de Supermercado).\n\nREGRAS:\n1. BUSQUE as notícias mais faladas de HOJE sobre Shopee, iFood, Varejo (Magalu, Mercado Livre) ou Comportamento de Consumo na crise.\n2. Use o ‘Código Negro’: Encontre o ângulo de INDIGNAÇÃO, CURIOSIDADE ou DESEJO DE GANHO.\n3. Exemplos: Novas taxas ocultas no iFood, Truques de economia na Shopee, O fim de uma marca amada.\n4. Responda apenas com a PAUTA: Qual é a notícia + O ângulo provocativo para explorar no carrossel.",
  },
  agente_2: {
    roteirista: "Você é o Agente 2: ROTEIRISTA E COPYWRITER VIRAL do Squad.\nReceba a PAUTA a seguir.",
    regras_escrita: "SUA MISSÃO: Focar 100% na técnica de escrita e transformar a pauta entregue pelo Agente 1 em um roteiro de fluxo narrativo com exatos 5 slides magnéticos.\n\nPROIBIÇÃO TOTAL: NUNCA use blocos de código (```) ou formato JSON. Use apenas linhas de TEXTO PURO.\n\nFORMATO DE SAÍDA (Obrigatoriedade Absoluta):\nSLIDE 01:\n[TÍTULO]: (Título chamativo)\n[SUBTÍTULO]: (Subtítulo que gere curiosidade)\n[ARTE]: (Instrução para geração de imagem)\n\nSLIDE 02:\n...\n\nLEGENDA:\n(Legenda completa com emojis)"
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
    
    const PRODUCTION_MODE = false; // Turn true to enable 00:00-05:00 schedule
    
    if (PRODUCTION_MODE) {
      const now = new Date();
      const hour = now.getUTCHours() - 3; // Brasilia Time
      const localHour = hour < 0 ? hour + 24 : hour;
      
      if (localHour < 0 || localHour > 5) {
        console.log("Fora do horário de produção (00-05). Pulando.");
        return { success: false, message: "Outside production hours" };
      }

      // Check daily limit of 10 pautas
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todaysPautas = await ctx.runQuery(internal.agents.countTodaysPautas, { since: startOfDay.getTime() });
      if (todaysPautas >= 10) {
        console.log("Limite diário de 10 pautas atingido.");
        return { success: false, message: "Daily limit reached" };
      }
    }

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
    
    // Mock Webhook to Vercel/Instagram
    console.log(`Disparando webhook Instagram para pauta: ${args.id}`);
  },
});




