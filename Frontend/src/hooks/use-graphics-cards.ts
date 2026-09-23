import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  graphicsCardKeys,
  getGraphicsCardById,
  listGraphicsCards,
  type GraphicsCardListParams,
} from "@/api/catalog/graphics-cards";

export function useGraphicsCards(params: GraphicsCardListParams) {
  return useQuery({
    queryKey: graphicsCardKeys.list(params),
    queryFn: () => listGraphicsCards(params),
    placeholderData: keepPreviousData,
  });
}

export function useGraphicsCard(id: string | undefined) {
  return useQuery({
    queryKey: graphicsCardKeys.detail(id ?? ""),
    queryFn: () => getGraphicsCardById(id!),
    enabled: Boolean(id),
  });
}
