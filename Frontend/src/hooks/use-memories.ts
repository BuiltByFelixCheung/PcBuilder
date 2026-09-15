import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    memoryKeys,
    getMemoryById,
    listMemories,
    type MemoryListParams,
} from "@/api/catalog/memories";

export function useMemories(params: MemoryListParams) {
    return useQuery({
        queryKey: memoryKeys.list(params),
        queryFn: () => listMemories(params),
        placeholderData: keepPreviousData,
    });
}

export function useMemory(id: string | undefined) {
    return useQuery({
        queryKey: memoryKeys.detail(id ?? ""),
        queryFn: () => getMemoryById(id!),
        enabled: Boolean(id),
    });
}