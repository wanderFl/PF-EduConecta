import React, { useMemo, useState } from "react";
import type { PendingTask } from "../../types";
import { getSignedUploadUrl, submitTaskDelivery } from "../../services/familia";
import { useFamily } from "../../contexts/useFamily";

type Props = {
  open: boolean;
  task: PendingTask | null;
  onClose: () => void;
  onSubmitted?: () => void; // para refrescar calendario tras enviar
};

const TaskSubmissionModal: React.FC<Props> = ({ open, task, onClose, onSubmitted }) => {
  const { selectedStudent } = useFamily();

  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = useMemo(() => {
    if (!task) return "";
    const d = new Date(task.due_date);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: undefined });
  }, [task]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setComments("");
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Flujo completo: URL firmada -> PUT S3 -> registrar entrega
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !file || !selectedStudent) return;

    try {
      setLoading(true);
      setError(null);

      // 1) URL firmada (PUT)
      const { uploadUrl, fileUrl } = await getSignedUploadUrl({
        studentId: selectedStudent.id_estudiante,
        taskId: task.id,
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

      // 3) Registrar entrega en tu API
      await submitTaskDelivery({
        studentId: selectedStudent.id_estudiante,
        taskId: task.id,
        student_comment: comments || undefined,
        file_reference: fileUrl,
      });

      reset();
      onSubmitted?.();
      onClose();
    } catch {
      setError("No se pudo enviar la tarea. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !task) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card ts-modal">
        <div className="ts-modal-header">
          <div className="ts-modal-title">Entrega Tarea</div>
          <button className="ts-close" onClick={handleClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ts-modal-body">
            <div className="ts-field">
              <div className="ts-label">Nombre Tarea</div>
              <div className="ts-text">
                <b>{task.title}</b>
                {task.course_name ? ` — ${task.course_name}` : ""} · {formattedDate}
              </div>
            </div>

            <div className="ts-field">
              <div className="ts-label">Instrucciones</div>
              <div className="ts-text">
                {task.instructions ?? "Adjunta el archivo solicitado y agrega comentarios si es necesario."}
              </div>
            </div>

            <div className="ts-field">
              <div className="ts-label">Cargar Archivo <span className="ts-required">*</span></div>
              <input
                className="ts-input-file"
                type="file"
                required
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {file && <div className="ts-file-name" title={file.name}>{file.name}</div>}
            </div>

            <div className="ts-field">
              <div className="ts-label">Comentarios</div>
              <textarea
                className="ts-textarea"
                rows={4}
                placeholder="Escribe comentarios para el docente (opcional)…"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="ts-modal-footer">
            <button type="button" className="ts-btn light" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="ts-btn primary" disabled={!file || loading}>
              {loading ? "Enviando…" : "Enviar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskSubmissionModal;
