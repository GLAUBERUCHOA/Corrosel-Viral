import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CuradoriaPage() {
  const carrosseisPendentes = await prisma.autoCarrossel.findMany({
    where: {
      status: 'pendente'
    },
    orderBy: {
      criado_em: 'desc'
    }
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Editor-Chefe: Curadoria</h1>
        <p className="text-slate-500 font-medium">Reveja as ideias geradas diariamente pela IA antes de aprovar e publicar.</p>
      </header>

      {carrosseisPendentes.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="text-slate-400 mb-3 block">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tudo limpo!</h3>
          <p className="text-slate-500">Nenhuma ideia pendente de revisão no momento.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {carrosseisPendentes.map((item) => {
            // @ts-ignore - Conteudo is JSON, so we cast it or parse based on how Prisma reads it
            const slides = (typeof item.conteudo === 'string' ? JSON.parse(item.conteudo) : item.conteudo) || [];
            const primeiroSlide = slides[0] || {};
            const quantSlides = slides.length;

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Header do Card */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> 
                    Pendente de Avaliação
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Gerado em: {format(new Date(item.criado_em), "dd 'de' MMMM, 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Corpo do Card */}
                <div className="px-6 py-6 flex flex-col sm:flex-row gap-6 justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 leading-snug mb-2">
                      {primeiroSlide.title || 'Título Indisponível'}
                    </h2>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {primeiroSlide.subtitle || 'Sem subtítulo'}
                    </p>
                    
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        {quantSlides} Slides Mapeados
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex sm:flex-col gap-3 justify-center sm:min-w-[180px]">
                    <button className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Aprovar & Gerar
                    </button>
                    <button className="flex-1 w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Descartar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
