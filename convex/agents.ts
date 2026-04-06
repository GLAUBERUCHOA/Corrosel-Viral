import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
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

/**
 * Agente 1: Busca notícias disruptivas conforme Módulo 1 (Código Negro)
 */
export const runAgent1Fetcher = action({
  args: { automatic: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ success: boolean; pauta?: string; message?: string; error?: string }> => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

    // 1. Início do dia para contagem e janela
    const now = new Date();
    const hourUTC = now.getUTCHours();
    const baseDate = new Date(now);
    baseDate.setUTCHours(3, 0, 0, 0);
    const startOfTodayBRT = now.getUTCHours() < 3 ? baseDate.getTime() - 86400000 : baseDate.getTime();

    // Verificação de Limite e Horário se for Automático
    // Apenas a chamada do cron passará 'automatic: true'. Chamadas manuais passarão 'undefined' ou não passarão parâmetro, o que será falso.
    const isAutomatic = args.automatic === true;

    if (isAutomatic) {
      // Janela da Madrugada (BRT 03:00 - 07:00) => UTC 06:00 - 10:00
      const isDawn = hourUTC >= 6 && hourUTC < 10;
      if (!isDawn) {
        return { success: true, message: "Fora da janela de automação (03h-07h BRT). Ignorado." };
      }

      const todayCount = await ctx.runQuery(internalAgents.countTodaysPautas, { since: startOfTodayBRT });
      if (todayCount >= 10) {
        return { success: true, message: "Limite diário de 10 cards atingido. Automação parada hoje." };
      }
    }

    // 2. Busca de Configurações Dinâmicas (Admin)
    const settings: any = await ctx.runQuery(internalAgents.getSquadConfigInternal);
    const config = settings || {};

    // Suporte aos novos campos flat ou ao objeto aninhado antigo
    const promptDiretor = settings?.promptAgente1 || config.value?.agente_1?.prompt_diretor || PROMPT_AGENTE_01;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";
    const contextoSquad = settings?.contextoSquad || config.value?.contexto_squad || "";

    // 3. Seleção do Pilar do Dia (A Roleta)
    const todayFullCount = await ctx.runQuery(internalAgents.countTodaysPautas, { since: startOfTodayBRT });
    const pillarIndex = todayFullCount % CURATION_PILLARS.length;
    const chosenPillar = CURATION_PILLARS[pillarIndex];

    // 4. Memória Anti-Amnésia (Últimas 5 pautas)
    const recentPautas: any[] = await ctx.runQuery(internalAgents.getRecentPautasTitles);
    const recentTitles = recentPautas.map(p => {
      // Tentar extrair título curto se for pauta bruta (Agente 1 usa [TEMA DA PAUTA])
      const match = p.pauta.match(/\[(?:TEMA DA PAUTA|TÍTULO)\]:\s*(.*)/i);
      return match ? match[1] : p.pauta.substring(0, 50) + "...";
    }).join(", ");

    // 5. Construção dos Comandos Injetáveis
    const systemInstruction = `${promptDiretor}\n\n` +
      `[CONTEXTO ATUALIZADO]: ${contextoSquad}\n` +
      `[TOM DE VOZ]: ${tomGlobal}\n\n` +
      `ORDEM DO SISTEMA: O seu pilar obrigatório para esta busca é: [${chosenPillar}]. Não fuja deste tema.\n\n` +
      `ATENÇÃO: É ESTRITAMENTE PROIBIDO gerar pautas parecidas com estes temas recentes: [${recentTitles}].`;

    const genAI = new GoogleGenAI({ apiKey });

    try {
      const model = genAI.getGenerativeModel({
        model: MODEL_AGENT_1,
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }] as any
      } as any);

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Execute sua missão viral agora seguindo o pilar: ${chosenPillar}. Busque algo de HOJE.` }]
        }],
        generationConfig: {
          temperature: 0.8,
        }
      } as any);

      const pautaRaw: string = result.response?.text() || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!pautaRaw) throw new Error("Falha ao gerar pauta viral.");

      const pauta = `[PILAR DA BUSCA]: ${chosenPillar}\n${pautaRaw}`;

      await ctx.runMutation(internalAgents.savePauta, {
        pauta,
        type: "noticia"
      });

      console.log(`[Agente 1] Pauta salva com sucesso: ${chosenPillar}`);

      // 7. Auto-trigger Agente 2 para roteirizar imediatamente
      // Usamos a versão internal para evitar problemas de recursão se necessário, 
      // ou apenas chamamos a action. No Convex, a melhor forma de encadear actions 
      // é via scheduler ou chamando diretamente se não houver risco de timeout excessivo.
      try {
        console.log("[Agente 1] Disparando Agente 2 para roteirização...");
        await ctx.runAction(internalAgents.runAgent2Processor, {});
      } catch (agent2Err) {
        console.error("[Agente 1] Erro ao disparar Agente 2 (roteirização continuará via cron):", agent2Err);
      }

      return { success: true, pauta };
    } catch (err: any) {
      console.error("❌ Erro fatal no Agente 1:", err);
      return { success: false, error: err.message };
    }
  },
});

/**
 * Agente 2: Transforma a pauta em carrossel estratégico
 */
export const runAgent2Processor = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; carrossel?: string; message?: string; error?: string }> => {
    console.log("[Agente 2] Iniciando processamento de roteiro...");
    const pendingPauta: any = await ctx.runQuery(internalAgents.getPendingPauta);
    if (!pendingPauta) {
      console.log("[Agente 2] Nenhuma pauta pendente para processar.");
      return { success: false, message: "Sem pautas pendentes." };
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

    // Configurações Dinâmicas (Admin)
    const settings: any = await ctx.runQuery(internalAgents.getSquadConfigInternal);
    const config = settings || {};
    const regrasEscrita = settings?.promptAgente2 || config.value?.agente_2?.regras_escrita || PROMPT_AGENTE_02;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";

    console.log(`[Agente 2] Processando pauta ID: ${pendingPauta._id}`);
    const genAI = new GoogleGenAI({ apiKey });

    // Limpar a pauta para remover a tag de Pilar (que é só para exibição na Dashboard)
    // Isso evita confundir o Agente 2 com metadados do Agente 1
    const pautaLimpa = pendingPauta.pauta.replace(/\[PILAR DA BUSCA\]:.*\n/i, "").trim();

    try {
      const model = genAI.getGenerativeModel({
        model: MODEL_AGENT_2,
        systemInstruction: `${regrasEscrita}\n\nTOM DE VOZ SEGUIDO: ${tomGlobal}`
      });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `PAUTA PARA DECODIFICAÇÃO VIRAL:\n${pautaLimpa}` }]
        }],
        generationConfig: {
          temperature: 0.7
        }
      });

      const carrossel: string = result.response?.text() || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!carrossel) throw new Error("IA retornou resposta vazia no Agente 2.");

      const hasSlides: boolean = /SLIDE\s*(0?1):/i.test(carrossel);
      const status: string = hasSlides ? "processed" : "failed";

      console.log(`[Agente 2] Finalizado com status: ${status}`);

      await ctx.runMutation(internalAgents.updatePautaProcessed, {
        id: pendingPauta._id,
        carrossel,
        status
      });

      return { success: true, carrossel };
    } catch (err: any) {
      console.error("❌ Erro fatal no Agente 2:", err);
      await ctx.runMutation(internalAgents.updatePautaProcessed, {
        id: pendingPauta._id,
        status: "failed",
        error: err.message
      });
      return { success: false, error: err.message };
    }
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
