import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-2.5-flash';

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

    const basePrompt = rules.agente_1.prompt_diretor;

    const temasRestricao = temasGerados.length > 0 
      ? `\nTEMAS JÁ GERADOS NESTA RODADA (EVITE-OS OBRIGATORIAMENTE): ${temasGerados.join(', ')}` 
      : '';

    const instrucaoInvisivel = '\n\nIGNORE A ETAPA DE CURADORIA (esperar aprovação) E A MENSAGEM DE INICIAÇÃO: Como você está em um sistema automatizado de lote, sua tarefa é entregar diretamente a pauta final para o Agente 2 conforme os critérios dos 4 Pilares.';

    const pautaSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_1.pesquisador}\n\n${basePrompt}${temasRestricao}${instrucaoInvisivel}`;

    // AGENTE 1: PESQUISADOR E DIRETOR DE PAUTA
    const reqPautaOptions: any = {
      model: MODEL_NAME,
      contents: pautaSetup,
      config: { temperature: 0.9, topP: 0.95 }
    };

    if (isNoticia) {
      reqPautaOptions.config.tools = [{ googleSearch: {} }];
    }

    let pauta = '';
    try {
      const resultPauta = await (ai as any).models.generateContent(reqPautaOptions);
      pauta = resultPauta.text || '';
      console.log(`--- SQUAD AGENTE 1: DIRETOR DE PAUTA (${tipo.toUpperCase()}) --- (SUCESSO)`);
    } catch (agent1Error) {
      console.error(`--- ERRO SQUAD AGENTE 1 (${tipo.toUpperCase()}) --- Falha na busca ou geração da pauta.`);
      console.error(agent1Error);
      return { success: false, error: 'Agent 1 (Search/Pauta) failed.' };
    }

    // AGENTE 2: ROTEIRISTA E COPYWRITER VIRAL
    const roteiroSetup = `${rules.contexto_squad}\n\n${rules.tom_de_voz_global}\n\n${rules.agente_2.roteirista}\n\n[PAUTA]:\n${pauta}\n\n${rules.agente_2.regras_escrita}`;

    let roteiroParsed;
    try {
      const resultRoteiro = await (ai as any).models.generateContent({
        model: MODEL_NAME,
        contents: roteiroSetup,
        config: {
          temperature: 0.5
          // Agente 2 PROIBIDO de usar ferramentas (tools), foca 100% no texto.
        }
      });

      const roteiroRaw = resultRoteiro.text || '';
      roteiroParsed = roteiroRaw.trim();
      
      console.log(`--- SQUAD AGENTE 2: ROTEIRISTA --- (SUCESSO NO TEXTO)`);
    } catch (agent2Error) {
      console.error(`--- ERRO SQUAD AGENTE 2 --- Falha na geração do roteiro ou no parseamento do JSON.`);
      console.error(agent2Error);
      return { success: false, error: 'Agent 2 (Script/Text) failed.' };
    }

    return {
      success: true,
      pauta: pauta,
      carrossel: roteiroParsed
    };

  } catch (error) {
    console.error('Erro geral na Service geradorCarrossel (Squad):', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro no Squad' };
  }
}

