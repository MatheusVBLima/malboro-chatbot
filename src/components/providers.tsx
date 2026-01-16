"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

// Single TooltipProvider at root level (consolidates 11+ individual providers)
// This improves performance by avoiding context provider recreation
export function Providers({ children }: ProvidersProps) {
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>;
}
