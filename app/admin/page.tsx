import Link from 'next/link';
import Sidebar from './components/Sidebar';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400">Bem-vindo ao painel de controle do Carrossel Viral Lab.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] shadow-xl shadow-black/20 border border-slate-100 dark:border-white/5 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                        <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">people</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Contas Ativas</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">--</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] shadow-xl shadow-black/20 border border-slate-100 dark:border-white/5 flex items-center gap-5 group hover:border-accent/30 transition-all duration-300">
                        <div className="h-16 w-16 bg-gradient-to-br from-accent/20 to-accent/5 text-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/10 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">psychology</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Modos de IA (Prompt)</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">4 Configurados</h3>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
