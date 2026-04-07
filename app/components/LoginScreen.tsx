'use client';
import React, { useState } from 'react';

export default function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    // Always allow the admin email for testing/fallback
    if (cleanEmail === 'drglauberabreu@gmail.com') {
      onLogin(cleanEmail);
      return;
    }

    if (!email) {
      setError('O e-mail é obrigatório.');
      return;
    }

    if (!password && cleanEmail !== 'drglauberabreu@gmail.com') {
      setError('A senha é obrigatória.');
      return;
    }

    if (isFirstAccess && password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e digite novamente.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (isOtpMode) {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, code: otpCode }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSuccessMsg('Conta ativada com sucesso! Redirecionando...');
          setTimeout(() => onLogin(cleanEmail), 1500);
        } else {
          setError(data.error || 'Código inválido.');
        }
      } catch (err) {
        setError('Erro ao verificar código.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          isSettingPassword: isFirstAccess
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isVerified || (isFirstAccess && !data.error)) {
           // Admin bypass ou verificado
          onLogin(cleanEmail);
        }
      } else {
        if (data.error === 'FIRST_ACCESS') {
          setIsFirstAccess(true);
          setError('Este é o seu primeiro acesso. Crie uma senha para continuar.');
        } else if (data.error === 'OTP_REQUIRED') {
          setIsOtpMode(true);
          setSuccessMsg(data.message || 'Código enviado para o seu e-mail.');
        } else {
          setError(data.error || 'Erro ao realizar login. Tente novamente.');
        }
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
            {isOtpMode ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium border border-indigo-100 dark:border-indigo-800/30">
                  <span className="material-symbols-outlined align-middle mr-2 text-lg">mark_email_read</span>
                  Enviamos um código de 6 dígitos para o seu e-mail para validar o primeiro acesso.
                </div>
                <div className="space-y-2 relative">
                  <label htmlFor="otpCode" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Código de Ativação
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="000000"
                    className={`w-full px-4 py-3.5 text-center text-2xl tracking-[0.5em] rounded-xl border ${error ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold`}
                    required
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <>
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
                      disabled={isFirstAccess}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="seu@email.com"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${error && !password ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker'} text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium disabled:opacity-50`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 relative animate-in fade-in slide-in-from-top-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isFirstAccess ? 'Crie sua Senha' : 'Senha'}
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
                      autoFocus={isFirstAccess}
                    />
                  </div>
                </div>

                {isFirstAccess && (
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
                        required={isFirstAccess}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] translate-y-0.5">error</span> {error}
                </p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-start gap-2">
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
                  {isOtpMode ? 'Ativar Conta' : (isFirstAccess ? 'Criar Senha' : 'Entrar na Curadoria')}
                  <span className="material-symbols-outlined text-[20px]">{isOtpMode ? 'check_circle' : 'arrow_forward'}</span>
                </>
              )}
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
