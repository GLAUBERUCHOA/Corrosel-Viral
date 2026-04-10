import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ============================================================
// JANELA NOTURNA — 22h BRT até 06h BRT
// O controle de horário fica dentro do handler do próprio agente
// (ai_actions.ts verifica se está dentro da janela antes de agir)
// ============================================================

// Agente 1: Busca novas pautas a cada 90 minutos
// Na janela de 8h (22h-06h), isso dá ~5 disparos = ~5 pautas/noite
crons.interval(
  "fetch-news-agent-1",
  { minutes: 90 },
  (internal as any).ai_actions.runAgent1Fetcher,
  { automatic: true, userEmail: "drglauberabreu@gmail.com" }
);

// Agente 2: Processa pautas pendentes a cada 20 minutos
// Só consome API se houver pauta pendente, senão retorna sem chamar o Gemini
crons.interval(
  "process-news-agent-2",
  { minutes: 20 },
  (internal as any).ai_actions.runAgent2Processor
);

export default crons;
