import { createContext, useContext } from "react";
import type { CeiafStudent } from "../types";

export type FamilyContextType = {
  selectedStudent: CeiafStudent | null;
  setSelectedStudent: (s: CeiafStudent | null) => void;
};

// Tipado estricto del contexto. Nada de `any`.
export const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = (): FamilyContextType => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used within FamilyProvider");
  return ctx;
};
