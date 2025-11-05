import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { getLinkedChildren } from "../../services/familia";
import type { CeiafStudent } from "../../types";
import AddChildModal from "./AddChildModal";

type Props = {
  onSelect: (student: CeiafStudent) => void; // qué hacer al elegir un hijo (navegar o setear contexto)
};

const ChildrenSelector: React.FC<Props> = ({ onSelect }) => {
  const [hijos, setHijos] = useState<CeiafStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      setLoading(true);
      const data = await getLinkedChildren();
      setHijos(data);
    } catch (e) {
      if (isAxiosError(e)) setErr(e.response?.data?.message || "No se pudieron obtener los hijos");
      else setErr("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="page-container">
      <div className="header-row">
        <h2>Selecciona a tu hijo/a</h2>
        <button className="submit-button" onClick={() => setOpenModal(true)}>+ Agregar hijo</button>
      </div>

      {loading && <div>Cargando...</div>}
      {err && <div className="error-message">{err}</div>}

      {!loading && hijos.length === 0 && (
        <div className="empty-state">
          Aún no tienes hijos vinculados.
          <button className="login-button" onClick={() => setOpenModal(true)}>Agregar hijo</button>
        </div>
      )}

      <div className="grid-cards">
        {hijos.map(h => (
          <button key={h.id_estudiante} className="student-card clickable" onClick={() => onSelect(h)}>
            <div className="student-name"><b>{h.nombres} {h.apellidos}</b></div>
            <div className="student-meta">
              <span>Cédula: {h.cedula}</span>
              <span>Curso: {h.curso_nombre ?? '—'} {h.curso_paralelo ? `(${h.curso_paralelo})` : ''}</span>
            </div>
          </button>
        ))}
      </div>

      <AddChildModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onLinked={() => { setOpenModal(false); load(); }}
      />
    </div>
  );
};

export default ChildrenSelector;
