import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import ClientForm from './ClientForm';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';


export const dynamic = 'force-dynamic';
export default async function ConfiguracoesPage() {
  const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
  let config = null;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  
  try {
    if (convexUrl) {
      const convex = new ConvexHttpClient(convexUrl);
      const convexResult: any = await convex.query(api.agents.getSquadConfig);
      
      if (convexResult && convexResult.value) {
        config = convexResult.value;
      }
    }

    // Se não encontrou no Convex, tenta Prisma como backup secundário
    if (!config) {
      const prismaSetting = await prisma.promptSetting.findUnique({
        where: { toneKey: 'SQUAD_CONFIG' }
      }).catch(() => null); // Não deixa falha no Prisma travar a página
      
      if (prismaSetting && prismaSetting.instruction) {
        config = JSON.parse(prismaSetting.instruction);
      }
    }

    // Se ainda não encontrou, tenta o arquivo JSON local
    if (!config && fs.existsSync(jsonPath)) {
      config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao ler configurações (Convex/Prisma):', error);
  }

  if (!config) {
    return <div className="p-8">Arquivo de configuração não encontrado.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase flex items-center gap-3">
            ⚙️ Configurações da IA (Squad)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Controle central dos comportamentos, regras de pesquisa e copy dos agentes.</p>
        </div>
        
        <Link href="/curadoria">
          <Button variant="outline" className="border-slate-300 dark:border-slate-700 font-bold flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Voltar para Curadoria
          </Button>
        </Link>
      </header>

      <ClientForm initialConfig={config} />
    </div>
  );
}
