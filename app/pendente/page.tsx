import React from 'react';

export default function PendingAccessPage() {
  const whatsappLink = "https://wa.me/5586995740576?text=Olá,%20comprei%20o%20Carrossel%20Viral%20Lab%20pelo%20Order%20Bump%20e%20preciso%20liberar%20meu%20acesso.%20Meu%20email%20de%20compra%20é:";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans relative overflow-hidden text-white">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-xl w-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 p-8 md:p-12 relative overflow-hidden animate-in fade-in zoom-in duration-500 text-center">
        
        <div className="size-20 mx-auto flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-3xl border border-orange-500/30 mb-8">
          <span className="material-symbols-outlined text-orange-500 text-4xl animate-pulse">hourglass_top</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
          Acesso Pendente de Aprovação
        </h1>
        
        <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed">
          Identificamos o seu e-mail, mas precisamos validar a sua compra do <span className="text-orange-500 font-bold">Order Bump</span> para liberar o laboratório.
        </p>

        <div className="space-y-4">
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 py-5 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
            Liberar Acesso via WhatsApp
          </a>

          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-6">
            ● Concierge Onboarding ●
          </p>
        </div>
      </div>
    </div>
  );
}
