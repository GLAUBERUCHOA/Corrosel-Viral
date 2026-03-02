import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SettingsForm } from './SettingsForm';
import Sidebar from '../components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const rawPrompts = await prisma.promptSetting.findMany({
        orderBy: { toneKey: 'asc' }
    });

    const globalInstruction = rawPrompts.find((p: { toneKey: string }) => p.toneKey === 'GLOBAL_INSTRUCTIONS');
    const specificTones = rawPrompts.filter((p: { toneKey: string }) => p.toneKey !== 'GLOBAL_INSTRUCTIONS');

    // Assegura que a instruÃ§Ã£o global estÃ¡ sempre no topo
    const prompts = globalInstruction ? [globalInstruction, ...specificTones] : specificTones;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciador de EstratÃ©gias (Prompts)</h1>
                    <p className="text-slate-500 dark:text-slate-400">Edite as instruÃ§Ãµes matriz da InteligÃªncia Artificial do Iury globalmente.</p>
                </div>

                <SettingsForm initialPrompts={prompts} />
            </main>
        </div>
    );
}
