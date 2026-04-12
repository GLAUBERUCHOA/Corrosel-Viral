'use server';

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";


export async function salvarConfiguracoes(formData: FormData) {
  try {
    const convexUrl = "https://impressive-lion-772.convex.cloud";
    const keyName = formData.get('keyName') as string || 'ADMIN_PROMPTS';

    const novasRegras = {
      contexto_squad: formData.get('contexto_squad'),
      tom_de_voz_global: formData.get('tom_de_voz_global'),
      agente_1: {
        prompt_diretor: formData.get('prompt_diretor')
      },
      agente_2: {
        regras_escrita: formData.get('regras_escrita')
      }
    };
    
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        
        const syncData = {
          keyName: keyName, // 'ADMIN_PROMPTS' ou 'CLIENT_PROMPTS'
          promptAgente1: novasRegras.agente_1?.prompt_diretor?.toString() || "",
          promptAgente2: novasRegras.agente_2?.regras_escrita?.toString() || "",
          contextoSquad: novasRegras.contexto_squad?.toString() || "",
          tomGlobal: novasRegras.tom_de_voz_global?.toString() || "",
          value: novasRegras // backup da estrutura completa
        };

        console.log(`--- INICIANDO SALVAMENTO PARA: ${keyName} ---`);
        
        const result = await convex.mutation(api.agents.savePromptConfig, syncData);
        
        console.log('✅ Sincronização Convex concluída com sucesso.');
      } catch (e: any) {
        console.error('❌ ERRO DETALHADO NA SINCRONIZAÇÃO CONVEX:', e);
        return { 
          success: false, 
          message: `Erro na sincronização: ${e.message || 'Erro desconhecido'}.` 
        };
      }
    } else {
      return { success: false, message: 'URL do Convex não encontrada no ambiente.' };
    }

    return { success: true, message: 'Configurações salvas e injetadas no Convex com sucesso!' };
  } catch (error) {
    console.error('Erro ao salvar squad rules:', error);
    return { success: false, message: 'Falha ao salvar as configurações.' };
  }
}

