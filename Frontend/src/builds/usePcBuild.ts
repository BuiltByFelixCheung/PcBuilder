import { useContext } from "react";
import { PcBuildContext } from "./pcbuild-context.ts";

export function usePcBuild() {
  const context = useContext(PcBuildContext);
  if (!context) {
    throw new Error("usePcBuild must be used within a PcBuildProvider");
  }
  return context;
}