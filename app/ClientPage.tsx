'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LoginScreen from './components/LoginScreen';

const CarouselGenerator = dynamic(() => import('./components/CarouselGenerator'), {
  ssr: false,
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated in localStorage
    const savedAuth = localStorage.getItem('is_authenticated');
    if (savedAuth === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    }
    // Small delay to prevent flashing the login screen if already authenticated
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('user_email', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
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
