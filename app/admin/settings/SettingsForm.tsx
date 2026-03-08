'use client';

import { useState } from 'react';

type PromptSetting = {
    id: string;
    toneKey: string;
    label: string;
    instruction: string;
};

export function SettingsForm({ initialPrompts }: { initialPrompts: PromptSetting[] }) {
    const [prompts, setPrompts] = useState(initialPrompts);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (id: string, field: keyof PromptSetting, value: string) => {
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompts }),
            });

            if (res.ok) {
                setMessage('Configurações salvas com sucesso!');
            } else {
                setMessage('Erro ao salvar as configurações.');
            }
        } catch (err) {
            setMessage('Erro de conexão. Tente novamente.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {message && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                    {message}
                </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-xs text-amber-700 dark:text-amber-300">
                <strong>💡 Dica de Engenharia:</strong> Cada tom agora é 100% independente. Lembre-se de incluir as regras de formatação ([TÍTULO], [SUBTÍTULO], SLIDE 01:) dentro de cada bloco para garantir que o Gemini não se perca.
            </div>

            {prompts.filter(p => p.toneKey !== 'GLOBAL_INSTRUCTIONS').map((p) => (
                <div key={p.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome da Estratégia (Menu)</label>
                        <input
                            type="text"
                            value={p.label}
                            onChange={(e) => handleChange(p.id, 'label', e.target.value)}
                            className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent text-lg font-bold text-slate-900 dark:text-white pb-1 focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Instruções Matriz</label>
                    <textarea
                        value={p.instruction}
                        onChange={(e) => handleChange(p.id, 'instruction', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none h-64 overflow-y-auto resize-none"
                    />
                </div>
            ))}

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSaving ? (
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined">save</span>
                    )}
                    {isSaving ? 'Salvando...' : 'Salvar Instruções de Tom'}
                </button>
            </div>
        </form>
    );
}
