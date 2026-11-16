import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/index.ts";
import { PcBuildProvider } from "@/builds/index.ts";
import { createQueryClient } from "@/query/query-client.ts";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PcBuildProvider>{children}</PcBuildProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
