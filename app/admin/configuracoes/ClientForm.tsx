'use client';

import { useState } from 'react';
import { salvarConfiguracoes } from './acoes';
import { useRouter } from 'next/navigation';

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
      alert(res.message);
      router.refresh();
    } else {
      alert('Houve um erro: ' + res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-indigo-500">public</span> Geral
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Contexto do Squad</label>
            <textarea 
              name="contexto_squad" 
              defaultValue={initialConfig.contexto_squad} 
              className="w-full h-24 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ex: Lembrete para o Squad... O público alvo... Proibição de cliques de marketing.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Tom de Voz Global</label>
            <textarea 
              name="tom_de_voz_global" 
              defaultValue={initialConfig.tom_de_voz_global} 
              className="w-full h-20 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-orange-500">manage_search</span> Agente 1 (Pesquisador / Pauta)
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Regras para Notícias (Quente)</label>
            <textarea 
              name="prompt_noticias" 
              defaultValue={initialConfig.agente_1.prompt_noticias} 
              className="w-full h-40 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Esta regra é combinada com o uso do Google Search automático da API no lote ímpar.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Regras para Temas Perenes</label>
            <textarea 
              name="prompt_perene" 
              defaultValue={initialConfig.agente_1.prompt_perene} 
              className="w-full h-40 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Comportamentos e dores recorrentes (lote par).</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-emerald-500">edit_square</span> Agente 2 (Roteirista / Copywriter)
        </h2>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Instrução Central (Módulos 1 a 7 e Limitações)</label>
          <textarea 
            name="regras_escrita" 
            defaultValue={initialConfig.agente_2.regras_escrita} 
            className="w-full h-80 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
          />
          <p className="mt-2 text-xs text-amber-600 font-bold">ATENÇÃO: Mantenha as tags obrigatórias [TÍTULO], [SUBTÍTULO], [DIREÇÃO DE ARTE] e [LEGENDA] exatamente como estão.</p>
        </div>
      </div>

      <div className="sticky bottom-6 bg-slate-900 border border-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-xl z-10 w-full animate-in slide-in-from-bottom">
        <p className="text-white text-sm font-medium">Lembre-se: as alterações têm efeito imediato na IA.</p>
        <button 
          type="submit" 
          disabled={salvando}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-3 rounded-lg flex gap-2 items-center transition disabled:opacity-50"
        >
          {salvando ? (
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-sm">save</span>
          )}
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

    </form>
  );
}
