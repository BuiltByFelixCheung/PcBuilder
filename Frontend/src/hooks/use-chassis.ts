import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    chassisKeys,
    getChassisById,
    listChassis,
    type ChassisListParams,
} from "@/api/catalog/chassis";

export function useChassis(params: ChassisListParams) {
    return useQuery({
        queryKey: chassisKeys.list(params),
        queryFn: () => listChassis(params),
        placeholderData: keepPreviousData,
    });
}

export function useChassisById(id: string | undefined) {
    return useQuery({
        queryKey: chassisKeys.detail(id ?? ""),
        queryFn: () => getChassisById(id!),
        enabled: Boolean(id),
    });
}