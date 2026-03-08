'use client';

import { useState } from 'react';

type ImageSetting = {
    id: string;
    nicheKey: string;
    label: string;
    instruction: string;
    isDeletable?: boolean;
};

export function ImageSettingsForm({ initialSettings }: { initialSettings: ImageSetting[] }) {
    const [settings, setSettings] = useState<ImageSetting[]>(initialSettings || []);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (index: number, field: keyof ImageSetting, value: string) => {
        const newSettings = [...settings];
        newSettings[index] = { ...newSettings[index], [field]: value };
        setSettings(newSettings);
    };

    const handleAddNiche = () => {
        setSettings([
            ...settings,
            {
                id: 'new_' + Date.now(),
                nicheKey: 'NICHO_' + Math.floor(Math.random() * 1000),
                label: 'Novo Nicho...',
                instruction: 'Nova regra de criaÃ§Ã£o de imagem...',
                isDeletable: true
            }
        ]);
    };

    const handleDelete = async (index: number, id: string) => {
        if (!confirm('Deseja realmente apagar este nicho?')) return;

        if (id.startsWith('new_')) {
            const updated = [...settings];
            updated.splice(index, 1);
            setSettings(updated);
            return;
        }

        try {
            const res = await fetch('/api/admin/image-settings?id=' + id, { method: 'DELETE' });
            if (res.ok) {
                const updated = [...settings];
                updated.splice(index, 1);
                setSettings(updated);
            } else {
                setMessage('Erro ao deletar o nicho.');
            }
        } catch (err) {
            setMessage('Erro de conexÃ£o ao deletar.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        const keys = settings.map(s => s.nicheKey);
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
            setMessage('Erro: Existem nichos com a mesma "Chave do Sitema" (ex: NICHO_XXX). Cada chave deve ser Ãºnica.');
            setIsSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/admin/image-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (res.ok) {
                setMessage('Nichos salvos com sucesso!');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage('Erro ao salvar.');
            }
        } catch (err) {
            setMessage('Erro de conexÃ£o. Tente novamente.');
        } finally {
            setIsSaving(false);
            if (!message.startsWith('Erro')) {
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {message && (
                <div className={'p-4 rounded-lg text-sm font-medium border ' + (message.startsWith('Erro') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>
                    {message}
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-500">
                    Defina estilos e comportamentos especÃ­ficos de geraÃ§Ã£o de imagem para cada nicho.
                </p>
                <button
                    type="button"
                    onClick={handleAddNiche}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Adicionar Novo Nicho
                </button>
            </div>

            {settings.map((s, index) => (
                <div key={s.id} className={'bg-white dark:bg-surface-dark border ' + (s.nicheKey === 'GLOBAL_IMAGE' ? 'border-primary shadow-md' : 'border-slate-200 dark:border-border-dark') + ' rounded-xl p-6 relative'}>

                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome no Menu (Label)</label>
                            <input
                                type="text"
                                value={s.label}
                                onChange={(e) => handleChange(index, 'label', e.target.value)}
                                className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent text-lg font-bold text-slate-900 dark:text-white pb-1 focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Chave do Sistema</label>
                            <input
                                type="text"
                                value={s.nicheKey}
                                disabled={!s.isDeletable}
                                onChange={(e) => handleChange(index, 'nicheKey', e.target.value.toUpperCase().replace(/\\s+/g, '_'))}
                                className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent text-sm font-mono text-slate-600 dark:text-slate-400 pb-1 focus:border-primary outline-none transition-colors disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">InstruÃ§Ãµes para o Criador de Imagens (Claude/Gemini API)</label>
                    <textarea
                        value={s.instruction}
                        onChange={(e) => handleChange(index, 'instruction', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg p-4 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary outline-none h-48 overflow-y-auto resize-none"
                    />

                    {s.isDeletable && (
                        <button
                            type="button"
                            onClick={() => handleDelete(index, s.id)}
                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full p-2 transition-colors flex items-center justify-center"
                            title="Remover nicho"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    )}
                </div>
            ))}

            <div className="pt-8 flex justify-end">
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
                    {isSaving ? 'Salvando...' : 'Salvar Todos os Nichos'}
                </button>
            </div>
        </form>
    );
}
