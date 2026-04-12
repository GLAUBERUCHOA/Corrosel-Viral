'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { salvarConfiguracoes } from '../configuracoes/acoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Info, Globe, Search, FileText, Loader2, Users } from 'lucide-react';

export default function ClientFormSaas({ clientConfig }: { clientConfig: any }) {
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const currentConfig = clientConfig || { agente_1: {}, agente_2: {} };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('keyName', 'CLIENT_PROMPTS'); 

    const res = await salvarConfiguracoes(formData);

    setSalvando(false);
    
    if (res.success) {
      router.refresh();
      alert('Regras do SaaS salvas com sucesso!');
    } else {
      alert('Houve um erro: ' + res.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-8">
         <Users className="w-8 h-8 text-blue-500 mr-3" />
         <div>
            <h2 className="text-blue-500 font-bold text-lg">Área do SaaS (Clientes Comuns)</h2>
            <p className="text-slate-400 text-sm">Estas regras afetam todos os usuários. Mantenha os prompts limpos, sem gírias agressivas ou exemplos pessoais do admin.</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2">
          
        {/* SEÇÃO GERAL */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-slate-500/30">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Globe className="h-6 w-6 text-blue-500" />
              Configurações Globais (SAAS)
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Contexto e formato base entregue aos seus clientes.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Contexto do Squad (SaaS)</Label>
              <Textarea 
                name="contexto_squad" 
                defaultValue={currentConfig.contextoSquad || currentConfig.contexto_squad || ''} 
                className="min-h-[120px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Tom de Voz Principal (SaaS)</Label>
              <Textarea 
                name="tom_de_voz_global" 
                defaultValue={currentConfig.tomGlobal || currentConfig.tom_de_voz_global || ''} 
                className="min-h-[100px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* AGENTE 1 */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-blue-500/30">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-blue-400">
              <Search className="h-6 w-6" />
              Agente 1: Diretor de Pauta (SaaS)
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Técnicas de busca genéricas e estruturadas para o cliente do laboratório.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea 
              name="prompt_diretor" 
              defaultValue={currentConfig.promptAgente1 || currentConfig.agente_1?.prompt_diretor || currentConfig.agente_1?.prompt_noticias || ''} 
              className="min-h-[350px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:border-blue-400"
            />
          </CardContent>
        </Card>

        {/* AGENTE 2 */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-blue-500/30">
          <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-blue-500">
              <FileText className="h-6 w-6" />
              Agente 2: Roteirista Viral (SaaS)
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Instruções de formatação JSON rígida e estrutura de Carrossel para clientes.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea 
              name="regras_escrita" 
              defaultValue={currentConfig.promptAgente2 || currentConfig.agente_2?.regras_escrita || ''} 
              className="min-h-[400px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:border-blue-500"
            />
            <div className="mt-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-3">
              <Info className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-xs text-orange-200/60 font-medium uppercase tracking-tighter">
                  MUITO IMPORTANTE: OBRIGUE A SAÍDA A MANTER TAGS [TÍTULO], [SUBTÍTULO], [DIREÇÃO DE ARTE] E [LEGENDA]
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FLOATING ACTION BAR */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl shadow-2xl flex justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] pl-4 font-bold flex flex-col leading-tight hidden sm:flex">
              <span>SALVANDO REGRA:</span>
              <span className="text-blue-500">SAAS CLIENTS</span>
            </p>
            <Button 
              type="submit" 
              disabled={salvando}
              className="h-14 px-10 rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95 flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white"
            >
              {salvando ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Save className="mr-2 h-6 w-6" />
              )}
              {salvando ? 'Salvando...' : 'SALVAR REGRAS SAAS'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
