import { prisma } from '@/lib/prisma';
import CuradoriaItem from './CuradoriaItem';
import CuradoriaActions from './CuradoriaActions';

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
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      <header className="mb-8 text-center sm:text-left flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Editor-Chefe: Curadoria</h1>
          <p className="text-slate-500 font-medium max-w-2xl mb-4">Reveja as ideias geradas diariamente pela IA antes de aprovar e publicar.</p>
          <a href="/admin/configuracoes" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition">
            <span className="material-symbols-outlined text-[20px]">settings</span> Configurações da IA
          </a>
        </div>
        <CuradoriaActions />
      </header>

      {carrosseisPendentes.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <div className="text-emerald-400 mb-4 block">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700">Tudo limpo por aqui!</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Nenhuma nova ideia pendente. Volte mais tarde ou force uma geração manual.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {carrosseisPendentes.map((item) => (
            <CuradoriaItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
