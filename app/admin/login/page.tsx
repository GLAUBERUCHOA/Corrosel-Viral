'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                window.location.href = '/admin'; // Force full reload to trigger middleware
            } else {
                setError(data.error || 'Erro ao fazer login.');
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-background-dark p-4">
            <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Carrossel Viral Lab Admin</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-mail Administrativo</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    placeholder="Seu e-mail de acesso exclusivo"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined">login</span>
                            )}
                            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 dark:bg-surface-darker p-4 text-center border-t border-slate-100 dark:border-border-dark">
                    <p className="text-xs text-slate-400 font-medium">&copy; 2026 Carrossel Viral Lab</p>
                </div>
            </div>
        </div>
    );
}
