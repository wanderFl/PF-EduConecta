import React, { useState } from "react";
import { isAxiosError } from "axios";
import { findStudentByCedula, linkStudentToParent } from "../../services/familia";
import type { CeiafStudent } from "../../types";
import { isValidEcuadorianCedula } from "../../utils/ecuador"; // ya lo tienes o créalo

type Props = {
  open: boolean;
  onClose: () => void;
  onLinked: () => void; // callback para refrescar lista
};

const AddChildModal: React.FC<Props> = ({ open, onClose, onLinked }) => {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [student, setStudent] = useState<CeiafStudent | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  if (!open) return null;

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOkMsg(null); setStudent(null);
    const c = cedula.trim();
    if (!isValidEcuadorianCedula(c)) {
      setErr("Cédula ecuatoriana inválida");
      return;
    }
    try {
      setLoading(true);
      const data = await findStudentByCedula(c);
      setStudent(data);
    } catch (e) {
      if (isAxiosError(e)) setErr(e.response?.data?.message || "No se encontró el estudiante");
      else setErr("Error buscando estudiante");
    } finally {
      setLoading(false);
    }
  };

  const vincular = async () => {
    if (!student) return;
    try {
      setConfirming(true);
      const res = await linkStudentToParent(student.id_estudiante);
      setOkMsg(res.message);
      onLinked(); // refresca lista de hijos
      // opcional: cerrar luego de 1.2s
      setTimeout(() => { setOkMsg(null); onClose(); }, 1200);
    } catch (e) {
      if (isAxiosError(e)) setErr(e.response?.data?.message || "No se pudo vincular");
      else setErr("Error al vincular");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Agregar hijo por cédula</h3>
          <button onClick={onClose} aria-label="Cerrar">✖</button>
        </div>

        <form onSubmit={buscar} className="modal-body">
          <div className="form-group">
            <label>Cédula del estudiante</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              placeholder="Ej. 1710034065"
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {err && <div className="error-message">{err}</div>}

        {student && (
          <div className="modal-section">
            <h4>Confirmar estudiante</h4>
            <div className="student-card">
              <div><b>{student.nombres} {student.apellidos}</b></div>
              <div>Cédula: {student.cedula}</div>
              <div>Curso: {student.curso_nombre ?? '—'} {student.curso_paralelo ? `(${student.curso_paralelo})` : ''}</div>
              <div>Año lectivo: {student.curso_ano_lectivo ?? '—'}</div>
            </div>
            <button onClick={vincular} className="submit-button" disabled={confirming}>
              {confirming ? "Vinculando..." : "Vincular a mi cuenta"}
            </button>
            {okMsg && <div className="success-message">{okMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddChildModal;
