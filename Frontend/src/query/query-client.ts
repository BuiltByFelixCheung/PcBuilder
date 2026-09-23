import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(options?: { retry?: boolean | number }) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: options?.retry === false ? 0 : 60_000,
        retry: options?.retry ?? 1,
      },
    },
  });
}
