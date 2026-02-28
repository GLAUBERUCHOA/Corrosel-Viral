import React, { useState } from 'react';

const USUARIOS_AUTORIZADOS = ['drglauberabreu@gmail.com'];

export default function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    
    if (USUARIOS_AUTORIZADOS.includes(cleanEmail)) {
      onLogin(cleanEmail);
    } else {
      setError('E-mail não autorizado. Verifique e tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-border-dark p-8 md:p-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="size-16 flex items-center justify-center bg-primary/10 rounded-2xl text-primary shadow-inner">
              <span className="material-symbols-outlined text-4xl">view_carousel</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-2 tracking-tight">
            Bem-vindo de volta
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-sm font-medium">
            Faça login para acessar o Carrossel Viral Lab
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                E-mail de acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seu@email.com"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${error ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium`}
                  required
                />
              </div>
              {error && (
                <p className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <span className="material-symbols-outlined text-[14px]">error</span> {error}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              Entrar <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Acesso restrito a usuários autorizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
