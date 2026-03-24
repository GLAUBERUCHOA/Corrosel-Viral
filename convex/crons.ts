import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Agente 1: Busca novas notícias a cada 1 hora (60 min)
crons.interval(
  "fetch-news-agent-1",
  { minutes: 60 },
  internal.agents.runAgent1Fetcher
);

// Agente 2: Processa notícias pendentes a cada 5 minutos
crons.interval(
  "process-news-agent-2",
  { minutes: 5 },
  internal.agents.runAgent2Processor
);

export default crons;
