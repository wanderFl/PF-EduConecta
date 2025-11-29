// src/routes/PinGate.tsx
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import PinPromptModal from "../components/common/PinPromptModal";

const PinGate: React.FC = () => {
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

  // Si aún no fue validado en ESTE montaje, mostrar PIN
  if (!ok) {
    return (
      <PinPromptModal
        open
        onClose={() => navigate(-1)}       // volver si cancela
        onSuccess={() => setOk(true)}      // solo para esta vista
        title="Validación PIN Parental"
      />
    );
  }

  // Una vez validado, muestra el contenido protegido
  return <Outlet />;
};

export default PinGate;
