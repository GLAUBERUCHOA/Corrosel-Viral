import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

// The MVP model
const MODEL_NAME = 'gemini-2.5-flash';

export async function gerarIdeias(nicho: string, tom: string) {
  try {
    if (!nicho || !tom) {
      throw new Error('Nicho e tom de voz são obrigatórios para gerar ideias.');
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('API Key do Gemini não está configurada no ambiente.');
    }

    console.log(`Iniciando geração para Nicho: "${nicho}" | Tom: "${tom}"`);

    // Passo A: Gerar a Ideia (temperature 0.8)
    const promptIdeia = `Você é um expert em marketing de conteúdo e copywriter viral.
Nicho de atuação: ${nicho}
Tom de voz: ${tom}

Gere UMA única ideia genial e altamente engajadora para um post estilo carrossel no Instagram, focada em entregar valor real e prender a atenção do público do início ao fim. 
Responda apenas com a ideia principal, de forma direta e sem firulas.`;

    const responseIdeia = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptIdeia,
      config: {
        temperature: 0.8,
      }
    });

    const ideiaGerada = responseIdeia.text;

    if (!ideiaGerada) {
      throw new Error('O Gemini não retornou nenhuma ideia no Passo A.');
    }

    console.log('Ideia Gerada com Sucesso:', ideiaGerada);

    // Passo B: Estruturar em 5 slides (temperature 0.4)
    const promptEstrutura = `Baseado na seguinte ideia central: "${ideiaGerada}"

Crie uma estrutura completa para um carrossel de 5 slides para o Instagram.
Mantenha o tom de voz: ${tom}.

O formato de saída DEVE ser estritamente em JSON válido seguindo a estrutura abaixo, sem marcação markdown e sem textos extras:
[
  { "slide": 1, "title": "Título chamativo do slide 1", "subtitle": "Subtítulo de apoio", "imagePrompt": "Prompt em inglês para gerar uma imagem relacionada" },
  { "slide": 2, "title": "...", "subtitle": "...", "imagePrompt": "..." },
  { "slide": 3, "title": "...", "subtitle": "...", "imagePrompt": "..." },
  { "slide": 4, "title": "...", "subtitle": "...", "imagePrompt": "..." },
  { "slide": 5, "title": "...", "subtitle": "Chamada para ação (CTA)", "imagePrompt": "..." }
]`;

    const responseEstrutura = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptEstrutura,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    });

    const conteudoJSON = responseEstrutura.text;
    
    if (!conteudoJSON) {
        throw new Error('O Gemini não retornou o JSON da estrutura no Passo B.');
    }

    // Apenas validar se é um JSON parseável
    const estruturaParsed = JSON.parse(conteudoJSON);

    return {
      success: true,
      ideiaOriginal: ideiaGerada,
      carrossel: estruturaParsed,
      rawConteudo: conteudoJSON
    };

  } catch (error) {
    console.error('Erro na Service geradorCarrossel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar ideias',
    };
  }
}
