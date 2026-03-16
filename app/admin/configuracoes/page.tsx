import fs from 'fs';
import path from 'path';
import ClientForm from './ClientForm';

export default async function ConfiguracoesPage() {
  const jsonPath = path.join(process.cwd(), 'config', 'squad-rules.json');
  let config = null;

  try {
    if (fs.existsSync(jsonPath)) {
      config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao ler configurações:', error);
  }

  if (!config) {
    return <div className="p-8">Arquivo de configuração (squad-rules.json) não encontrado.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">⚙️ Configurações da IA (Squad)</h1>
        <p className="text-slate-500 font-medium">Controle central dos comportamentos, regras de pesquisa e copy dos agentes.</p>
      </header>

      <ClientForm initialConfig={config} />
    </div>
  );
}
