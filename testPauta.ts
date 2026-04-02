import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://impressive-lion-772.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

async function main() {
    try {
        console.log("Chamando runAgent1Fetcher...");
        const result = await convex.action(api.agents.runAgent1Fetcher, { automatic: false });
        console.log("Resultado:", result);
    } catch (err) {
        console.error("Erro Fatal:", err);
    }
}

main();
