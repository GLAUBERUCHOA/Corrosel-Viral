'use client';

import { useTransition } from 'react';
import { handleAprovar, handleDescartar } from './actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CuradoriaItemProps {
  item: any;
}

export default function CuradoriaItem({ item }: CuradoriaItemProps) {
  const [isPending, startTransition] = useTransition();

  const conteudoBruto = (typeof item.conteudo === 'string' ? JSON.parse(item.conteudo) : item.conteudo) || [];
  // Tratamento de segurança para diferentes formatos de JSON devolvidos pela GenAI
  const isArray = Array.isArray(conteudoBruto);
  const conteudoOriginal = isArray ? conteudoBruto : [conteudoBruto];
  
  // Vamos buscar o primeiro item real que a IA gerou
  const possibleObject = conteudoOriginal[0] || {};
  
  let titulo = 'Título Indisponível';
  let subtitulo = 'Sem subtítulo';
  let quantSlides = 0;

  // Formato GenAI Desviante 1 (Objeto com chaves 'SLIDE 01')
  if (possibleObject['SLIDE 01'] || possibleObject['SLIDE 1']) {
    const s1 = possibleObject['SLIDE 01'] || possibleObject['SLIDE 1'];
    titulo = s1['TÍTULO'] || s1['TITLE'] || s1.title || titulo;
    subtitulo = s1['SUBTÍTULO'] || s1['SUBTITLE'] || s1.subtitle || subtitulo;
    quantSlides = Object.keys(possibleObject).filter(k => k.toLowerCase().includes('slide') && !k.toLowerCase().includes('legenda')).length;
  }
  // Formato Desviante 2 ({ title: '', slides: [] })
  else if (Array.isArray(possibleObject.slides)) {
    const s1 = possibleObject.slides[0] || {};
    titulo = s1.title || s1['TÍTULO'] || possibleObject.title || titulo;
    subtitulo = s1.subtitle || s1['SUBTÍTULO'] || subtitulo;
    quantSlides = possibleObject.slides.length;
  } 
  // Formato Estrito Original ({ slide: 1, title: '...', subtitle: '...' })
  else {
    const s1 = conteudoOriginal.find((s: any) => String(s.slide).includes('1')) || possibleObject;
    titulo = s1.title || s1['TÍTULO'] || titulo;
    subtitulo = s1.subtitle || s1['SUBTÍTULO'] || subtitulo;
    quantSlides = isArray ? conteudoOriginal.length : Object.keys(possibleObject).length;
  }

  const onAprovar = () => {
    if (confirm('Aprovar e preparar para geração?')) {
      startTransition(async () => {
        const result = await handleAprovar(item.id);
        if (!result.success) alert(result.error);
      });
    }
  };

  const onDescartar = () => {
    if (confirm('Tem certeza que deseja descartar esta ideia?')) {
      startTransition(async () => {
        const result = await handleDescartar(item.id);
        if (!result.success) alert(result.error);
      });
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isPending ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-md'}`}>
      
      {/* Header do Card */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          {isPending ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
              Processando...
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> 
              Pendente de Avaliação
            </>
          )}
        </span>
        <span className="text-xs font-semibold text-slate-400">
          Gerado em: {format(new Date(item.criado_em), "dd 'de' MMMM, 'às' HH:mm", { locale: ptBR })}
        </span>
      </div>

      {/* Corpo do Card */}
      <div className="px-6 py-6 flex flex-col sm:flex-row gap-6 justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 leading-snug mb-2">
            {titulo}
          </h2>
          <p className="text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {subtitulo}
          </p>
          
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              {quantSlides} Slides Mapeados
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex sm:flex-col gap-3 justify-center sm:min-w-[180px] w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={onAprovar}
            disabled={isPending}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {isPending ? 'Aprovando...' : 'Aprovar & Gerar'}
          </button>
          <button 
            onClick={onDescartar}
            disabled={isPending}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 transition-colors focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
