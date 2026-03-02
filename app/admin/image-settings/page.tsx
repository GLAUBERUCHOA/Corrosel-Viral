import { prisma } from '@/lib/prisma';
import Sidebar from '../components/Sidebar';
import { ImageSettingsForm } from './ImageSettingsForm';

export const dynamic = 'force-dynamic';

export default async function ImageSettingsPage() {
    const rawSettings = await prisma.imagePromptSetting.findMany({
        orderBy: { nicheKey: 'asc' }
    });

    const globalInstruction = rawSettings.find((p: { nicheKey: string }) => p.nicheKey === 'GLOBAL_IMAGE');
    const specificNiches = rawSettings.filter((p: { nicheKey: string }) => p.nicheKey !== 'GLOBAL_IMAGE');

    // Assegura que a instrução global está sempre no topo
    const settings = globalInstruction ? [globalInstruction, ...specificNiches] : specificNiches;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">imagesmode</span>
                        Nichos de Imagem (Direção de Arte)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure o olhar crítico do Iury para gerar imagens adequadas a cada setor, ou crie novos nichos.</p>
                </div>

                <div className="max-w-4xl">
                    <ImageSettingsForm initialSettings={settings} />
                </div>
            </main>
        </div>
    );
}
