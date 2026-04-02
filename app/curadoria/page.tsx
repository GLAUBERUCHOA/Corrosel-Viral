"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Send, RefreshCw, Rocket, Settings, Info, Newspaper, Trash2, CheckCircle2, Copy, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
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

export default function CuradoriaPage() {
  const router = useRouter();
  const pautas = useQuery(api.agents.getAllPautas);
  const runAgent1 = useAction(api.agents.runAgent1Fetcher);
  const clearPautas = useMutation(api.agents.clearAllPautas);
  const approvePauta = useMutation(api.agents.approvePauta);

  const [isRunningAgent1, setIsRunningAgent1] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedPauta, setSelectedPauta] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDispararAgente1() {
    setIsRunningAgent1(true);
    try {
      // Ignorando a tipagem estrita para compatibilidade com o backend Convex caso ele ainda não tenha atualizado
      // @ts-ignore
      await runAgent1();
    } catch (err) {
      console.error("Falha ao disparar Agente 1", err);
    } finally {
      setIsRunningAgent1(false);
    }
  }

  async function handleLimparFila() {
    if (!confirm("Tem certeza que deseja limpar toda a fila de pautas?")) return;
    setIsClearing(true);
    try {
      await clearPautas();
    } catch (err) {
      console.error("Erro ao limpar fila", err);
    } finally {
      setIsClearing(false);
    }
  }

  async function handleAprovar(id: any) {
    try {
      await approvePauta({ id });
      router.push(`/login?pautaId=${id}`);
    } catch (err) {
      console.error("Erro ao aprovar pauta", err);
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

  const renderRoteiro = (carrosselRaw: string) => {
    try {
      // Divide por SLIDE XX: ou LEGENDA: ou [FONTE]:
      const sections = carrosselRaw.split(/(SLIDE \d+:|LEGENDA:|\[FONTE\]:)/i);
      const slides: any[] = [];

      for (let i = 1; i < sections.length; i += 2) {
        const header = sections[i].toUpperCase();
        const content = sections[i + 1];

        if (header.includes("SLIDE")) {
          const slideNum = header.match(/\d+/)?.[0] || slides.length + 1;
          const title = content.match(/\[TÍTULO\]:\s*(.*)/i)?.[1]?.trim() || "";
          const subtitle = content.match(/\[SUBTÍTULO\]:\s*(.*)/i)?.[1]?.trim() || "";

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
              {s.subtitle && s.slide !== 1 && <div>[SUBTÍTULO]: {s.subtitle}</div>}
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

  if (pautas === undefined) {
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
              Curadoria <span className="text-blue-500">Viral</span>
            </h1>
            <p className="mt-2 text-slate-400 font-medium">
              Painel de Controle dos Agentes & Fila de Produção
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleLimparFila}
              disabled={isClearing || pautas.length === 0}
              variant="destructive"
              className="bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600 hover:text-white font-bold transition-all"
            >
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Limpar Fila
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

                <div className="py-6 space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Regras e Comportamento</h3>
                    <a href="/admin/configuracoes" className="block w-full">
                      <Button variant="secondary" className="w-full bg-slate-800 text-slate-200 hover:bg-slate-700 h-12 font-bold flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Gerenciar Prompts dos Agentes
                      </Button>
                    </a>
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Automação (15m News / 2m Agent 2)</h3>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800 transition-colors hover:border-slate-700">
                      <div className="space-y-1">
                        <Label className="text-base font-bold">Modo Produção</Label>
                        <p className="text-xs text-slate-500 font-medium">Ativar agendamento 00:00 - 05:00</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-blue-600" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Modelos Ativos</h3>
                    <div className="grid gap-5">
                      <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-400 uppercase tracking-tight">Agente 1 (Status: Variedade Ativa)</Label>
                        <Input className="bg-slate-950 border-slate-800 h-12 font-mono text-blue-400" placeholder="gemini-2.5-flash" disabled />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
                    <div className="flex gap-4">
                      <Info className="h-6 w-6 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-300 leading-relaxed font-semibold">
                        Código Negro Ativo: Variedade total (Shopee, iFood, Consumo, Psicologia). Foco em Ganho e Indignação.
                      </p>
                    </div>
                  </div>
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
            <p className="text-sm text-slate-600 mt-2">Clique em 'Disparar Agente 1' para iniciar uma nova pauta agora.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pautas.map((pauta) => (
              <Card key={pauta._id} className="group flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-900/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={pauta.status} />
                      <PillarBadge pauta={pauta.pauta} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                      {new Date(pauta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl font-black leading-tight group-hover:text-blue-400 transition-colors">
                    {pauta.pauta.match(/\[(?:TEMA DA PAUTA|TÍTULO)\]:\s*(.*)/i)?.[1] || pauta.pauta.split('\n')[0].replace('Qual é a notícia + ', '') || "Sem Título"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-slate-400 leading-relaxed font-medium line-clamp-3">
                    {pauta.pauta.match(/\[ÂNGULO PROVOCATIVO\]:\s*(.*)/i)?.[1] || pauta.pauta.split('\n')[1] || "Aguardando geração do ângulo provocativo..."}
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
  const pillarMatch = pauta.match(/\[PILAR DA BUSCA\]:\s*(.*)/i);
  if (!pillarMatch) return null;

  const pillar = pillarMatch[1];
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
