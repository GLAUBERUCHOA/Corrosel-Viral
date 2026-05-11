'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import LoginScreen from './components/LoginScreen';

const CarouselGenerator = dynamic(() => import('./components/CarouselGenerator'), {
  ssr: false,
});

export default function App() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('is_authenticated');
    const savedEmail = localStorage.getItem('user_email');
    
    if (savedAuth === 'true' && savedEmail) {
      setUserEmail(savedEmail);
      setIsAuthenticated(true);
      checkUserStatus(savedEmail);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkUserStatus = async (email: string) => {
    try {
      const response = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`);
      // Nota: Usei GET aqui para simplificar a verificação de status recorrente
      // Mas o /api/auth/check atual é POST. Vou ajustar o fetch para POST ou criar um helper.
      
      const checkResponse = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await checkResponse.json();

      if (checkResponse.status === 404 && data.error === 'NOT_FOUND') {
         // Usuário não encontrado no Prisma (pode acontecer se o localStorage estiver sujo)
         handleLogout();
      } else if (data.status === 'pendente') {
         router.push('/pendente');
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (email: string) => {
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_email', email);
    setUserEmail(email);
    setIsAuthenticated(true);
    checkUserStatus(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-slate-200 dark:border-border-dark border-t-primary animate-spin"></div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <CarouselGenerator onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}

