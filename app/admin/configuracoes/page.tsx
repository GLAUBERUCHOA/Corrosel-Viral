import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import ClientForm from './ClientForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
  let config = null;

  try {
    const setting = await prisma.promptSetting.findUnique({
      where: { toneKey: 'SQUAD_CONFIG' }
    });
    
    if (setting && setting.instruction) {
      config = JSON.parse(setting.instruction);
    } else if (fs.existsSync(jsonPath)) {
      config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao ler configurações:', error);
  }

  if (!config) {
    return <div className="p-8">Arquivo de configuração não encontrado.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">⚙️ Configurações da IA (Squad)</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Controle central dos comportamentos, regras de pesquisa e copy dos agentes.</p>
      </header>

      <ClientForm initialConfig={config} />
    </div>
  );
}
