"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Send, Rocket, Settings, Info, Newspaper, Trash2, CheckCircle2, Copy, Check, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Funções auxiliares movidas para fora para evitar recriação no render e erros de Lint
const cleanTags = (str: string) => {
  return str
    .replace(/\[TEMA DA PAUTA\]:?/gi, '')
    .replace(/\[PILAR DA BUSCA\]:?/gi, '')
    .replace(/\[TÍTULO\]:?/gi, '')
    .replace(/\[.*?\]\s*:?/g, '') // remove any other brackets
    .replace(/^[\s:]+/gm, '') 
    .trim();
};

const getTitle = (pautaStr: string) => {
  // Try to capture Tema da Pauta or Título
  const match = pautaStr.match(/\[(?:TEMA DA PAUTA|TÍTULO)\]:?\s*([^\n]+)/i);
  if (match && match[1].trim()) {
    return cleanTags(match[1]).trim();
  }
  
  // Aggressive fallback
  const cleaned = cleanTags(pautaStr);
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  return lines.length > 0 ? lines[0] : "Sem Título";
};

const getDescription = (pautaStr: string) => {
  const match = pautaStr.match(/\[Â(?:NGULO)? PROVOCATIVO\]:?\s*([\s\S]*?)(?=\n\[|$)/i) || pautaStr.match(/\[Â(?:NGULO)? GENIAL\]:?\s*([\s\S]*?)(?=\n\[|$)/i);
  if (match && match[1].trim() && match[1].length > 10) {
    let desc = cleanTags(match[1]).trim();
    if (desc.length > 140) return desc.substring(0, 140) + "...";
    return desc;
  }
  
  // Fallback
  const cleaned = cleanTags(pautaStr);
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  let desc = lines.length > 1 ? lines.slice(1, 3).join(' ') : lines[0];
  if (!desc) return "Aguardando detalhes...";
  if (desc.length > 140) return desc.substring(0, 140) + "...";
  return desc;
};

const renderRoteiro = (carrosselRaw: string) => {
  try {
    const sections = carrosselRaw.split(/(SLIDE \d+:|LEGENDA:|\[FONTE\]:)/i);
    const slides: any[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i].toUpperCase();
      const content = sections[i + 1];

      if (header.includes("SLIDE")) {
        const slideNum = header.match(/\d+/)?.[0] || slides.length + 1;
        const title = content.match(/\[?TÍTULO\]?:\s*([\s\S]*?)(?=\[SUBTÍTULO\]:|$)/i)?.[1]?.trim() || "";
        const subtitle = content.match(/\[?SUBTÍTULO\]?:\s*([\s\S]*?)$/i)?.[1]?.trim() || "";

        slides.push({ slide: slideNum, title, subtitle });
      } else if (header.includes("LEGENDA")) {
        slides.push({ slide: "legenda", legenda: content.trim() });
      } else if (header.includes("FONTE")) {
        slides.push({ slide: "fonte", fonte: content.trim() });
      }
    }

    if (slides.length === 0) {
      return <div className="whitespace-pre-wrap font-mono text-slate-300 text-xs leading-relaxed p-4 bg-slate-950 rounded-xl border border-slate-800">{carrosselRaw}</div>;
    }

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
        {slides.map((s: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="text-blue-400 font-bold mb-2">
              {s.slide === "legenda" ? "LEGENDA:" : s.slide === "fonte" ? "FONTE:" : `SLIDE ${s.slide}:`}
            </div>
            {s.title && <div>[TÍTULO]: {s.title}</div>}
            {s.subtitle && <div>[SUBTÍTULO]: {s.subtitle}</div>}
            {s.fonte && <div className="text-slate-500 underline break-all">{s.fonte}</div>}
            {s.legenda && <div>{s.legenda}</div>}
          </div>
        ))}
      </div>
    );
  } catch (e) {
    return <div className="whitespace-pre-wrap text-slate-300 p-4 font-mono text-xs">{carrosselRaw}</div>;
  }
};

export default function CuradoriaPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const pautas = useQuery(api.agents.getAllPautas, userEmail ? { userEmail } : "skip");
  const runAgent1 = useAction(api.ai_actions.runAgent1Fetcher);
  const clearPautas = useMutation(api.agents.clearAllPautas);
  const deletePauta = useMutation(api.agents.deletePauta);
  const approvePauta = useMutation(api.agents.approvePauta);

  const [isRunningAgent1, setIsRunningAgent1] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedPauta, setSelectedPauta] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Setup SaaS
  const [nicho, setNicho] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [objetivo, setObjetivo] = useState("atracao");
  const [cta, setCta] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('is_authenticated');
      const email = localStorage.getItem('user_email');
      
      if (!isAuth || !email) {
        window.location.href = '/curadoria/login';
        return;
      }
      setUserEmail(email);
      setIsCheckingAuth(false);

      // Carregar setup do usuário
      fetch(`/api/user/setup?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setNicho(data.data.nicho || "");
            setPublicoAlvo(data.data.publicoAlvo || "");
            setObjetivo(data.data.objetivo || "atracao");
            setCta(data.data.cta || "");
            setGeminiApiKey(data.data.geminiApiKey || "");
            setHasApiKey(data.data.hasApiKey || false);
            setUserRole(data.data.role || "USER");
          }
        })
        .catch(console.error);
    };

    checkAuth();
  }, []);

  const saveSquadConfig = useMutation(api.agents.saveSquadConfig);

  async function handleSaveSetup() {
    if (!userEmail) return;
    setIsSavingSetup(true);
    try {
      // 1. Salva no MySQL (perfil do usuário + API key)
      await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, nicho, publicoAlvo, objetivo, cta, geminiApiKey })
      });

      // 2. Sincroniza no Convex (para o CRON noturno do admin ler)
      if (isAdmin) {
        await saveSquadConfig({
          nicho, publicoAlvo, objetivo, cta
        } as any);
      }

      setHasApiKey(geminiApiKey.length > 0 && !geminiApiKey.startsWith('••••'));
      alert("✅ Configurações salvas com sucesso!");
    } catch (err) {
      console.error('Erro ao salvar setup', err);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSavingSetup(false);
    }
  }

  async function handleDispararAgente1() {
    if (!hasApiKey && !isAdmin) {
      alert("⚠️ Configure sua Chave da API Gemini no Setup do Especialista antes de disparar.");
      return;
    }
    setIsRunningAgent1(true);
    try {
      // Busca a API key real do MySQL (não a mascarada)
      let resolvedApiKey: string | undefined;
      if (hasApiKey) {
        const keyRes = await fetch('/api/user/apikey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
        const keyData = await keyRes.json();
        resolvedApiKey = keyData.apiKey || undefined;
      }

      // @ts-ignore
      const result = await runAgent1({ 
        automatic: false,
        userEmail,
        userApiKey: resolvedApiKey,
        setup: { nicho, publicoAlvo, objetivo, cta }
      });
      if (result && !result.success) {
        alert("Erro no Agente 1: " + (result.error || result.message || "Erro desconhecido"));
      }
    } catch (err) {
      console.error("❌ Falha ao disparar Agente 1:", err);
      alert("Falha ao disparar Agente. Verifique o console.");
    } finally {
      setIsRunningAgent1(false);
    }
  }

  async function handleLimparFila() {
    if (!confirm("Tem certeza que deseja limpar toda a fila de pautas?")) return;
    setIsClearing(true);
    try {
      await clearPautas({ userEmail });
    } catch (err) {
      console.error("❌ Erro ao limpar fila:", err);
      alert("Erro ao limpar fila.");
    } finally {
      setIsClearing(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/curadoria/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout err:', e);
    }
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    window.location.href = '/curadoria/login';
  }

  async function handleAprovar(id: Id<"pautas">) {
    try {
      await approvePauta({ id });
      // Abre o LAB em uma nova aba com o ID da pauta
      window.open(`/login?pautaId=${id}`, '_blank');
    } catch (err) {
      console.error("Erro ao aprovar pauta", err);
    }
  }

  async function handleExcluir(id: Id<"pautas">) {
    try {
      await deletePauta({ id });
    } catch (err) {
      console.error("Erro ao excluir pauta", err);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar", err);
    }
  }


  if (isCheckingAuth || pautas === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white selection:bg-blue-500/30">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Newspaper className="h-10 w-10 text-blue-500" />
              Curadoria <span className="text-blue-500">Viral</span> v2.1
            </h1>
            <p className="mt-2 text-slate-400 font-medium">
              Painel de Controle dos Agentes & Fila de Produção
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end mr-4 md:flex">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Usuário Logado</span>
              <span className="text-xs font-medium text-slate-300">{userEmail}</span>
            </div>

            <Button
              onClick={handleLimparFila}
              disabled={isClearing || pautas?.length === 0}
              variant="destructive"
              className="bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600 hover:text-white font-bold transition-all"
            >
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Limpar Fila
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="border-slate-800 bg-slate-900 hover:bg-rose-600 hover:text-white transition-all group"
              title="Sair do Sistema"
            >
              <LogOut className="h-5 w-5 text-slate-400 group-hover:text-white" />
            </Button>

            <Button
              onClick={handleDispararAgente1}
              disabled={isRunningAgent1}
              className="bg-blue-600 font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            >
              {isRunningAgent1 ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              Disparar Agente 1
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors">
                  <Settings className="h-5 w-5 text-slate-400" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md p-8 overflow-y-auto">
                <SheetHeader className="border-b border-slate-800 pb-8 mb-4">
                  <SheetTitle className="text-3xl font-black flex items-center gap-3">
                    <Settings className="h-8 w-8 text-blue-500" />
                    Configurações
                  </SheetTitle>
                  <SheetDescription className="text-slate-400 text-sm font-medium mt-2">
                    Gerencie o comportamento global do seu squad de agentes.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-8">
                  {/* SETUP DO ESPECIALISTA (DENTRO DA GAVETA AGORA) */}
                  <div className="space-y-6 pb-6 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-500" />
                        Setup do Especialista
                      </h3>
                      <Button 
                        size="sm" 
                        onClick={handleSaveSetup} 
                        disabled={isSavingSetup}
                        className="bg-emerald-600 hover:bg-emerald-500 h-8 text-xs font-bold"
                      >
                        {isSavingSetup ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                        Salvar
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Seu Nicho de Atuação</Label>
                        <Input 
                          value={nicho} 
                          onChange={(e) => setNicho(e.target.value)}
                          placeholder="Ex: Imóveis de Luxo..."
                          className="bg-slate-950 border-slate-800 h-10 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Público-Alvo (Persona)</Label>
                        <Input 
                          value={publicoAlvo} 
                          onChange={(e) => setPublicoAlvo(e.target.value)}
                          placeholder="Ex: Médicos em São Paulo..."
                          className="bg-slate-950 border-slate-800 h-10 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Objetivo do Carrossel</Label>
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
                          {['atracao', 'engajamento', 'conversao'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setObjetivo(opt)}
                              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all ${
                                objetivo === opt ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {opt === 'atracao' ? '🧲 Atração' : opt === 'engajamento' ? '💬 Engajo' : '💰 Venda'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Chamada de Ação (CTA Oficial)</Label>
                        <Input 
                          value={cta} 
                          onChange={(e) => setCta(e.target.value)}
                          placeholder="Ex: Link na bio..."
                          className="bg-slate-950 border-slate-800 h-10 text-sm focus:border-blue-500"
                        />
                      </div>

                      {/* Campo de API Key do Gemini */}
                      <div className="space-y-2 pt-3 border-t border-slate-800/50">
                        <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">🔑 Chave da API Gemini</Label>
                        <Input 
                          type="password"
                          value={geminiApiKey} 
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder="Cole aqui sua API Key do Google AI Studio..."
                          className="bg-slate-950 border-slate-800 h-10 text-sm focus:border-blue-500 font-mono"
                        />
                        <p className="text-[9px] text-slate-600">
                          {hasApiKey ? '✅ Chave configurada' : '⚠️ Obrigatório para gerar conteúdo'} — Obtenha em aistudio.google.com
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CONTROLES ADMIN — Só visíveis para role=ADMIN */}
                  {isAdmin && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Regras e Comportamento</h3>
                        <Link href="/admin/configuracoes" className="block w-full">
                          <Button variant="secondary" className="w-full bg-slate-800 text-slate-200 hover:bg-slate-700 h-12 font-bold flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Gerenciar Prompts dos Agentes
                          </Button>
                        </Link>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="space-y-5">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Automação Noturna (22h-06h BRT)</h3>
                          <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800 transition-colors hover:border-slate-700">
                            <div className="space-y-1">
                              <Label className="text-base font-bold">CRON Admin</Label>
                              <p className="text-xs text-slate-500 font-medium">Agente 1 a cada 90min / Agente 2 a cada 20min</p>
                            </div>
                            <Switch className="data-[state=checked]:bg-blue-600" />
                          </div>
                        </div>

                        <div className="space-y-5">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Modelos Ativos</h3>
                          <div className="grid gap-5">
                            <div className="space-y-3">
                              <Label className="text-sm font-bold text-slate-400 uppercase tracking-tight">Primário / Fallback</Label>
                              <Input className="bg-slate-950 border-slate-800 h-12 font-mono text-blue-400" placeholder="gemini-2.5-flash → gemini-2.0-flash" disabled />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {/* Grid of Cards */}
        {pautas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 p-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-4 rounded-full bg-slate-900 p-4">
              <Rocket className="h-10 w-10 text-slate-700" />
            </div>
            <p className="text-xl font-bold text-slate-400">Tudo calmo na curadoria.</p>
            <p className="text-sm text-slate-600 mt-2">Clique em &apos;Disparar Agente 1&apos; para iniciar uma nova pauta agora.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pautas.map((pauta) => (
              <Card key={pauta._id} className="group flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-900/10">
                <CardHeader className="pb-3 relative">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={pauta.status} />
                      <PillarBadge pauta={pauta.pauta} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                        {new Date(pauta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleExcluir(pauta._id)} 
                        className="text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-full transition-colors flex -mt-1 -mr-2 shadow-none border-none outline-none"
                        title="Excluir card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl font-black leading-tight group-hover:text-blue-400 transition-colors">
                    {getTitle(pauta.pauta)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-slate-400 leading-relaxed font-medium line-clamp-3">
                    {getDescription(pauta.pauta)}
                  </CardDescription>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-3 border-t border-slate-800/50 p-6 pt-5 bg-slate-900/30">
                  <Button
                    variant="outline"
                    className="border-slate-800 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
                    disabled={!pauta.carrossel}
                    onClick={() => { setSelectedPauta(pauta); setIsPreviewOpen(true); }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    className="bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 disabled:bg-slate-800 disabled:text-slate-500"
                    disabled={!pauta.carrossel || pauta.status === "approved"}
                    onClick={() => handleAprovar(pauta._id)}
                  >
                    {pauta.status === "approved" ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" /> : <Send className="mr-2 h-4 w-4" />}
                    {pauta.status === "approved" ? "Aprovado" : "Aprovar"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog for Preview */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Roteiro Finalizado</DialogTitle>
             <DialogDescription className="text-slate-400">
                Copie o texto bruto abaixo para colar diretamente no LAB.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {selectedPauta?.carrossel ? renderRoteiro(selectedPauta.carrossel) : <p className="text-slate-500 italic text-center py-10">Processando roteiro...</p>}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                className="bg-slate-800 text-white hover:bg-slate-700 font-bold flex-1"
                onClick={() => copyToClipboard(selectedPauta?.carrossel || "")}
              >
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Texto Copiado!" : "Copiar Texto para o LAB"}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 font-bold flex-1"
                disabled={selectedPauta?.status === "approved"}
                onClick={() => { handleAprovar(selectedPauta?._id); setIsPreviewOpen(false); }}
              >
                Aprovar & Publicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 font-bold">Pendente</Badge>;
    case "processing":
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 font-bold animate-pulse">Agente 2</Badge>;
    case "processed":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-bold">Pronto</Badge>;
    case "approved":
      return <Badge className="bg-blue-600/20 text-blue-400 border-blue-400/20 px-3 py-1 font-bold">✓ No Instagram</Badge>;
    case "failed":
      return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-3 py-1 font-bold">Falhou</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PillarBadge({ pauta }: { pauta: string }) {
  const pillarMatch = pauta.match(/\[PILAR DA BUSCA\]:\s*([^\[\n]*)/i);
  if (!pillarMatch) return null;

  const pillar = pillarMatch[1].trim();
  let colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";

  if (pillar.includes("🔥")) colorClass = "bg-orange-600/20 text-orange-400 border-orange-500/30";
  if (pillar.includes("📱")) colorClass = "bg-purple-600/20 text-purple-400 border-purple-500/30";
  if (pillar.includes("♟️")) colorClass = "bg-blue-600/20 text-blue-400 border-blue-500/30";
  if (pillar.includes("🧠")) colorClass = "bg-emerald-600/20 text-emerald-400 border-emerald-500/30";
  if (pillar.includes("🛒")) colorClass = "bg-yellow-600/20 text-yellow-500 border-yellow-500/30";

  return (
    <Badge className={`${colorClass} px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter truncate max-w-[120px] border`}>
      {pillar.split('(')[0].trim()}
    </Badge>
  );
}
