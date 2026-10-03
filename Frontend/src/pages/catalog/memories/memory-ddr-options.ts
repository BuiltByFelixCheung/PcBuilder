import type { DdrGeneration } from "@/api/enums";

export function optionsForDdr<T>(
  ddrGeneration: DdrGeneration | undefined,
  ddr4: readonly T[],
  ddr5: readonly T[],
): readonly T[] {
  if (ddrGeneration === "Ddr4") return ddr4;
  if (ddrGeneration === "Ddr5") return ddr5;
  return [];
}
