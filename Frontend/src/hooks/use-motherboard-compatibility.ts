import { useState } from "react";
import { usePcBuild } from "@/builds/use-pc-build";

export function useMotherboardOnlyCompatibility(initiallyOn: boolean) {
  const currentBuild = usePcBuild();
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(initiallyOn);

  function compatibilityIds(checked: boolean) {
    return {
      motherboardId: checked ? currentBuild.motherboardId : undefined,
    };
  }

  return { showOnlyCompatible, setShowOnlyCompatible, compatibilityIds };
}
