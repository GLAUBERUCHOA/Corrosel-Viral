import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Agente 1: Busca novas notícias a cada 15 minutos (para testes rápidos)
crons.interval(
  "fetch-news-agent-1",
  { minutes: 15 },
  internal.agents.runAgent1Fetcher
);

// Agente 2: Processa notícias pendentes a cada 2 minutos enquanto houver pautas pending
crons.interval(
  "process-news-agent-2",
  { minutes: 2 },
  internal.agents.runAgent2Processor
);

export default crons;
