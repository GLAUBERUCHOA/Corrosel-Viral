import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-2.5-flash';

export async function gerarIdeias(nicho: string, tom: string, temasGerados: string[] = []) {
  try {
    if (!nicho || !tom) throw new Error('Nicho e tom de voz são obrigatórios.');

    // AGENTE 1: DIRETOR DE PAUTA (Módulos 1 a 4)
    // Foco em: Donas de casa, Fofoca Estratégica, Economia do cotidiano
    const promptPauta = `Você é o AGENTE 1: DIRETOR DE PAUTA (Especialista em Viralização no Instagram).
Seu treinamento é baseado no método de 7 Módulos de Conteúdo Viral.

OBJETIVO: Criar uma PAUTA DIGITAL disruptiva.
NICHO: ${nicho}
TOM DE VOZ: ${tom}
AUDIÊNCIA ALVO: Principalmente donas de casa e pessoas que buscam soluções práticas para o dia a dia.
ÂNCORES NARRATIVAS: Use a técnica da "Fofoca Estratégica" (curiosidade, segredos revelados) e "Economia do Cotidiano" (como economizar tempo ou dinheiro).

${temasGerados.length > 0 ? `TEMAS JÁ GERADOS NESTA RODADA (EVITE-OS): ${temasGerados.join(', ')}` : ''}

REGRAS DE OURO (Módulos 1-4):
1. Fuja do óbvio. Não pergunte "o que é X", mas sim "o segredo que ninguém te conta sobre X".
2. Use pautas que gerem indignação, curiosidade extrema ou economia imediata.
3. Responda apenas com a PAUTA (Título Provocativo + Objetivo Narrativo).`;

    const resultPauta = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents: promptPauta,
      config: { temperature: 0.9, topP: 0.95 }
    });
    const pauta = resultPauta.text || '';

    console.log('--- PAUTA RESTRUTURADA (AGENTE 1) ---');
    console.log(pauta);

    // AGENTE 2: DECODIFICADOR VIRAL (Módulos 5 a 7)
    const promptRoteiro = `Você é o AGENTE 2: DECODIFICADOR VIRAL E ROTEIRISTA SÊNIOR.
Receba a PAUTA: "${pauta}"
NICHO: ${nicho}
TOM DE VOZ: ${tom}

SUA MISSÃO: Transformar essa pauta em um roteiro de 5 slides magnéticos.
VOCÊ DEVE USAR OS MÓDULOS 5, 6 e 7 (Roteirização de Alta Retenção).

TAGS OBRIGATÓRIAS POR SLIDE:
[TÍTULO]: Em CAIXA ALTA, curto e impactante.
[SUBTÍTULO]: Texto narrativo que mantém o usuário lendo. Sem clichês robóticos.
[DIREÇÃO DE ARTE]: Prompt detalhado em inglês para IA de imagem, respeitando o nicho e composição (Top-Heavy).
[LEGENDA]: Copy viral completo para o post com CTA no final.

REGRAS (Módulos 5-7):
- Slide 1: O Gancho (A fofoca estratégica ou a dor da falta de economia).
- Slide 2, 3 e 4: O Conteúdo e a Solução.
- Slide 5: Chamada para Ação.
- PROIBIDO: Usar frases genéricas como "Em conclusão", "Esperamos que goste". Seja humano e direto.

FORMATO DE SAÍDA (Apenas JSON):
[
  { "slide": 1, "title": "[TÍTULO]", "subtitle": "[SUBTÍTULO]", "imagePrompt": "[DIREÇÃO DE ARTE]" },
  ... slides 2 a 5,
  { "legenda": "[LEGENDA]" }
]`;

    const resultRoteiro = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents: promptRoteiro,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    });

    const roteiroRaw = resultRoteiro.text || '';
    const roteiroParsed = JSON.parse(roteiroRaw);

    return {
      success: true,
      pauta: pauta,
      carrossel: roteiroParsed
    };

  } catch (error) {
    console.error('Erro na Service geradorCarrossel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro na geração treinada' };
  }
}
