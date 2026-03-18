'use client';

import { useState, useTransition } from 'react';
import { handleAprovar, handleDescartar } from './actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CuradoriaItemProps {
  item: any;
}

export default function CuradoriaItem({ item }: CuradoriaItemProps) {
  const [isPending, startTransition] = useTransition();
  const [showRaw, setShowRaw] = useState(false);

  // O conteúdo salvo no banco. Vamos tentar extrair como texto.
  const textoBruto = typeof item.conteudo === 'string' ? item.conteudo : JSON.stringify(item.conteudo, null, 2);

  let titulo = 'Pauta Gerada (Ver Detalhes)';
  let subtitulo = 'Sem subtítulo';

  // Usa regex para extrair [TÍTULO]: ou "TÍTULO": e ignora aspas se houver
  const tituloMatch = textoBruto.match(/\[?T[IÍ]TULO\]?['"]?\s*[:\-]?\s*['"]?([^"'\n\\]+)/i);
  if (tituloMatch && tituloMatch[1]) {
    titulo = tituloMatch[1].trim();
  } else {
    // Tenta fallback para "title": "..."
    const titleMatch = textoBruto.match(/['"]?title['"]?\s*[:\-]\s*['"]([^"'\n\\]+)/i);
    if (titleMatch && titleMatch[1]) {
      titulo = titleMatch[1].trim();
    }
  }

  const subtituloMatch = textoBruto.match(/\[?SUBT[IÍ]TULO\]?['"]?\s*[:\-]?\s*['"]?([^"'\n\\]+)/i);
  if (subtituloMatch && subtituloMatch[1]) {
    subtitulo = subtituloMatch[1].trim();
  } else {
    // Tenta fallback para "subtitle": "..."
    const subtitleMatch = textoBruto.match(/['"]?subtitle['"]?\s*[:\-]\s*['"]([^"'\n\\]+)/i);
    if (subtitleMatch && subtitleMatch[1]) {
      subtitulo = subtitleMatch[1].trim();
    }
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

  // Formata o texto bruto descompactando quebras de linha estritas (se era JSON stringificado com \n)
  const formatRawText = (text: string) => {
    try {
      // Se for JSON perfeitamente válido, exibe bonitinho
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      // Caso contrário, apenas substitui as quebras de linha literais caso a IA tenha retornado escapado
      return text.replace(/\\n/g, '\n');
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Conteúdo Bruto
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex sm:flex-col gap-3 justify-center sm:min-w-[180px] w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {showRaw ? 'Esconder Texto' : 'Ver Texto Puro'}
          </button>

          <button 
            onClick={onAprovar}
            disabled={isPending}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {isPending ? 'Aprovando...' : 'Aprovar'}
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

      {/* Editor Têxtil Raw */}
      {showRaw && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-700 mb-2">Texto Original (Copie e cole no LAB):</p>
          <pre 
            className="w-full h-80 p-4 text-sm font-mono text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none overflow-y-auto shadow-inner whitespace-pre-wrap"
          >
            {formatRawText(textoBruto)}
          </pre>
        </div>
      )}
    </div>
  );
}
