'use server';

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";


export async function salvarConfiguracoes(formData: FormData) {
  try {
    const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
    let existingRules: any = {};
    
    const convexUrl = "https://impressive-lion-772.convex.cloud";

    // 1. Prioritize reading from Convex
    try {
      if (convexUrl) {
        const convex = new ConvexHttpClient(convexUrl);
        const convexResult: any = await convex.query(api.agents.getSquadConfig);
        if (convexResult && convexResult.value) {
          existingRules = convexResult.value;
        }
      }
    } catch (e) {
      console.warn('⚠️ Falha ao ler do Convex no início, tentando fallback local...', e);
    }

    // 2. If Convex was empty or failed, use local JSON fallback
    if (Object.keys(existingRules).length === 0 && fs.existsSync(jsonPath)) {
      existingRules = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    const novasRegras = {
      ...existingRules,
      contexto_squad: formData.get('contexto_squad'),
      tom_de_voz_global: formData.get('tom_de_voz_global'),
      nicho: formData.get('nicho'),
      publicoAlvo: formData.get('publicoAlvo'),
      objetivo: formData.get('objetivo'),
      cta: formData.get('cta'),
      agente_1: {
        ...(existingRules.agente_1 || {}),
        prompt_diretor: formData.get('prompt_diretor')
      },
      agente_2: {
        ...(existingRules.agente_2 || {}),
        regras_escrita: formData.get('regras_escrita')
      }
    };

    // 3. Save to Database (Prisma / MySQL) - Usamos try/catch para não travar o processo
    try {
      await prisma.promptSetting.upsert({
        where: { toneKey: 'SQUAD_CONFIG' },
        update: { instruction: JSON.stringify(novasRegras) },
        create: { 
          toneKey: 'SQUAD_CONFIG', 
          label: 'Squad AI Configuration', 
          instruction: JSON.stringify(novasRegras) 
        }
      });
    } catch (prismaError) {
      console.warn('⚠️ Falha ao salvar no Prisma (Backup), continuando para o Convex...', prismaError);
    }
    
    // 4. Sincronização com Convex (Backend dos Agentes)
    
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        
        // Enviamos seguindo a nova estrutura flat solicitada para facilitar auditoria
        const syncData = {
          promptAgente1: novasRegras.agente_1?.prompt_diretor?.toString() || "",
          promptAgente2: novasRegras.agente_2?.regras_escrita?.toString() || "",
          contextoSquad: novasRegras.contexto_squad?.toString() || "",
          tomGlobal: novasRegras.tom_de_voz_global?.toString() || "",
          value: novasRegras // backup da estrutura completa
        };

        console.log('--- INICIANDO SINCRONIZAÇÃO CONVEX ---');
        console.log('URL:', convexUrl);
        
        const result = await convex.mutation(api.agents.saveSquadConfig, syncData);
        
        console.log('✅ RESULTADO DA MUTAÇÃO:', result);
        console.log('✅ Sincronização Convex concluída com sucesso.');
      } catch (e: any) {
        console.error('❌ ERRO DETALHADO NA SINCRONIZAÇÃO CONVEX:', e);
        return { 
          success: false, 
          message: `Erro na sincronização: ${e.message || 'Erro desconhecido'}. Verifique os logs do servidor.` 
        };
      }
    } else {
      console.error('❌ ERRO: NEXT_PUBLIC_CONVEX_URL não configurada em ambiente de servidor.');
      return { success: false, message: 'URL do Convex não encontrada no ambiente.' };
    }

    return { success: true, message: 'Configurações salvas e injetadas no Convex com sucesso!' };
  } catch (error) {
    console.error('Erro ao salvar squad rules:', error);
    return { success: false, message: 'Falha ao salvar as configurações.' };
  }
}
