import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import ClientForm from './ClientForm';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import fs from 'fs';
import path from 'path';
import Sidebar from '../components/Sidebar';

export const dynamic = 'force-dynamic';
export default async function ConfiguracoesPage() {
  let adminConfig = null;

  const convexUrl = "https://impressive-lion-772.convex.cloud";
  
  try {
    if (convexUrl) {
      const convex = new ConvexHttpClient(convexUrl);
      const adminResult: any = await convex.query(api.agents.getAdminPrompts);
      
      if (adminResult && adminResult.value) adminConfig = adminResult.value;
    }
  } catch (error) {
    console.error('Erro ao ler configurações (Convex):', error);
  }

  // Falback para as regras antigas que constam no arquivo JSON local caso o Convex Admin esteja vazio
  if (!adminConfig) {
      try {
          const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
          if (fs.existsSync(jsonPath)) {
              adminConfig = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          }
      } catch (e) {
          console.error("Erro ao ler squad-rules.json", e);
      }
  }

  if (!adminConfig) adminConfig = { agente_1: {}, agente_2: {} };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-950 p-8 custom-scrollbar">
        <div className="container mx-auto max-w-5xl animate-in fade-in duration-500">
          <header className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase flex items-center gap-3">
                👑 Configurações Mestre
              </h1>
              <p className="text-slate-400 font-medium tracking-tight">Customização absoluta das instruções para drglauberabreu@gmail.com</p>
            </div>
            
            <Link href="/admin">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold flex items-center gap-2 shadow-sm">
                <LayoutDashboard className="h-4 w-4 text-amber-500" />
                Voltar Dashboard
              </Button>
            </Link>
          </header>

          <ClientForm adminConfig={adminConfig} />
        </div>
      </main>
    </div>
  );
}
