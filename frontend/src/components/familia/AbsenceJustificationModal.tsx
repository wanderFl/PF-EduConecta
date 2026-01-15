import React, { useMemo, useState } from "react";
import { useFamily } from "../../contexts/useFamily";
import { getJustificationUploadUrl, submitJustification } from "../../services/familia";

type Props = {
  open: boolean;
  dateISO: string | null;   // "YYYY-MM-DD"
  onClose: () => void;
  onSubmitted?: () => void; // refrescar calendario
};

const AbsenceJustificationModal: React.FC<Props> = ({ open, dateISO, onClose, onSubmitted }) => {
  const { selectedStudent } = useFamily();
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = useMemo(() => {
    if (!dateISO) return "";
    // dateISO viene como "YYYY-MM-DD"
    // Al agregar "T00:00:00" sin la "Z", se interpreta como medianoche local
    const d = new Date(dateISO + "T00:00:00");
    return d.toLocaleDateString(undefined, { dateStyle: "long" });
  }, [dateISO]);

  const reset = () => {
    setReason("");
    setFile(null);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!open || !dateISO || !selectedStudent || !file || !reason.trim()) {
      setError("Completa la razón y adjunta el archivo.");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // 1) URL firmada
      const { uploadUrl, fileUrl } = await getJustificationUploadUrl({
        studentId: selectedStudent.id_estudiante,
        date: dateISO,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });

      // 2) Subir a S3
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        const txt = await putRes.text();
        throw new Error(`Error subiendo archivo: ${putRes.status} ${txt}`);
      }

      // 3) Registrar justificación (PENDING)
      await submitJustification({
        studentId: selectedStudent.id_estudiante,
        date: dateISO,
        reason: reason.trim(),
        file_reference: fileUrl,
      });

      reset();
      onSubmitted?.();
      onClose();
    } catch {
      setError("No se pudo enviar la justificación. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !dateISO) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card ts-modal">
        <div className="ts-modal-header">
          <div className="ts-modal-title">Justificación – {dateLabel}</div>
          <button className="ts-close" aria-label="Cerrar" onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ts-modal-body">
            <div className="ts-field">
              <div className="ts-label">Razón <span className="ts-required">*</span></div>
              <textarea
                className="ts-textarea"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica el motivo de la inasistencia…"
                required
              />
            </div>

            <div className="ts-field">
              <div className="ts-label">Evidencia <span className="ts-required">*</span></div>
              <input
                className="ts-input-file"
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && <div className="ts-file-name" title={file.name}>{file.name}</div>}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="ts-modal-footer">
            <button type="button" className="ts-btn light" onClick={handleClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="ts-btn primary" disabled={loading || !file || !reason.trim()}>
              {loading ? "Enviando…" : "Enviar Justificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbsenceJustificationModal;
