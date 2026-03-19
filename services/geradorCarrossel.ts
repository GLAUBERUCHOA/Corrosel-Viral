import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });

// Agent 1 (Pesquisador): Flash é ideal para busca rápida.
const MODEL_AGENT_1 = 'gemini-2.5-flash';
// Agent 2 (Copywriter): Pro entrega copywriting de alto nível.
const MODEL_AGENT_2 = 'gemini-2.5-pro';

async function loadSquadRules() {
  try {
    const setting = await prisma.promptSetting.findUnique({
      where: { toneKey: 'SQUAD_CONFIG' }
    });
    if (setting && setting.instruction) {
      return JSON.parse(setting.instruction);
    }
  } catch (err) {
    console.warn('Erro ao ler do BD, caindo para fallback local:', err);
  }

  const rulesPath = path.join(process.cwd(), 'config', 'squad-rules.json');
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

export async function gerarIdeias(tipo: 'noticias' | 'perene', temasGerados: string[] = []) {
  try {
    const rules = await loadSquadRules();
    const isNoticia = tipo === 'noticias';

    const basePrompt = rules.agente_1.prompt_diretor || (isNoticia ? rules.agente_1.prompt_noticias : rules.agente_1.prompt_perene);

    const temasRestricao = temasGerados.length > 0 
      ? `\nTEMAS JÁ GERADOS NESTA RODADA (EVITE-OS OBRIGATORIAMENTE): ${temasGerados.join(', ')}` 
      : '';

    const instrucaoInvisivel = '\n\nIGNORE A ETAPA DE CURADORIA (esperar aprovação) E A MENSAGEM DE INICIAÇÃO: Como você está em um sistema automatizado de lote, sua tarefa é entregar diretamente a pauta final para o Agente 2 conforme os critérios dos 4 Pilares.';

    const pautaSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_1.pesquisador}\n\n${basePrompt}${temasRestricao}${instrucaoInvisivel}`;

    console.log(`--- INICIANDO AGENTE 1 (${tipo.toUpperCase()}) --- Key: ${!!process.env.NEXT_PUBLIC_GEMINI_API_KEY}`);

    // AGENTE 1: PESQUISADOR E DIRETOR DE PAUTA
    const reqPautaOptions: any = {
      model: MODEL_AGENT_1,
      contents: pautaSetup,
      config: { 
        temperature: 0.7, 
        topP: 0.95,
        tools: isNoticia ? [{ googleSearch: {} }] : []
      }
    };

    let pauta = '';
    try {
      const resultPauta = await (ai as any).models.generateContent(reqPautaOptions);
      // Tentativa robusta de extração de texto
      pauta = resultPauta.text || resultPauta.response?.text || (resultPauta as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!pauta) throw new Error('O modelo retornou uma resposta vazia (Agente 1).');

      console.log(`--- SQUAD AGENTE 1: DIRETOR DE PAUTA SUCESSO ---`);
    } catch (agent1Error: any) {
      const errorMsg = agent1Error?.message || String(agent1Error);
      console.error(`--- ERRO AGENTE 1 ---`, errorMsg);
      return { success: false, error: `Falha no Agente 1 (Pesquisa): ${errorMsg}` };
    }

    // AGENTE 2: ROTEIRISTA E COPYWRITER VIRAL
    const roteiroSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_2.roteirista}\n\n[PAUTA]:\n${pauta}\n\n${rules.agente_2.regras_escrita}`;

    let roteiroParsed;
    try {
      const resultRoteiro = await (ai as any).models.generateContent({
        model: MODEL_AGENT_2,
        contents: roteiroSetup,
        config: {
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });

      const roteiroRaw = resultRoteiro.text || resultRoteiro.response?.text || (resultRoteiro as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      roteiroParsed = roteiroRaw.trim();
      
      if (!roteiroParsed) throw new Error('O modelo retornou uma resposta vazia (Agente 2).');
      
      console.log(`--- SQUAD AGENTE 2: ROTEIRISTA SUCESSO ---`);
    } catch (agent2Error: any) {
      const errorMsg = agent2Error?.message || String(agent2Error);
      console.error(`--- ERRO AGENTE 2 ---`, errorMsg);
      return { success: false, error: `Falha no Agente 2 (Escrita): ${errorMsg}` };
    }

    return {
      success: true,
      pauta: pauta,
      carrossel: roteiroParsed
    };

  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Erro geral na Service geradorCarrossel (Squad):', errorMsg);
    return { success: false, error: `Erro no Squad: ${errorMsg}` };
  }
}

