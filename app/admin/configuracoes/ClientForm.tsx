'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { salvarConfiguracoes } from './acoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Info, Globe, Search, FileText, Loader2, Settings } from 'lucide-react';

export default function ClientForm({ initialConfig }: { initialConfig: any }) {
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    
    const formData = new FormData(event.currentTarget);
    const res = await salvarConfiguracoes(formData);

    setSalvando(false);
    
    if (res.success) {
      router.refresh();
      alert('Configurações salvas com sucesso!');
    } else {
      alert('Houve um erro: ' + res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-32">
      
      {/* PERFIL DO ESPECIALISTA (SETUP) */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-blue-500/30">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-500" />
            Perfil do Especialista
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">Configure o perfil dinâmico da IA para a sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Seu Nicho de Atuação</Label>
              <input 
                name="nicho"
                defaultValue={initialConfig.nicho || ''}
                placeholder="Ex: Imóveis de Alto Padrão..."
                className="w-full flex h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Público-Alvo (Persona)</Label>
              <input 
                name="publicoAlvo"
                defaultValue={initialConfig.publicoAlvo || ''}
                placeholder="Ex: Médicos recém-formados..."
                className="w-full flex h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Objetivo do Carrossel</Label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
               <select 
                 name="objetivo"
                 defaultValue={initialConfig.objetivo || 'atracao'}
                 className="w-full bg-transparent h-10 px-3 outline-none font-bold text-slate-200"
               >
                 <option value="atracao" className="bg-slate-950 text-white">🧲 Atração</option>
                 <option value="engajamento" className="bg-slate-950 text-white">💬 Engajamento</option>
                 <option value="conversao" className="bg-slate-950 text-white">💰 Conversão</option>
               </select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Chamada de Ação (CTA Oficial)</Label>
            <input 
              name="cta"
              defaultValue={initialConfig.cta || ''}
              placeholder="Ex: Clica no link da bio..."
              className="w-full flex h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO GERAL */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-blue-500/30">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-500" />
            Configurações Globais
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">Contexto básico e tom de voz que os dois agentes compartilham.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Contexto do Squad (Público & Regras)</Label>
            <Textarea 
              name="contexto_squad" 
              defaultValue={initialConfig.contexto_squad} 
              className="min-h-[120px] bg-slate-950/50 border-slate-800 focus:border-blue-500 font-mono text-blue-50"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Tom de Voz Principal</Label>
            <Textarea 
              name="tom_de_voz_global" 
              defaultValue={initialConfig.tom_de_voz_global} 
              className="min-h-[100px] bg-slate-950/50 border-slate-800 focus:border-blue-500 font-mono text-blue-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* AGENTE 1 */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-amber-500/30">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
          <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-500">
            <Search className="h-6 w-6" />
            Agente 1: Diretor de Pauta
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">Instruções para a etapa de pesquisa no Tavily e escolha da notícia disruptiva.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Textarea 
            name="prompt_diretor" 
            defaultValue={initialConfig.agente_1.prompt_diretor || initialConfig.agente_1.prompt_noticias || ''} 
            className="min-h-[350px] bg-slate-950/50 border-slate-800 focus:border-amber-500 font-mono text-blue-50"
          />
        </CardContent>
      </Card>

      {/* AGENTE 2 */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-emerald-500/30">
        <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
          <CardTitle className="text-xl font-black flex items-center gap-3 text-emerald-500">
            <FileText className="h-6 w-6" />
            Agente 2: Roteirista Viral
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">Técnicas de Copywriting e estruturação JSON dos slides magnéticos.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Textarea 
            name="regras_escrita" 
            defaultValue={initialConfig.agente_2.regras_escrita} 
            className="min-h-[400px] bg-slate-950/50 border-slate-800 focus:border-emerald-500 font-mono text-blue-50"
          />
          <div className="mt-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-3">
             <Info className="h-5 w-5 text-orange-500 shrink-0" />
             <p className="text-xs text-orange-200/60 font-medium uppercase tracking-tighter">
                MANTER TAGS [TÍTULO], [SUBTÍTULO], [DIREÇÃO DE ARTE] E [LEGENDA]
             </p>
          </div>
        </CardContent>
      </Card>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl shadow-2xl flex justify-between items-center gap-6">
          <p className="text-slate-400 text-xs pl-4 font-bold flex flex-col">
            <span>MODO EDIÇÃO</span>
            <span className="text-blue-500">AÇÕES IMEDIATAS</span>
          </p>
          <Button 
            type="submit" 
            disabled={salvando}
            className="bg-blue-600 hover:bg-blue-500 h-14 px-10 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 hover:scale-105 active:scale-95"
          >
            {salvando ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <Save className="mr-2 h-6 w-6" />
            )}
            {salvando ? 'Salvando...' : 'SALVAR REGRAS'}
          </Button>
        </div>
      </div>

    </form>
  );
}
