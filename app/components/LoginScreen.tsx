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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans relative overflow-hidden">
      {/* Background Glows (Same as Sales Page) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 p-6 md:p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="relative z-10">
          {step === 'email_check' ? (
            <div className="flex justify-center mb-6">
              <div className="size-14 flex items-center justify-center bg-gradient-to-br from-primary to-accent rounded-2xl text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-3xl">view_carousel</span>
              </div>
            </div>
          ) : (
            <div className="flex mb-6">
              <button 
                onClick={() => {
                  setStep('email_check');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined mr-1 text-lg">arrow_back</span>
                Trocar e-mail
              </button>
            </div>
          )}

          <h2 className="text-2xl md:text-3xl font-black text-center text-white mb-1 tracking-tight">
            {step === 'email_check' ? 'Bem-vindo ao LAB' : step === 'password_create' ? 'Primeiro Acesso' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-center text-slate-400 mb-8 text-xs font-medium uppercase tracking-wide">
            {step === 'email_check' 
              ? 'Acesse o seu laboratório viral' 
              : step === 'password_create'
                ? 'Crie sua senha exclusiva'
                : 'Faça login para continuar'
            }
          </p>

          <form onSubmit={step === 'email_check' ? handleEmailCheck : handleLoginSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                E-mail de acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled={step !== 'email_check'}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Seu e-mail da Kiwify"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${error && step === 'email_check' ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-slate-950/50 focus:border-primary/50'} text-white placeholder:text-slate-600 transition-all outline-none font-medium disabled:opacity-40`}
                  required
                  autoFocus={step === 'email_check'}
                />
              </div>
            </div>

            {step !== 'email_check' && (
              <div className="space-y-1.5 relative animate-in fade-in slide-in-from-top-2">
                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  {step === 'password_create' ? 'Crie sua Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Sua senha"
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${error && password ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-slate-950/50 focus:border-primary/50'} text-white placeholder:text-slate-600 transition-all outline-none font-medium`}
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 'password_create' && (
              <div className="space-y-1.5 relative animate-in fade-in slide-in-from-top-2">
                <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">lock</span>
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repita sua senha"
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${error && confirmPassword ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-slate-950/50 focus:border-primary/50'} text-white placeholder:text-slate-600 transition-all outline-none font-medium`}
                    required={step === 'password_create'}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                <p className="text-[11px] font-bold text-red-400 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[16px]">error</span> {error}
                </p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span> {successMsg}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:shadow-[0_0_30px_rgba(255,138,0,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>Aguarde...</span>
                </>
              ) : (
                <>
                  <span>{step === 'email_check' ? 'Continuar' : step === 'password_create' ? 'Ativar e Entrar' : 'Acessar o Lab'}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-500 flex flex-col gap-1.5 items-center uppercase tracking-widest font-bold">
              <span>● Acesso Restrito ●</span>
              {step === 'email_check' && (
                <span className="text-slate-600">
                  Use o e-mail cadastrado na Kiwify
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
