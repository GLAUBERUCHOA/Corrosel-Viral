import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SettingsForm } from './SettingsForm';
import Sidebar from '../components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const prompts = await prisma.promptSetting.findMany({
        orderBy: { toneKey: 'asc' }
    });

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciador de Estratégias (Prompts)</h1>
                    <p className="text-slate-500 dark:text-slate-400">Edite as instruções matriz da Inteligência Artificial do Iury globalmente.</p>
                </div>

                <SettingsForm initialPrompts={prompts} />
            </main>
        </div>
    );
}
