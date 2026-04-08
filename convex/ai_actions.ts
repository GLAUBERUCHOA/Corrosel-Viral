"use node";

import { action } from "./_generated/server";
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

/**
 * Agente 1: Busca notícias disruptivas conforme Módulo 1 (Código Negro)
 */
export const runAgent1Fetcher = action({
  args: { 
    automatic: v.optional(v.boolean()),
    setup: v.optional(v.object({
      nicho: v.string(),
      publicoAlvo: v.string(),
      objetivo: v.string(),
      cta: v.string()
    }))
  },
  handler: async (ctx, args): Promise<{ success: boolean; pauta?: string; message?: string; error?: string }> => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");

    console.log("[AI_ACTIONS] Iniciando runAgent1Fetcher...");

    // 1. Início do dia para contagem e janela
    const now = new Date();
    const hourUTC = now.getUTCHours();
    const baseDate = new Date(now);
    baseDate.setUTCHours(3, 0, 0, 0);
    const startOfTodayBRT = now.getUTCHours() < 3 ? baseDate.getTime() - 86400000 : baseDate.getTime();

    // Verificação de Limite e Horário se for Automático
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

    const promptDiretor = settings?.promptAgente1 || config.value?.agente_1?.prompt_diretor || PROMPT_AGENTE_01;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";
    const contextoSquad = settings?.contextoSquad || config.value?.contexto_squad || "";

    // Prioridade para o perfil: 1. Argumentos da chamada | 2. Configurações Globais (Convex/Squad)
    const activeSetup = args.setup || {
      nicho: settings?.nicho || config.value?.nicho || "",
      publicoAlvo: settings?.publicoAlvo || config.value?.publicoAlvo || "",
      objetivo: settings?.objetivo || config.value?.objetivo || "atracao",
      cta: settings?.cta || config.value?.cta || ""
    };

    const personaInjection = activeSetup.nicho && activeSetup.publicoAlvo
      ? `[PERFIL DO USUÁRIO SAAS]\nAtue como um especialista no nicho de ${activeSetup.nicho}, falando para ${activeSetup.publicoAlvo}. O objetivo do carrossel é ${activeSetup.objetivo} com a chamada final de CTA: "${activeSetup.cta}". MÁXIMO CUIDADO para escrever uma pauta cirurgicamente focada nesse avatar.\n\n`
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

    // 5. Construção dos Comandos Injetáveis
    const systemInstruction = `${promptDiretor}\n\n` +
      personaInjection +
      `[CONTEXTO ATUALIZADO]: ${contextoSquad}\n` +
      `[TOM DE VOZ]: ${tomGlobal}\n\n` +
      `ORDEM DO SISTEMA: O seu pilar obrigatório para esta busca é: [${chosenPillar}]. Não fuja deste tema.\n\n` +
      `ATENÇÃO: É ESTRITAMENTE PROIBIDO gerar pautas parecidas com estes temas recentes: [${recentTitles}].`;

    console.log("[AI_ACTIONS] Instanciando SDK do Gemini...");
    
    // Verificação de segurança para o tipo importado
    if (typeof GoogleGenerativeAI !== 'function') {
      console.error("[AI_ACTIONS] ERRO: GoogleGenerativeAI não é uma função/classe!", typeof GoogleGenerativeAI);
      throw new Error("SDK Import Failure: GoogleGenerativeAI is not a constructor");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      const model = genAI.getGenerativeModel({
        model: MODEL_AGENT_1,
        systemInstruction: systemInstruction,
      });

      console.log("[AI_ACTIONS] Chamando model.generateContent...");
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `MISSÃO VIRAL: Execute sua pesquisa agora seguindo o pilar: ${chosenPillar}.\n\nBusque uma notícia ou acontecimento CONCRETO e REAL das últimas 48-72 horas. Seja específico com nomes, números e datas reais. Entregue o resultado IMEDIATAMENTE no formato exigido pelo sistema.` }]
        }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1024,
        }
      });

      const response = result.response;
      const text = response.text();

      if (text) {
        // Enriquecer a pauta com o metadado do pilar para a Dashboard
        const pautaCompleta = `[PILAR DA BUSCA]: ${chosenPillar}\n${text}`;
        
        await ctx.runMutation(internalAgents.savePauta, {
          pauta: pautaCompleta,
          type: "noticia"
        });
        
        console.log("[AI_ACTIONS] Pauta salva com sucesso.");
        return { success: true, pauta: pautaCompleta };
      }

      console.warn("[AI_ACTIONS] Resposta da IA veio vazia.");
      return { success: false, message: "A IA retornou resposta vazia." };

    } catch (err: any) {
      console.error("❌ Erro fatal no Agente 1 (AI_ACTIONS):", err);
      return { success: false, error: err.message };
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

    // Configurações Dinâmicas (Admin)
    const settings: any = await ctx.runQuery(internalAgents.getSquadConfigInternal);
    const config = settings || {};
    const regrasEscrita = settings?.promptAgente2 || config.value?.agente_2?.regras_escrita || PROMPT_AGENTE_02;
    const tomGlobal = settings?.tomGlobal || config.value?.tom_de_voz_global || "";

    console.log(`[Agente 2] Processando pauta ID: ${pendingPauta._id}`);
    const genAI = new GoogleGenerativeAI(apiKey);

    // Limpar a pauta para remover a tag de Pilar
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

      const carrossel = result.response.text();
      
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
        status: "failed"
      });
      return { success: false, message: err.message };
    }
  },
});
