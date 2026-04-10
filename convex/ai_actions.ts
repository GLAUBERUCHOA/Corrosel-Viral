"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPT_AGENTE_01, PROMPT_AGENTE_02 } from "./instructions";

// Modelos com fallback — gemini-2.0-flash tem cota separada e mais generosa
const MODEL_PRIMARY = 'gemini-2.5-flash';
const MODEL_FALLBACK = 'gemini-2.0-flash';

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
 * Helper: Chama o Gemini com retry + fallback de modelo
 * Se o modelo primário retornar 429/503, espera 15s e tenta o modelo fallback
 */
async function callGeminiWithRetry(
  apiKey: string,
  systemInstruction: string,
  userPrompt: string,
  temperature: number = 0.85,
  maxOutputTokens: number = 1024
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const models = [MODEL_PRIMARY, MODEL_FALLBACK];

  for (const modelName of models) {
    try {
      console.log(`[GEMINI] Tentando modelo: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, maxOutputTokens },
      });

      const text = result.response.text();
      if (text) {
        console.log(`[GEMINI] ✅ Resposta obtida com ${modelName} (${text.length} chars)`);
        return text;
      }
      console.warn(`[GEMINI] Resposta vazia de ${modelName}, tentando fallback...`);
    } catch (err: any) {
      const status = err?.status || err?.httpStatusCode || 0;
      const isRetryable = status === 429 || status === 503 || 
        err?.message?.includes('429') || err?.message?.includes('503') ||
        err?.message?.includes('Too Many Requests') || err?.message?.includes('RESOURCE_EXHAUSTED');

      console.warn(`[GEMINI] ❌ ${modelName} falhou (status=${status}): ${err.message?.substring(0, 150)}`);

      if (isRetryable && modelName === MODEL_PRIMARY) {
        console.log(`[GEMINI] ⏳ Aguardando 15s antes de tentar ${MODEL_FALLBACK}...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
        continue; // Tenta o próximo modelo
      }

      throw err; // Se o fallback também falhou, propaga o erro
    }
  }

  throw new Error("Todos os modelos falharam.");
}

/**
 * Agente 1: Busca notícias disruptivas
 */
export const runAgent1Fetcher = action({
  args: { 
    automatic: v.optional(v.boolean()),
    userApiKey: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    setup: v.optional(v.object({
      nicho: v.string(),
      publicoAlvo: v.string(),
      objetivo: v.string(),
      cta: v.string()
    }))
  },
  handler: async (ctx, args): Promise<{ success: boolean; pauta?: string; message?: string; error?: string }> => {
    // Prioridade: Key do cliente > Key do admin (.env)
    const apiKey = args.userApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Nenhuma API Key do Gemini configurada. Adicione sua chave no Setup do Especialista.");

    console.log("[AI_ACTIONS] Iniciando runAgent1Fetcher...");

    // 1. Controle temporal
    const now = new Date();
    const hourUTC = now.getUTCHours();
    const baseDate = new Date(now);
    baseDate.setUTCHours(3, 0, 0, 0);
    const startOfTodayBRT = hourUTC < 3 ? baseDate.getTime() - 86400000 : baseDate.getTime();

    const isAutomatic = args.automatic === true;

    if (isAutomatic) {
      // Janela Noturna BRT: 22:00 - 06:00 = UTC 01:00 - 09:00
      const isNightWindow = hourUTC >= 1 && hourUTC < 9;
      if (!isNightWindow) {
        console.log(`[AI_ACTIONS] Fora da janela noturna (hora UTC: ${hourUTC}). Ignorado.`);
        return { success: true, message: `Fora da janela noturna (22h-06h BRT). Hora UTC: ${hourUTC}. Ignorado.` };
      }

      const todayCount = await ctx.runQuery(internalAgents.countTodaysPautas, { since: startOfTodayBRT });
      if (todayCount >= 8) {
        console.log(`[AI_ACTIONS] Limite diário de 8 cards atingido (${todayCount}).`);
        return { success: true, message: `Limite diário de 8 cards atingido (${todayCount}). Automação pausada.` };
      }
    }

    // 2. Busca de Configurações Dinâmicas (Admin) — SQUAD_CONFIG do Convex
    const settings: any = await ctx.runQuery(internalAgents.getSquadConfigInternal);
    const config = settings || {};

    const promptDiretor = settings?.promptAgente1 || config.value?.agente_1?.prompt_diretor || PROMPT_AGENTE_01;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";
    const contextoSquad = settings?.contextoSquad || config.value?.contexto_squad || "";

    // Setup do Especialista: 1º args da UI manual → 2º SQUAD_CONFIG do Convex → 3º vazio
    const activeSetup = args.setup || {
      nicho: settings?.nicho || config.value?.nicho || "",
      publicoAlvo: settings?.publicoAlvo || config.value?.publicoAlvo || "",
      objetivo: settings?.objetivo || config.value?.objetivo || "atracao",
      cta: settings?.cta || config.value?.cta || ""
    };

    const personaInjection = activeSetup.nicho && activeSetup.publicoAlvo
      ? `[PERFIL DO CONTEÚDO]\n- Nicho: ${activeSetup.nicho}\n- Público-Alvo: ${activeSetup.publicoAlvo}\n- Objetivo: ${activeSetup.objetivo}\n- CTA: ${activeSetup.cta}\n\nATENÇÃO: Toda busca e curadoria DEVE ser 100% focada no nicho "${activeSetup.nicho}" e voltada para o público "${activeSetup.publicoAlvo}". Ignore completamente qualquer outro assunto que não se relacione diretamente a este nicho.\n\n`
      : "";

    // 3. Seleção do Pilar do Dia (A Roleta)
    const todayFullCount = await ctx.runQuery(internalAgents.countTodaysPautas, { since: startOfTodayBRT });
    const pillarIndex = todayFullCount % CURATION_PILLARS.length;
    const chosenPillar = CURATION_PILLARS[pillarIndex];

    // 4. Memória Anti-Amnésia (Últimas 5 pautas)
    const recentPautas: any[] = await ctx.runQuery(internalAgents.getRecentPautasTitles);
    const recentTitles = recentPautas.map(p => {
      const match = p.pauta.match(/\[(?:TEMA DA PAUTA|TÍTULO)\]:\s*(.*)/i);
      return match ? match[1] : p.pauta.substring(0, 50) + "...";
    }).join(", ");

    // 5. Construção do System Instruction
    const systemInstruction = `${promptDiretor}\n\n` +
      personaInjection +
      `[CONTEXTO]: ${contextoSquad}\n` +
      `[ESTILO]: ${tomGlobal}\n\n` +
      `[PILAR OBRIGATÓRIO]: ${chosenPillar}\n\n` +
      `[EVITAR REPETIÇÃO]: ${recentTitles}`;

    console.log("[AI_ACTIONS] personaInjection ativo:", personaInjection ? "SIM" : "NÃO (vazio)");
    console.log("[AI_ACTIONS] Nicho:", activeSetup.nicho || "(nenhum)");
    console.log("[AI_ACTIONS] Pilar:", chosenPillar);

    try {
      const text = await callGeminiWithRetry(
        apiKey,
        systemInstruction,
        `MISSÃO VIRAL: Execute sua pesquisa agora seguindo o pilar: ${chosenPillar}.\n\nBusque uma notícia ou acontecimento CONCRETO e REAL das últimas 48-72 horas. Seja específico com nomes, números e datas reais. Entregue o resultado IMEDIATAMENTE no formato exigido pelo sistema.`,
        0.85,
        1024
      );

      const pautaCompleta = `[PILAR DA BUSCA]: ${chosenPillar}\n${text}`;
      
      await ctx.runMutation(internalAgents.savePauta, {
        pauta: pautaCompleta,
        type: "noticia",
        userEmail: args.userEmail
      });
      
      console.log("[AI_ACTIONS] ✅ Pauta salva com sucesso.");
      return { success: true, pauta: pautaCompleta };

    } catch (err: any) {
      console.error("❌ Erro fatal no Agente 1:", err.message?.substring(0, 300));

      // Salva a pauta como "failed" com detalhes do erro para diagnóstico
      await ctx.runMutation(internalAgents.savePauta, {
        pauta: `[ERRO] Falha ao gerar pauta — ${err.message?.substring(0, 200)}`,
        type: "noticia",
        userEmail: args.userEmail
      });
      // Marca como failed imediatamente
      return { success: false, error: err.message?.substring(0, 300) };
    }
  },
});

/**
 * Agente 2: Decodificador Viral (Transforma Pauta em Roteiro de Carrossel)
 */
export const runAgent2Processor = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; carrossel?: string; message?: string }> => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

    // 1. Busca pauta pendente
    const pendingPauta: any = await ctx.runQuery(internalAgents.getPendingPauta);
    if (!pendingPauta) {
      return { success: true, message: "Nenhuma pauta pendente encontrada." };
    }

    // Pula pautas que são mensagens de erro do sistema
    if (pendingPauta.pauta.startsWith("[ERRO]")) {
      await ctx.runMutation(internalAgents.updatePautaProcessed, {
        id: pendingPauta._id,
        status: "failed",
        error: "Pauta de erro do sistema — não processável"
      });
      return { success: true, message: "Pauta de erro pulada." };
    }

    // Configurações Dinâmicas (Admin)
    const settings: any = await ctx.runQuery(internalAgents.getSquadConfigInternal);
    const config = settings || {};
    const regrasEscrita = settings?.promptAgente2 || config.value?.agente_2?.regras_escrita || PROMPT_AGENTE_02;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";

    console.log(`[Agente 2] Processando pauta ID: ${pendingPauta._id}`);

    // Limpar a pauta
    const pautaLimpa = pendingPauta.pauta.replace(/\[PILAR DA BUSCA\]:.*\n/i, "").trim();

    try {
      const carrossel = await callGeminiWithRetry(
        apiKey,
        `${regrasEscrita}\n\n[ESTILO]: ${tomGlobal}`,
        `PAUTA PARA DECODIFICAÇÃO VIRAL:\n${pautaLimpa}`,
        0.7,
        2048
      );

      const hasSlides: boolean = /SLIDE\s*(0?1):/i.test(carrossel);
      const status: string = hasSlides ? "processed" : "failed";

      console.log(`[Agente 2] ✅ Finalizado com status: ${status}`);

      await ctx.runMutation(internalAgents.updatePautaProcessed, {
        id: pendingPauta._id,
        carrossel,
        status
      });

      return { success: true, carrossel };
    } catch (err: any) {
      console.error("❌ Erro fatal no Agente 2:", err.message?.substring(0, 300));
      await ctx.runMutation(internalAgents.updatePautaProcessed, {
        id: pendingPauta._id,
        status: "failed",
        error: err.message?.substring(0, 200)
      });
      return { success: false, message: err.message?.substring(0, 300) };
    }
  },
});
