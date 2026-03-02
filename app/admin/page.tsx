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
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark flex items-center gap-4">
                        <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">people</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Contas Ativas</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">--</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark flex items-center gap-4">
                        <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">psychology</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Modos de IA (Prompt)</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">4 Configurados</h3>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
