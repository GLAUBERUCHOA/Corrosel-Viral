import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { salvarConfiguracoes } from './acoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Info, Globe, Search, FileText, Loader2, Crown, Users } from 'lucide-react';

export default function ClientForm({ adminConfig, clientConfig }: { adminConfig: any; clientConfig: any }) {
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState<'ADMIN_PROMPTS' | 'CLIENT_PROMPTS'>('ADMIN_PROMPTS');
  const router = useRouter();

  const currentConfig = activeTab === 'ADMIN_PROMPTS' ? adminConfig : clientConfig;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('keyName', activeTab); // Define exatamente qual cérebro vai ser salvo

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
    <div className="space-y-6">
      {/* TABS HEADER */}
      <div className="flex gap-4 p-2 bg-slate-900 rounded-2xl border border-slate-800 w-fit mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('ADMIN_PROMPTS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'ADMIN_PROMPTS'
              ? 'bg-amber-500 text-slate-900 shadow-lg scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Crown className="w-5 h-5" />
          🧠 Prompts Mestre (Admin)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CLIENT_PROMPTS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'CLIENT_PROMPTS'
              ? 'bg-blue-500 text-white shadow-lg scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          👥 Prompts Limpos (SaaS)
        </button>
      </div>

      <div className="text-center pb-4">
        {activeTab === 'ADMIN_PROMPTS' ? (
           <p className="text-amber-500/80 font-medium text-sm">Estas regras afetam apenas as pautas geradas no painel pelo Administrador (drglauberabreu@gmail.com).</p>
        ) : (
           <p className="text-blue-400/80 font-medium text-sm">Estas regras afetam todos os usuários comuns do app SaaS. Mantenha-as neutras e focadas puramente na estrutura.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-32">
        {/* Usamos key no formulário para forçar o re-render dos Textareas quando a Tab muda */}
        <div key={activeTab} className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          
          {/* SEÇÃO GERAL */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-slate-500/30">
            <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Globe className={`h-6 w-6 ${activeTab === 'ADMIN_PROMPTS' ? 'text-amber-500' : 'text-blue-500'}`} />
                Configurações Globais
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium">Contexto básico e tom de voz compartilhado entre agentes.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Contexto do Squad (Público & Regras)</Label>
                <Textarea 
                  name="contexto_squad" 
                  defaultValue={currentConfig.contextoSquad || currentConfig.contexto_squad || ''} 
                  className={`min-h-[120px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:${activeTab === 'ADMIN_PROMPTS' ? 'border-amber-500' : 'border-blue-500'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-slate-500">Tom de Voz Principal</Label>
                <Textarea 
                  name="tom_de_voz_global" 
                  defaultValue={currentConfig.tomGlobal || currentConfig.tom_de_voz_global || ''} 
                  className={`min-h-[100px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:${activeTab === 'ADMIN_PROMPTS' ? 'border-amber-500' : 'border-blue-500'}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* AGENTE 1 */}
          <Card className={`border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-${activeTab === 'ADMIN_PROMPTS' ? 'amber' : 'blue'}-500/30`}>
            <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
              <CardTitle className={`text-xl font-black flex items-center gap-3 ${activeTab === 'ADMIN_PROMPTS' ? 'text-amber-400' : 'text-blue-400'}`}>
                <Search className="h-6 w-6" />
                Agente 1: Diretor de Pauta
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium">Instruções para a pesquisa da notícia.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Textarea 
                name="prompt_diretor" 
                defaultValue={currentConfig.promptAgente1 || currentConfig.agente_1?.prompt_diretor || currentConfig.agente_1?.prompt_noticias || ''} 
                className={`min-h-[350px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:${activeTab === 'ADMIN_PROMPTS' ? 'border-amber-400' : 'border-blue-400'}`}
              />
            </CardContent>
          </Card>

          {/* AGENTE 2 */}
          <Card className={`border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl overflow-hidden transition-all hover:border-${activeTab === 'ADMIN_PROMPTS' ? 'amber' : 'emerald'}-500/30`}>
            <CardHeader className="bg-slate-900/50 border-b border-slate-800/50">
              <CardTitle className={`text-xl font-black flex items-center gap-3 ${activeTab === 'ADMIN_PROMPTS' ? 'text-amber-500' : 'text-emerald-500'}`}>
                <FileText className="h-6 w-6" />
                Agente 2: Roteirista Viral
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium">Técnicas de Copy e estruturação JSON.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Textarea 
                name="regras_escrita" 
                defaultValue={currentConfig.promptAgente2 || currentConfig.agente_2?.regras_escrita || ''} 
                className={`min-h-[400px] bg-slate-950/50 border-slate-800 font-mono text-blue-50 focus:${activeTab === 'ADMIN_PROMPTS' ? 'border-amber-500' : 'border-emerald-500'}`}
              />
              <div className="mt-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-3">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-200/60 font-medium uppercase tracking-tighter">
                    MANTER TAGS [TÍTULO], [SUBTÍTULO], [DIREÇÃO DE ARTE] E [LEGENDA]
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FLOATING ACTION BAR */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl shadow-2xl flex justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] pl-4 font-bold flex flex-col leading-tight hidden sm:flex">
              <span>SALVANDO REGRA:</span>
              <span className={activeTab === 'ADMIN_PROMPTS' ? 'text-amber-500' : 'text-blue-500'}>
                {activeTab === 'ADMIN_PROMPTS' ? 'MESTRE ACESS' : 'SAAS CLIENTS'}
              </span>
            </p>
            <Button 
              type="submit" 
              disabled={salvando}
              className={`h-14 px-10 rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95 flex-1 sm:flex-none ${
                activeTab === 'ADMIN_PROMPTS' 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 text-slate-900' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white'
              }`}
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
    </div>
  );
}
