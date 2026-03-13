import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-2.5-flash';

export async function gerarIdeias(nicho: string, tom: string, temasGerados: string[] = []) {
  try {
    if (!nicho || !tom) throw new Error('Nicho e tom de voz são obrigatórios.');

    // AGENTE 1: ESTRATEGISTA DE CONTEÚDO (PAUTA DIGITAL)
    const promptPauta = `Você é o AGENTE 1: ESTRATEGISTA DE CONTEÚDO VIRAL.
Seu objetivo é criar uma PAUTA DIGITAL disruptiva para um carrossel de Instagram.
Nicho: ${nicho}
Tom de voz: ${tom}
${temasGerados.length > 0 ? `TEMAS JÁ GERADOS NESTA RODADA (EVITE-OS): ${temasGerados.join(', ')}` : ''}

REGRAS:
1. Crie um tema que resolva uma dor real ou desejo ardente do público.
2. Foque em autoridade e retenção.
3. Responda apenas com a PAUTA (título sugerido e objetivo do post).`;

    const resultPauta = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents: promptPauta,
      config: { temperature: 0.8 }
    });
    const pauta = resultPauta.text || '';

    console.log('--- PAUTA GERADA (AGENTE 1) ---');
    console.log(pauta);

    // AGENTE 2: ROTEIRISTA DE CARROSSEIS (COPYWRITER)
    const promptRoteiro = `Você é o AGENTE 2: ROTEIRISTA DE CARROSSEIS.
Receba a PAUTA: "${pauta}"
Nicho: ${nicho}
Tom de voz: ${tom}

SUA MISSÃO: Transformar essa pauta em um roteiro de 5 slides de alta conversão.
Para CADA slide, siga RIGOROSAMENTE as tags: [TÍTULO], [SUBTÍTULO], [DIREÇÃO DE ARTE].
Ao final de todos os slides, adicione a tag [LEGENDA] para o post.

REGRAS DE OURO:
- [TÍTULO]: Deve ser magnético.
- [SUBTÍTULO]: Deve aprofundar a curiosidade ou entregar o valor.
- [DIREÇÃO DE ARTE]: Descrição detalhada da imagem (em inglês) para o gerador de imagens.
- [LEGENDA]: Copy persuasivo com call-to-action (CTA).

O formato de saída DEVE ser estritamente em JSON válido seguindo a estrutura abaixo:
[
  { "slide": 1, "title": "[TÍTULO]", "subtitle": "[SUBTÍTULO]", "imagePrompt": "[DIREÇÃO DE ARTE]" },
  ... até slide 5,
  { "legenda": "[LEGENDA]" }
]`;

    const resultRoteiro = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents: promptRoteiro,
      config: {
        temperature: 0.4,
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
    return { success: false, error: error instanceof Error ? error.message : 'Erro na geração' };
  }
}
