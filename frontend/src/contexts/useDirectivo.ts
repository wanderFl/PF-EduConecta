import { useContext, createContext } from "react";

export type SelectedCourse = {
  id_curso: number;
  display_name: string;
};

type DirectivoCtx = {
  selectedCourse: SelectedCourse | null;
  setSelectedCourse: (c: SelectedCourse | null) => void;
};

export const DirectivoContext = createContext<DirectivoCtx | undefined>(undefined);

export const useDirectivo = () => {
  const ctx = useContext(DirectivoContext);
  if (!ctx) {
    throw new Error("useDirectivo debe usarse dentro de <DirectivoProvider>");
  }
  return ctx;
};
