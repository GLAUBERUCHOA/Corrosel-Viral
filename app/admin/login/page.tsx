'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Sincroniza o contexto do Editor para a Curadoria
                localStorage.setItem('user_email', email);
                localStorage.setItem('is_authenticated', 'true');
                
                // Get callbackUrl from query params
                const params = new URLSearchParams(window.location.search);
                const callbackUrl = params.get('callbackUrl') || '/admin';
                window.location.href = callbackUrl; // Force full reload to trigger middleware
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-4">
            <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-border-dark">
                <div className="p-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-4xl leading-none">admin_panel_settings</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Acesso Restrito</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Carrossel Viral Lab Admin</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm text-center font-bold border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">E-mail Administrativo</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-border-dark rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    placeholder="exemplo@dominio.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-border-dark rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined font-bold">login</span>
                            )}
                            {isLoading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50/50 dark:bg-surface-darker/50 py-5 text-center border-t border-slate-100 dark:border-border-dark">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 Carrossel Viral Lab &bull; Segurança Criptografada</p>
                </div>
            </div>
        </div>
    );
}
