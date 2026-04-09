'use client';
import React, { useState } from 'react';

type LoginStep = 'email_check' | 'password_enter' | 'password_create';

export default function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [step, setStep] = useState<LoginStep>('email_check');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail) {
      setError('O e-mail é obrigatório.');
      return;
    }

    if (cleanEmail === 'drglauberabreu@gmail.com') {
      onLogin(cleanEmail);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isFirstAccess) {
          setStep('password_create');
          setSuccessMsg('E-mail encontrado! Como este é o seu primeiro acesso, crie uma senha segura abaixo.');
        } else {
          setStep('password_enter');
          setSuccessMsg('Bem-vindo de volta! Digite sua senha para entrar no LAB.');
        }
      } else {
        setError(data.message || data.error || 'Erro ao verificar o e-mail. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    if (!password) {
      setError('A senha é obrigatória.');
      return;
    }

    if (step === 'password_create' && password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e digite novamente.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          isSettingPassword: step === 'password_create'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(cleanEmail);
      } else {
        setError(data.error || 'Erro ao realizar login. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-border-dark p-8 md:p-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          {step === 'email_check' ? (
            <div className="flex justify-center mb-8">
              <div className="size-16 flex items-center justify-center bg-primary/10 rounded-2xl text-primary shadow-inner">
                <span className="material-symbols-outlined text-4xl">view_carousel</span>
              </div>
            </div>
          ) : (
            <div className="flex mb-8">
              <button 
                onClick={() => {
                  setStep('email_check');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined mr-1 text-lg">arrow_back</span>
                Acessar com outro e-mail
              </button>
            </div>
          )}

          <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-2 tracking-tight">
            {step === 'email_check' ? 'Bem-vindo ao LAB' : step === 'password_create' ? 'Primeiro Acesso' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-sm font-medium">
            {step === 'email_check' 
              ? 'Informe seu e-mail de compra para acessar o Carrossel Viral Lab' 
              : step === 'password_create'
                ? 'Crie sua senha de acesso exclusivo'
                : 'Faça login no Carrossel Viral Lab'
            }
          </p>

          <form onSubmit={step === 'email_check' ? handleEmailCheck : handleLoginSubmit} className="space-y-6">
            
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
                  disabled={step !== 'email_check'}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Seu e-mail cadastrado na Kiwify"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${error && step === 'email_check' ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium disabled:opacity-50`}
                  required
                  autoFocus={step === 'email_check'}
                />
              </div>
            </div>

            {step !== 'email_check' && (
              <div className="space-y-2 relative animate-in fade-in slide-in-from-top-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {step === 'password_create' ? 'Crie sua Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Sua senha"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${error && password ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium`}
                    required
                    autoFocus={step !== 'email_check'}
                  />
                </div>
              </div>
            )}

            {step === 'password_create' && (
              <div className="space-y-2 relative animate-in fade-in slide-in-from-top-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repita sua senha"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${error && confirmPassword ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium`}
                    required={step === 'password_create'}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] translate-y-0.5">error</span> {error}
                </p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] translate-y-0.5">check_circle</span> {successMsg}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  Verificando...
                </>
              ) : (
                <>
                  {step === 'email_check' ? 'Continuar' : step === 'password_create' ? 'Criar Senha e Entrar' : 'Entrar no LAB'}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-1 items-center">
              <span>Acesso restrito a usuários autorizados.</span>
              {step === 'email_check' && (
                <span className="font-medium text-slate-500">
                  Use sempre o mesmo e-mail que usou na sua compra da Kiwify.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
