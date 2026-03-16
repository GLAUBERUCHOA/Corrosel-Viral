'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CuradoriaActions() {
  const router = useRouter();
  const [limpando, setLimpando] = useState(false);
  const [gerando, setGerando] = useState(false);

  const handleLimparBanco = async () => {
    if (!confirm('Tem certeza que deseja deletar todos os posts pendentes? Essa ação não pode ser desfeita.')) return;
    
    try {
      setLimpando(true);
      const res = await fetch('/api/admin/curadoria/acoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'limpar' })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Banco limpo com sucesso!');
        router.refresh();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      alert('Erro de comunicação.');
    } finally {
      setLimpando(false);
    }
  };

  const handleDispararLote = async () => {
    if (!confirm('Isso vai iniciar a geração de 10 posts e pode levar mais de 2 minutos. Deseja prosseguir?')) return;
    
    try {
      setGerando(true);
      
      // Passando o header de Authorization fixo para forçar a execução (ajuste conforme seu cron secret)
      // Como estamos no admin, podemos chamar a mesma lógica que o CRON, mas talvez precisemos de um endpoint exclusivo.
      // Vou usar a rota própria de ações para rotear isso para o gerador de cron enviando a chave que temos (ou refatorando o cron para ignorar localhost)
      const res = await fetch('/api/admin/curadoria/acoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gerar_lote' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Geração concluída! ${data.message}`);
        router.refresh();
      } else {
        alert(`Erro ao gerar: ${data.error || data.details}`);
      }
    } catch (err) {
      alert('Erro ao agendar geração ou timeout.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="flex gap-4 mb-8">
      <button 
        onClick={handleDispararLote} 
        disabled={gerando || limpando}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
      >
        {gerando ? (
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
        )}
        {gerando ? 'Gerando Lote...' : 'Disparar Lote de 10'}
      </button>

      <button 
        onClick={handleLimparBanco} 
        disabled={limpando || gerando}
        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
      >
        {limpando ? (
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-sm">delete</span>
        )}
        {limpando ? 'Limpando...' : 'Limpar Banco'}
      </button>
    </div>
  );
}
