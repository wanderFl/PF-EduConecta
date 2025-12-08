import React, {  useMemo, useState } from "react";
import { DirectivoContext, type SelectedCourse } from "./useDirectivo";


// 👇 El contexto queda exportado solo para uso interno del hook

const DirectivoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);

  const value = useMemo(
    () => ({ selectedCourse, setSelectedCourse }),
    [selectedCourse]
  );

  return (
    <DirectivoContext.Provider value={value}>
      {children}
    </DirectivoContext.Provider>
  );
};

export default DirectivoProvider;
