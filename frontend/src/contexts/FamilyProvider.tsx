import { useState } from "react";
import type { CeiafStudent } from "../types";
import { FamilyContext, type FamilyContextType } from "./useFamily";

const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStudent, setSelectedStudent] = useState<CeiafStudent | null>(null);

  const value: FamilyContextType = {
    selectedStudent,
    setSelectedStudent,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

export default FamilyProvider;
