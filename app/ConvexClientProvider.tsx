"use client";
import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = "https://impressive-lion-772.convex.cloud";
const convex = new ConvexReactClient(convexUrl);


export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
