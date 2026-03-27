import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  const pautas: any = await convex.query(api.agents.getAllPautas);
  console.log(JSON.stringify(pautas.slice(0, 5), null, 2));
}

main().catch(console.error);
