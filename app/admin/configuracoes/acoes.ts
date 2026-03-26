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
    
    // First try Database
    const setting = await prisma.promptSetting.findUnique({
      where: { toneKey: 'SQUAD_CONFIG' }
    });
    
    if (setting && setting.instruction) {
      existingRules = JSON.parse(setting.instruction);
    } else if (fs.existsSync(jsonPath)) {
      // Fallback to local default file
      existingRules = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    const novasRegras = {
      ...existingRules,
      contexto_squad: formData.get('contexto_squad'),
      tom_de_voz_global: formData.get('tom_de_voz_global'),
      agente_1: {
        ...(existingRules.agente_1 || {}),
        prompt_diretor: formData.get('prompt_diretor')
      },
      agente_2: {
        ...(existingRules.agente_2 || {}),
        regras_escrita: formData.get('regras_escrita')
      }
    };

    // 3. Save to Database (Prisma / MySQL)
    await prisma.promptSetting.upsert({
      where: { toneKey: 'SQUAD_CONFIG' },
      update: { instruction: JSON.stringify(novasRegras) },
      create: { 
        toneKey: 'SQUAD_CONFIG', 
        label: 'Squad AI Configuration', 
        instruction: JSON.stringify(novasRegras) 
      }
    });
    
    // 4. Sincronização com Convex (Backend dos Agentes)
    // Usamos um bloco separado para garantir que falhas no Convex não travem o Admin
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.agents.saveSquadConfig, { value: novasRegras });
      } catch (e) {
        console.error('Erro na sincronização Convex:', e);
      }
    } else {
      console.warn('Sincronização Convex pulada: NEXT_PUBLIC_CONVEX_URL não encontrada.');
    }

    return { success: true, message: 'Configurações salvas e sincronizadas com sucesso!' };
  } catch (error) {
    console.error('Erro ao salvar squad rules:', error);
    return { success: false, message: 'Falha ao salvar as configurações.' };
  }
}
