import { createContext } from "react";
import { type PcBuildContextValue } from "./types";

export const PcBuildContext = createContext<PcBuildContextValue | undefined>(
  undefined,
);
