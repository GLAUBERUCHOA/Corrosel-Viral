'use server';

import fs from 'fs';
import path from 'path';

export async function salvarConfiguracoes(formData: FormData) {
  try {
    const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
    const existingRules = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const novasRegras = {
      ...existingRules,
      contexto_squad: formData.get('contexto_squad'),
      tom_de_voz_global: formData.get('tom_de_voz_global'),
      agente_1: {
        ...existingRules.agente_1,
        prompt_noticias: formData.get('prompt_noticias'),
        prompt_perene: formData.get('prompt_perene')
      },
      agente_2: {
        ...existingRules.agente_2,
        regras_escrita: formData.get('regras_escrita')
      }
    };

    fs.writeFileSync(jsonPath, JSON.stringify(novasRegras, null, 2), 'utf8');

    return { success: true, message: 'Configurações salvas com sucesso!' };
  } catch (error) {
    console.error('Erro ao salvar squad rules:', error);
    return { success: false, message: 'Falha ao salvar o arquivo.' };
  }
}
